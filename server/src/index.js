const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');
const queue = require('./queue');
const llm = require('./llm');
const { sendDigestEmail } = require('./mailer');
const { syncCard } = require('./crm');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve screenshots static directory
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use('/screenshots', express.static(path.join(PUBLIC_DIR, 'screenshots')));

// Set up host url in settings if it changed/initialized
async function initHostUrl() {
  const hostUrl = process.env.RAILWAY_STATIC_URL
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : `http://localhost:${PORT}`;
  await db.setSetting('global', 'host_url', hostUrl);
  console.log(`Application Host URL configured: ${hostUrl}`);
}

// ----------------------------------------------------
// WORKSPACE EXTRACTION MIDDLEWARE
// ----------------------------------------------------
function checkWorkspace(req, res, next) {
  const workspaceId = req.headers['x-workspace-id'] || 'default';
  req.workspaceId = workspaceId;
  next();
}

// ----------------------------------------------------
// EXTENSION AUTH MIDDLEWARE
// ----------------------------------------------------
async function checkExtensionAuth(req, res, next) {
  const requestKey = req.headers['authorization']?.replace('Bearer ', '') || req.query.api_key;

  if (!requestKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing API Key.' });
  }

  try {
    const dbInst = await db.getDb();
    // Query setting to find workspace owner of this API key
    const row = await dbInst.get(
      'SELECT workspace_id FROM settings WHERE key = "api_key" AND value = ?',
      [requestKey]
    );

    if (!row) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key.' });
    }

    req.workspaceId = row.workspace_id;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health check / keep-alive endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------
// SERVER-SENT EVENTS (SSE) REAL-TIME STREAMING
// ----------------------------------------------------
const sseClients = new Set();

app.get('/api/stream/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (res.flushHeaders) res.flushHeaders();

  sseClients.add(res);

  const handshake = JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'MIRA Real-Time Intel SSE Stream Active'
  });
  res.write(`data: ${handshake}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

function broadcastSSE(type, data = {}) {
  const payload = JSON.stringify({
    type,
    timestamp: new Date().toISOString(),
    ...data
  });
  const msg = `data: ${payload}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// 25-second keep-alive ping loop
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(':ping\n\n');
    } catch (_) {
      sseClients.delete(client);
    }
  }
}, 25000);

global.broadcastSSE = broadcastSSE;

// Business Profile (Onboarding)
app.get('/api/profile', checkWorkspace, async (req, res) => {
  try {
    const profile = await db.getProfile(req.workspaceId);
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', checkWorkspace, async (req, res) => {
  try {
    const { business_name, product_desc, customers, price_point } = req.body;
    if (!business_name || !product_desc) {
      return res.status(400).json({ error: 'Business name and product description are required.' });
    }
    const profile = await db.saveProfile(req.workspaceId, { business_name, product_desc, customers, price_point });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Competitors
app.get('/api/competitors', checkWorkspace, async (req, res) => {
  try {
    const list = await db.getCompetitors(req.workspaceId);
    
    // Enrich with change metrics for dashboard
    const enriched = await Promise.all(list.map(async comp => {
      const cards = await db.getIntelligenceCards(req.workspaceId, { competitor_id: comp.id });
      // Filter changes detected this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const changesThisWeek = cards.filter(c => new Date(c.timestamp) > oneWeekAgo).length;

      return {
        ...comp,
        changes_this_week: changesThisWeek
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/competitors', checkWorkspace, async (req, res) => {
  try {
    const { name, url, interval_hours, scope, js_enabled } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required.' });
    }

    const trimmedUrl = url.trim();

    // Basic URL validation
    try {
      new URL(trimmedUrl);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format. Include http:// or https://' });
    }

    const existing = await db.getCompetitorByUrl(req.workspaceId, trimmedUrl);
    if (existing) {
      return res.status(400).json({ error: 'A competitor with this URL is already registered in this workspace.' });
    }

    const comp = await db.addCompetitor(req.workspaceId, {
      name: name.trim(),
      url: trimmedUrl,
      interval_hours: parseInt(interval_hours, 10) || 6,
      scope: scope || 'full',
      js_enabled: js_enabled ? 1 : 0
    });

    // Run first check automatically
    queue.addJob(comp.id);

    if (global.broadcastSSE) {
      global.broadcastSSE('competitor-added', { competitor: comp });
    }

    res.status(201).json(comp);
  } catch (err) {
    if (err.message && (err.message.includes('SQLITE_CONSTRAINT') || err.message.includes('UNIQUE constraint failed'))) {
      return res.status(400).json({ error: 'A competitor with this URL is already registered in this workspace.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/competitors/:id', checkWorkspace, async (req, res) => {
  try {
    const competitor = await db.getCompetitorById(req.params.id);
    if (!competitor || competitor.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }

    const history = await db.getIntelligenceCards(req.workspaceId, { competitor_id: req.params.id });
    const scrapes = await db.getScrapeHistory(req.params.id);

    res.json({
      competitor,
      history,
      latestScrape: scrapes[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/competitors/:id', checkWorkspace, async (req, res) => {
  try {
    const competitor = await db.getCompetitorById(req.params.id);
    if (!competitor || competitor.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }

    const { name, interval_hours, scope, status, js_enabled } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (interval_hours) updates.interval_hours = parseInt(interval_hours, 10);
    if (scope) updates.scope = scope;
    if (status) updates.status = status;
    if (typeof js_enabled !== 'undefined') updates.js_enabled = js_enabled ? 1 : 0;

    const comp = await db.updateCompetitor(req.params.id, updates);
    res.json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/competitors/:id', checkWorkspace, async (req, res) => {
  try {
    const competitor = await db.getCompetitorById(req.params.id);
    if (!competitor || competitor.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }

    await db.deleteCompetitor(req.params.id);

    if (global.broadcastSSE) {
      global.broadcastSSE('competitor-deleted', { competitorId: req.params.id });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/competitors/:id/check', checkWorkspace, async (req, res) => {
  try {
    const comp = await db.getCompetitorById(req.params.id);
    if (!comp || comp.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }

    // Mark as active and reset error
    await db.updateCompetitor(comp.id, { status: 'active' });

    queue.addJob(comp.id);

    if (global.broadcastSSE) {
      global.broadcastSSE('scan-triggered', { competitorId: comp.id, name: comp.name });
    }

    res.json({ success: true, message: 'Check enqueued successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Intelligence Feed
app.get('/api/intelligence', checkWorkspace, async (req, res) => {
  try {
    const { competitor_id, category, unreadOnly } = req.query;
    const list = await db.getIntelligenceCards(req.workspaceId, {
      competitor_id: competitor_id ? parseInt(competitor_id, 10) : undefined,
      category,
      unreadOnly: unreadOnly === 'true'
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint for checking server stats and variables (global fallback)
app.get('/api/debug-status', checkWorkspace, async (req, res) => {
  try {
    const list = await db.getCompetitors(req.workspaceId);
    const dbInst = await db.getDb();
    
    const scrapes = await dbInst.all(
      `SELECT s.id, s.competitor_id, s.timestamp, length(s.text_content) as text_len, substr(s.text_content, 1, 100) as text_preview, s.screenshot_path 
       FROM scrapes s
       JOIN competitors c ON s.competitor_id = c.id
       WHERE c.workspace_id = ?
       ORDER BY s.id DESC LIMIT 20`,
      [req.workspaceId]
    );
    const cards = await dbInst.all(
      'SELECT id, competitor_id, timestamp, category, impact_score FROM intelligence_cards WHERE workspace_id = ? ORDER BY id DESC LIMIT 20',
      [req.workspaceId]
    );

    res.json({
      env: {
        NODE_ENV: process.env.NODE_ENV,
        RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
        PORT: process.env.PORT,
        HAS_GEMINI_KEY: !!process.env.GEMINI_API_KEY
      },
      competitors: list.map(c => ({ id: c.id, name: c.name, status: c.status, last_checked: c.last_checked })),
      scrapes,
      cards
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intelligence/read-all', checkWorkspace, async (req, res) => {
  try {
    await db.markAllAsRead(req.workspaceId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/intelligence/:id', checkWorkspace, async (req, res) => {
  try {
    const card = await db.getIntelligenceCardById(req.params.id);
    if (!card || card.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Intelligence card not found.' });
    }

    const { is_read } = req.body;
    const updates = {};
    if (typeof is_read !== 'undefined') updates.is_read = is_read ? 1 : 0;
    
    const updated = await db.updateIntelligenceCard(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/intelligence/:id/diff-snapshots', checkWorkspace, async (req, res) => {
  try {
    const card = await db.getIntelligenceCardById(req.params.id);
    if (!card || card.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Intelligence card not found.' });
    }

    const competitor = await db.getCompetitorById(card.competitor_id);
    const scrapes = await db.getScrapeHistory(card.competitor_id);

    let currentScrape = scrapes.find(s => s.timestamp === card.timestamp) || scrapes[0] || null;
    let previousScrape = null;

    if (currentScrape) {
      const idx = scrapes.findIndex(s => s.id === currentScrape.id);
      previousScrape = scrapes[idx + 1] || null;
    }

    res.json({
      card,
      competitor: competitor ? { id: competitor.id, name: competitor.name, url: competitor.url } : null,
      currentScrape,
      previousScrape
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intelligence/:id/retry', checkWorkspace, async (req, res) => {
  try {
    const card = await db.getIntelligenceCardById(req.params.id);
    if (!card || card.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Intelligence card not found.' });
    }

    const crmConfigJson = await db.getSetting(req.workspaceId, 'crm_config');
    const crmConfig = crmConfigJson ? JSON.parse(crmConfigJson) : null;
    const hostUrlSetting = await db.getSetting('global', 'host_url') || 'http://localhost:3000';

    const syncRes = await syncCard(card, crmConfig, hostUrlSetting);
    if (syncRes.success) {
      res.json({ success: true, message: 'CRM sync succeeded.' });
    } else {
      res.status(500).json({ error: syncRes.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BATTLECARDS MANAGEMENT API
// ----------------------------------------------------

// Get all battlecards for current workspace
app.get('/api/battlecards', checkWorkspace, async (req, res) => {
  try {
    const cards = await db.getBattlecards(req.workspaceId);
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get battlecard by competitor ID
app.get('/api/battlecards/:competitorId', checkWorkspace, async (req, res) => {
  try {
    const card = await db.getBattlecardByCompetitor(req.workspaceId, req.params.competitorId);
    if (!card) {
      return res.status(404).json({ error: 'Battlecard not found.' });
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate or refresh AI battlecard for competitor
app.post('/api/battlecards/:competitorId/generate', checkWorkspace, async (req, res) => {
  try {
    const competitorId = req.params.competitorId;
    const competitor = await db.getCompetitorById(req.workspaceId, competitorId);
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }

    const recentScrapes = await db.getScrapeHistory(competitorId);
    const intelCards = await db.getIntelligenceCards(req.workspaceId, competitorId);
    const profile = await db.getProfile(req.workspaceId);
    const geminiKeySetting = await db.getSetting(req.workspaceId, 'gemini_api_key') || await db.getSetting('global', 'gemini_api_key');

    const generatedData = await llm.generateBattlecardData(competitor, recentScrapes, intelCards, profile, geminiKeySetting);
    const savedCard = await db.saveBattlecard(req.workspaceId, competitorId, generatedData);

    res.json(savedCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually update battlecard
app.put('/api/battlecards/:competitorId', checkWorkspace, async (req, res) => {
  try {
    const competitorId = req.params.competitorId;
    const competitor = await db.getCompetitorById(req.workspaceId, competitorId);
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }

    const updatedCard = await db.saveBattlecard(req.workspaceId, competitorId, req.body);
    res.json(updatedCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete battlecard
app.delete('/api/battlecards/:competitorId', checkWorkspace, async (req, res) => {
  try {
    const result = await db.deleteBattlecard(req.workspaceId, req.params.competitorId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings Management
app.get('/api/settings', checkWorkspace, async (req, res) => {
  try {
    const api_key = await db.getSetting(req.workspaceId, 'api_key');
    const digest_schedule = await db.getSetting(req.workspaceId, 'digest_schedule');
    const last_digest_sent = await db.getSetting(req.workspaceId, 'last_digest_sent');
    const emailConfigStr = await db.getSetting(req.workspaceId, 'email_config');
    const crmConfigStr = await db.getSetting(req.workspaceId, 'crm_config');
    const semantic_threshold = await db.getSetting(req.workspaceId, 'semantic_threshold') || '0.85';
    const slack_webhook_url = await db.getSetting(req.workspaceId, 'slack_webhook_url') || '';
    const outbound_webhook_url = await db.getSetting(req.workspaceId, 'outbound_webhook_url') || '';

    res.json({
      api_key,
      digest_schedule,
      last_digest_sent,
      slack_webhook_url,
      outbound_webhook_url,
      semantic_threshold: parseFloat(semantic_threshold),
      email_config: emailConfigStr ? JSON.parse(emailConfigStr) : {},
      crm_config: crmConfigStr ? JSON.parse(crmConfigStr) : {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', checkWorkspace, async (req, res) => {
  try {
    const { api_key, digest_schedule, semantic_threshold, email_config, crm_config, slack_webhook_url, outbound_webhook_url } = req.body;

    if (api_key) await db.setSetting(req.workspaceId, 'api_key', api_key);
    if (digest_schedule) await db.setSetting(req.workspaceId, 'digest_schedule', digest_schedule);
    if (semantic_threshold) await db.setSetting(req.workspaceId, 'semantic_threshold', semantic_threshold.toString());
    if (slack_webhook_url !== undefined) await db.setSetting(req.workspaceId, 'slack_webhook_url', slack_webhook_url);
    if (outbound_webhook_url !== undefined) await db.setSetting(req.workspaceId, 'outbound_webhook_url', outbound_webhook_url);
    
    if (email_config) {
      await db.setSetting(req.workspaceId, 'email_config', JSON.stringify(email_config));
    }
    if (crm_config) {
      await db.setSetting(req.workspaceId, 'crm_config', JSON.stringify(crm_config));
      // Trigger instant background sync for any unsynced cards
      const { runRetryQueue } = require('./crm');
      const hostUrlSetting = await db.getSetting('global', 'host_url') || 'http://localhost:3000';
      runRetryQueue(hostUrlSetting).catch(err => console.error('Failed to run CRM retry queue after save:', err.message));
    }

    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/test-email', checkWorkspace, async (req, res) => {
  try {
    const { email_config } = req.body;
    const resMail = await sendDigestEmail(req.workspaceId, 'test', email_config);
    if (resMail.success) {
      res.json({ success: true, message: `Test email sent successfully. Included ${resMail.count || 0} cards.` });
    } else {
      res.status(500).json({ error: resMail.error || resMail.reason || 'Test send failed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to simulate a competitor's pricing page for local integration testing
app.get('/api/test-page', (req, res) => {
  const price = req.query.price || '99';
  const plan = req.query.plan || 'Standard Starter Plan';
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Competitor Pricing Page</title>
      </head>
      <body>
        <h1>Competitor Outreach Services</h1>
        <div id="pricing-plan" style="padding: 20px; border: 1px solid #ccc; max-width: 300px; border-radius: 8px;">
          <h2>${plan}</h2>
          <p>Get started with our premium cold email outreach platform.</p>
          <p style="font-size: 24px; font-weight: bold; color: green;">$${price}/month</p>
        </div>
        <div id="features" style="margin-top: 15px;">
          <h3>Included Features:</h3>
          <ul>
            <li>10,000 sent emails per month</li>
            <li>5 active target domains</li>
            <li>AI agent writing helper</li>
            <li>Slack notifications integration</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// ----------------------------------------------------
// CHROME EXTENSION ENDPOINTS
// ----------------------------------------------------
app.get('/api/extension/status', checkExtensionAuth, async (req, res) => {
  res.json({ success: true, status: 'connected', version: '1.0.0', workspaceId: req.workspaceId });
});

app.get('/api/extension/unread-count', checkExtensionAuth, async (req, res) => {
  try {
    const cards = await db.getIntelligenceCards(req.workspaceId, { unreadOnly: true });
    res.json({ unreadCount: cards.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/extension/add-competitor', checkExtensionAuth, async (req, res) => {
  try {
    const { name, url, scope } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Competitor name and URL are required.' });
    }

    const trimmedUrl = url.trim();

    try {
      new URL(trimmedUrl);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }

    const existing = await db.getCompetitorByUrl(req.workspaceId, trimmedUrl);
    if (existing) {
      return res.status(400).json({ error: 'A competitor with this URL is already registered in this workspace.' });
    }

    const comp = await db.addCompetitor(req.workspaceId, {
      name: name.trim(),
      url: trimmedUrl,
      interval_hours: 6, // Default interval
      scope: scope || 'full',
      js_enabled: 0 // Default static
    });

    // Enqueue check job immediately
    queue.addJob(comp.id);

    res.status(201).json(comp);
  } catch (err) {
    if (err.message && (err.message.includes('SQLITE_CONSTRAINT') || err.message.includes('UNIQUE constraint failed'))) {
      return res.status(400).json({ error: 'A competitor with this URL is already registered in this workspace.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static build files in production environment
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  console.log(`Serving static production build from ${CLIENT_DIST}`);
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// ----------------------------------------------------
// CRON SCHEDULER LOOPS (POLLING)
// ----------------------------------------------------

// Polling interval loop for checking competitors (runs every 5 minutes)
async function startCompetitorScheduler() {
  console.log('Background competitor check scheduler started.');
  
  const runSchedulerCheck = async () => {
    try {
      const list = await db.getCompetitors(); // Unfiltered gets all competitors of all workspaces
      const now = new Date();
      
      for (const comp of list) {
        if (comp.status === 'paused') continue;

        const lastCheckedStr = comp.last_checked;
        const intervalHours = comp.interval_hours || 6;
        
        let shouldCheck = false;
        if (!lastCheckedStr) {
          shouldCheck = true; // Never checked before
        } else {
          const lastCheckedDate = new Date(lastCheckedStr);
          const diffMs = now - lastCheckedDate;
          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours >= intervalHours) {
            shouldCheck = true;
          }
        }

        if (shouldCheck) {
          console.log(`Scheduler: Competitor ${comp.name} (${comp.url}) in workspace ${comp.workspace_id || 'default'} check is due. Enqueueing.`);
          queue.addJob(comp.id);
        }
      }
    } catch (e) {
      console.error('Error in competitor check scheduler loop:', e.message);
    }
  };

  // Run check immediately on startup
  await runSchedulerCheck();

  // Run every 5 minutes
  setInterval(runSchedulerCheck, 5 * 60 * 1000); // 5 minutes
}

// Polling interval loop for sending digests (runs every hour)
async function startDigestScheduler() {
  console.log('Background email digest scheduler started.');
  setInterval(async () => {
    try {
      const dbInst = await db.getDb();
      // Fetch all distinct workspaces that have settings configured
      const workspaces = await dbInst.all('SELECT DISTINCT workspace_id FROM settings');
      const now = new Date();

      for (const ws of workspaces) {
        const workspaceId = ws.workspace_id;
        const schedule = await db.getSetting(workspaceId, 'digest_schedule') || 'daily';
        const lastSentStr = await db.getSetting(workspaceId, 'last_digest_sent');

        let isDue = false;
        if (!lastSentStr) {
          isDue = true;
        } else {
          const lastSentDate = new Date(lastSentStr);
          const diffMs = now - lastSentDate;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          if (schedule === 'daily' && diffHours >= 24) {
            isDue = true;
          } else if (schedule === 'weekly' && diffHours >= 24 * 7) {
            isDue = true;
          }
        }

        if (isDue) {
          console.log(`Scheduler: ${schedule} digest is due for workspace ${workspaceId}. Sending...`);
          const res = await sendDigestEmail(workspaceId, schedule);
          if (res.success) {
            console.log(`Scheduler: ${schedule} digest successfully processed for workspace ${workspaceId}.`);
          }
        }
      }
    } catch (e) {
      console.error('Error in digest scheduler loop:', e.message);
    }
  }, 60 * 60 * 1000); // 1 hour
}

// Keep-alive loop to prevent free-tier servers from sleeping by self-pinging every 10 minutes
function startKeepAliveScheduler() {
  console.log('Background keep-alive self-ping scheduler started.');
  setInterval(async () => {
    try {
      const hostUrl = await db.getSetting('global', 'host_url');
      if (hostUrl && !hostUrl.includes('localhost')) {
        console.log(`Keep-Alive: Self-pinging endpoint ${hostUrl}/health...`);
        const axios = require('axios');
        await axios.get(`${hostUrl}/health`, { timeout: 10000 });
      }
    } catch (e) {
      console.warn('Keep-Alive self-ping failed:', e.message);
    }
  }, 10 * 60 * 1000); // 10 minutes
}

// ----------------------------------------------------
// SERVER LAUNCH
// ----------------------------------------------------
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    // Initialise host settings
    await initHostUrl();
    
    // Start scheduler loops
    startCompetitorScheduler();
    startDigestScheduler();
    startKeepAliveScheduler();
  } catch (err) {
    console.error('Post startup initialization failed:', err.message);
  }
});
