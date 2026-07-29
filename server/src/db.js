const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'database.sqlite');

let dbInstance = null;

async function runMigrations(db) {
  console.log('Running SQLite workspace migrations...');
  
  // 1. Add workspace_id columns to existing tables
  try {
    await db.exec('ALTER TABLE competitors ADD COLUMN workspace_id TEXT DEFAULT "default"');
  } catch (e) {}
  
  try {
    await db.exec('ALTER TABLE intelligence_cards ADD COLUMN workspace_id TEXT DEFAULT "default"');
  } catch (e) {}

  // Remove UNIQUE constraint from competitors(url) if present
  try {
    const tableMaster = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='competitors'");
    if (tableMaster && tableMaster.sql && (tableMaster.sql.includes('url TEXT UNIQUE') || tableMaster.sql.includes('UNIQUE(url)') || tableMaster.sql.includes('UNIQUE (url)'))) {
      console.log('Migrating competitors table to remove global UNIQUE(url) constraint...');
      await db.exec('PRAGMA foreign_keys = OFF');
      const oldCompetitors = await db.all('SELECT * FROM competitors');
      await db.exec('DROP TABLE competitors');
      await db.exec(`
        CREATE TABLE competitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id TEXT DEFAULT 'default',
          name TEXT,
          url TEXT,
          interval_hours INTEGER DEFAULT 6,
          scope TEXT DEFAULT 'full',
          status TEXT DEFAULT 'active',
          last_checked TEXT,
          js_enabled INTEGER DEFAULT 0,
          created_at TEXT,
          enrichment_data TEXT
        );
      `);
      for (const comp of oldCompetitors) {
        await db.run(
          `INSERT INTO competitors (id, workspace_id, name, url, interval_hours, scope, status, last_checked, js_enabled, created_at, enrichment_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            comp.id,
            comp.workspace_id || 'default',
            comp.name,
            comp.url,
            comp.interval_hours || 6,
            comp.scope || 'full',
            comp.status || 'active',
            comp.last_checked || null,
            comp.js_enabled || 0,
            comp.created_at || new Date().toISOString(),
            comp.enrichment_data || null
          ]
        );
      }
      await db.exec('PRAGMA foreign_keys = ON');
    }
  } catch (err) {
    console.warn('Competitors table migration failed:', err.message);
    try { await db.exec('PRAGMA foreign_keys = ON'); } catch (_) {}
  }

  // Create composite unique index scoped to workspace_id and url
  try {
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_workspace_url ON competitors(workspace_id, url)');
  } catch (e) {}

  // 2. Migrate profile table to support workspace_id PK
  const profileInfo = await db.all('PRAGMA table_info(profile)');
  const profileHasWorkspaceId = profileInfo.some(col => col.name === 'workspace_id');
  if (!profileHasWorkspaceId) {
    console.log('Migrating profile table to workspace_id primary key...');
    try {
      const oldProfiles = await db.all('SELECT * FROM profile');
      await db.exec('DROP TABLE IF EXISTS profile');
      await db.exec(`
        CREATE TABLE profile (
          workspace_id TEXT PRIMARY KEY,
          business_name TEXT,
          product_desc TEXT,
          customers TEXT,
          price_point TEXT
        )
      `);
      if (oldProfiles.length > 0) {
        const latest = oldProfiles[oldProfiles.length - 1];
        await db.run(
          'INSERT OR REPLACE INTO profile (workspace_id, business_name, product_desc, customers, price_point) VALUES (?, ?, ?, ?, ?)',
          ['default', latest.business_name, latest.product_desc, latest.customers, latest.price_point]
        );
      }
    } catch (err) {
      console.warn('Profile table migration failed. Recreating...', err.message);
      await db.exec('DROP TABLE IF EXISTS profile');
      await db.exec(`
        CREATE TABLE profile (
          workspace_id TEXT PRIMARY KEY,
          business_name TEXT,
          product_desc TEXT,
          customers TEXT,
          price_point TEXT
        )
      `);
    }
  }

  // 3. Migrate settings table to composite PK (workspace_id, key)
  const settingsInfo = await db.all('PRAGMA table_info(settings)');
  const settingsHasWorkspaceId = settingsInfo.some(col => col.name === 'workspace_id');
  if (!settingsHasWorkspaceId) {
    console.log('Migrating settings table to composite primary key...');
    try {
      const oldSettings = await db.all('SELECT * FROM settings');
      await db.exec('DROP TABLE IF EXISTS settings');
      await db.exec(`
        CREATE TABLE settings (
          workspace_id TEXT,
          key TEXT,
          value TEXT,
          PRIMARY KEY(workspace_id, key)
        )
      `);
      for (const row of oldSettings) {
        await db.run(
          'INSERT OR REPLACE INTO settings (workspace_id, key, value) VALUES (?, ?, ?)',
          ['default', row.key, row.value]
        );
      }
      // Ensure default keys
      await db.run('INSERT OR IGNORE INTO settings (workspace_id, key, value) VALUES (?, ?, ?)', ['default', 'outbound_webhook_url', '']);
    } catch (err) {
      console.warn('Settings table migration failed. Recreating...', err.message);
      await db.exec('DROP TABLE IF EXISTS settings');
      await db.exec(`
        CREATE TABLE settings (
          workspace_id TEXT,
          key TEXT,
          value TEXT,
          PRIMARY KEY(workspace_id, key)
        )
      `);
    }
  }

  // 4. Automatically copy default settings to global settings if global settings are missing
  try {
    const globalSettings = await db.all('SELECT * FROM settings WHERE workspace_id = "global"');
    // We check if crm_config is missing or inactive in global
    const hasGlobalCrm = globalSettings.some(s => s.key === 'crm_config' && s.value && JSON.parse(s.value).active_crm !== 'none');
    if (!hasGlobalCrm) {
      console.log('Copying default workspace settings to global workspace settings...');
      const defaultSettings = await db.all('SELECT * FROM settings WHERE workspace_id = "default"');
      for (const row of defaultSettings) {
        // Skip api_key so workspaces keep their generated extensions isolated if needed, or copy it if you want
        await db.run(
          'INSERT OR REPLACE INTO settings (workspace_id, key, value) VALUES ("global", ?, ?)',
          [row.key, row.value]
        );
      }
    }
  } catch (e) {
    console.warn('Failed to copy default settings to global settings:', e.message);
  }
}

async function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON');

  // Initialize tables
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      workspace_id TEXT PRIMARY KEY,
      business_name TEXT,
      product_desc TEXT,
      customers TEXT,
      price_point TEXT
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT DEFAULT 'default',
      name TEXT,
      url TEXT,
      interval_hours INTEGER DEFAULT 6,
      scope TEXT DEFAULT 'full', -- 'full', 'pricing', 'careers'
      status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
      last_checked TEXT,
      js_enabled INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS scrapes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER,
      timestamp TEXT,
      text_content TEXT,
      screenshot_path TEXT,
      FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS intelligence_cards (
      id TEXT PRIMARY KEY,
      workspace_id TEXT DEFAULT 'default',
      competitor_id INTEGER,
      category TEXT,
      summary TEXT,
      impact_score INTEGER,
      justification TEXT,
      recommendation TEXT,
      screenshot_path TEXT,
      crm_sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
      crm_error TEXT,
      is_read INTEGER DEFAULT 0,
      timestamp TEXT,
      FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crm_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT UNIQUE,
      retries INTEGER DEFAULT 0,
      last_attempt TEXT,
      FOREIGN KEY(card_id) REFERENCES intelligence_cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      workspace_id TEXT,
      key TEXT,
      value TEXT,
      PRIMARY KEY(workspace_id, key)
    );

    CREATE TABLE IF NOT EXISTS battlecards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT DEFAULT 'default',
      competitor_id INTEGER NOT NULL,
      overview TEXT,
      strengths TEXT,
      weaknesses TEXT,
      why_we_win TEXT,
      pricing_comparison TEXT,
      objection_handling TEXT,
      landmines TEXT,
      battleguard TEXT,
      target_icp TEXT,
      switching_triggers TEXT,
      elevator_pitch TEXT,
      last_generated_at TEXT,
      UNIQUE(workspace_id, competitor_id),
      FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );
  `);

  // Try adding dynamic columns to existing tables
  try {
    await dbInstance.exec('ALTER TABLE competitors ADD COLUMN enrichment_data TEXT');
  } catch (e) {}

  try {
    await dbInstance.exec('ALTER TABLE battlecards ADD COLUMN target_icp TEXT');
  } catch (e) {}
  try {
    await dbInstance.exec('ALTER TABLE battlecards ADD COLUMN switching_triggers TEXT');
  } catch (e) {}
  try {
    await dbInstance.exec('ALTER TABLE battlecards ADD COLUMN elevator_pitch TEXT');
  } catch (e) {}

  // Try adding battleguard column to battlecards table dynamically
  try {
    await dbInstance.exec('ALTER TABLE battlecards ADD COLUMN battleguard TEXT');
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Run schema migrations for workspace isolation support
  await runMigrations(dbInstance);

  return dbInstance;
}

// Profile operations
async function getProfile(workspaceId = 'default') {
  const db = await getDb();
  let p = await db.get('SELECT * FROM profile WHERE workspace_id = ?', [workspaceId]);
  if (!p && workspaceId === 'default') {
    p = await saveProfile('default', {
      business_name: 'WorkflowSync',
      product_desc: 'AI-powered workflow automation & competitor intelligence engine',
      customers: 'B2B SaaS companies, marketing agencies, sales teams',
      price_point: '$80/mo'
    });
  }
  return p;
}

async function saveProfile(workspaceId = 'default', profileData) {
  let finalWorkspaceId = workspaceId;
  let finalProfileData = profileData;
  if (typeof workspaceId === 'object' && workspaceId !== null && !profileData) {
    finalProfileData = workspaceId;
    finalWorkspaceId = 'default';
  }
  const db = await getDb();
  await db.run(
    'INSERT OR REPLACE INTO profile (workspace_id, business_name, product_desc, customers, price_point) VALUES (?, ?, ?, ?, ?)',
    [finalWorkspaceId, finalProfileData.business_name, finalProfileData.product_desc, finalProfileData.customers, finalProfileData.price_point]
  );
  return await getProfile(finalWorkspaceId);
}

// Competitor operations
async function addCompetitor(workspaceId = 'default', competitor) {
  let finalWorkspaceId = workspaceId;
  let finalCompetitor = competitor;
  if (typeof workspaceId === 'object' && workspaceId !== null && !competitor) {
    finalCompetitor = workspaceId;
    finalWorkspaceId = 'default';
  }
  const db = await getDb();
  const now = new Date().toISOString();
  const trimmedUrl = (finalCompetitor.url || '').trim();
  const result = await db.run(
    'INSERT INTO competitors (workspace_id, name, url, interval_hours, scope, status, js_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      finalWorkspaceId,
      finalCompetitor.name,
      trimmedUrl,
      finalCompetitor.interval_hours || 6,
      finalCompetitor.scope || 'full',
      finalCompetitor.status || 'active',
      finalCompetitor.js_enabled || 0,
      now
    ]
  );
  return { id: result.lastID, workspace_id: finalWorkspaceId, ...finalCompetitor, url: trimmedUrl, created_at: now };
}

async function getCompetitors(workspaceId = null) {
  const db = await getDb();
  if (workspaceId && typeof workspaceId === 'string') {
    return await db.all('SELECT * FROM competitors WHERE workspace_id = ? ORDER BY id DESC', [workspaceId]);
  } else {
    return await db.all('SELECT * FROM competitors ORDER BY id DESC');
  }
}

async function getCompetitorById(workspaceId = 'default', id) {
  let finalWorkspaceId = workspaceId;
  let finalId = id;
  if (id === undefined) {
    finalId = workspaceId;
    finalWorkspaceId = null;
  }
  const db = await getDb();
  if (finalWorkspaceId) {
    return await db.get('SELECT * FROM competitors WHERE id = ? AND workspace_id = ?', [finalId, finalWorkspaceId]);
  }
  return await db.get('SELECT * FROM competitors WHERE id = ?', [finalId]);
}

async function getCompetitorByUrl(workspaceId = 'default', url) {
  let finalWorkspaceId = workspaceId;
  let finalUrl = url;
  if (!url) {
    finalUrl = workspaceId;
    finalWorkspaceId = 'default';
  }
  const db = await getDb();
  const trimmed = (finalUrl || '').trim();
  const urlWithoutSlash = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  const urlWithSlash = urlWithoutSlash + '/';
  return await db.get(
    'SELECT * FROM competitors WHERE workspace_id = ? AND (url = ? OR url = ?)',
    [finalWorkspaceId, urlWithoutSlash, urlWithSlash]
  );
}

async function updateCompetitor(id, updates) {
  const db = await getDb();
  const fields = [];
  const params = [];
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    params.push(val);
  }
  params.push(id);
  await db.run(`UPDATE competitors SET ${fields.join(', ')} WHERE id = ?`, params);
  return await getCompetitorById(id);
}

async function deleteCompetitor(id) {
  const db = await getDb();
  await db.run('DELETE FROM competitors WHERE id = ?', [id]);
  return true;
}

// Scrape operations
async function saveScrape(scrape) {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO scrapes (competitor_id, timestamp, text_content, screenshot_path) VALUES (?, ?, ?, ?)',
    [scrape.competitor_id, scrape.timestamp, scrape.text_content, scrape.screenshot_path || '']
  );
  return { id: result.lastID, ...scrape };
}

async function getLatestScrape(competitorId) {
  const db = await getDb();
  return await db.get(
    'SELECT * FROM scrapes WHERE competitor_id = ? ORDER BY id DESC LIMIT 1',
    [competitorId]
  );
}

async function getScrapeHistory(competitorId) {
  const db = await getDb();
  return await db.all(
    'SELECT * FROM scrapes WHERE competitor_id = ? ORDER BY id DESC',
    [competitorId]
  );
}

async function getScrapes(competitorId, limit = 5) {
  const db = await getDb();
  return await db.all(
    'SELECT * FROM scrapes WHERE competitor_id = ? ORDER BY id DESC LIMIT ?',
    [competitorId, limit]
  );
}

// Intelligence Card operations
async function saveIntelligenceCard(card) {
  const db = await getDb();
  await db.run(
    'INSERT INTO intelligence_cards (id, workspace_id, competitor_id, category, summary, impact_score, justification, recommendation, screenshot_path, crm_sync_status, crm_error, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      card.id,
      card.workspace_id || 'default',
      card.competitor_id,
      card.category,
      card.summary,
      card.impact_score,
      card.justification,
      card.recommendation,
      card.screenshot_path || '',
      card.crm_sync_status || 'pending',
      card.crm_error || '',
      card.timestamp
    ]
  );
  return card;
}

async function getIntelligenceCards(workspaceId = null, filters = {}) {
  let finalWorkspaceId = workspaceId;
  let finalFilters = filters;
  if (typeof workspaceId === 'object' && workspaceId !== null && Object.keys(filters).length === 0) {
    finalFilters = workspaceId;
    finalWorkspaceId = null;
  }
  const db = await getDb();
  let query = `
    SELECT ic.*, c.name as competitor_name, c.url as competitor_url 
    FROM intelligence_cards ic
    JOIN competitors c ON ic.competitor_id = c.id
  `;
  const conditions = [];
  const params = [];

  if (finalWorkspaceId) {
    conditions.push('ic.workspace_id = ?');
    params.push(finalWorkspaceId);
  }
  if (finalFilters.competitor_id) {
    conditions.push('ic.competitor_id = ?');
    params.push(finalFilters.competitor_id);
  }
  if (finalFilters.category) {
    conditions.push('ic.category = ?');
    params.push(finalFilters.category);
  }
  if (finalFilters.unreadOnly) {
    conditions.push('ic.is_read = 0');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY ic.timestamp DESC';

  return await db.all(query, params);
}

async function getIntelligenceCardById(id) {
  const db = await getDb();
  return await db.get(
    `SELECT ic.*, c.name as competitor_name, c.url as competitor_url 
     FROM intelligence_cards ic
     JOIN competitors c ON ic.competitor_id = c.id
     WHERE ic.id = ?`,
    [id]
  );
}

async function updateIntelligenceCard(id, updates) {
  const db = await getDb();
  const fields = [];
  const params = [];
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    params.push(val);
  }
  params.push(id);
  await db.run(`UPDATE intelligence_cards SET ${fields.join(', ')} WHERE id = ?`, params);
  return await getIntelligenceCardById(id);
}

async function markAllAsRead(workspaceId = 'default') {
  const db = await getDb();
  await db.run('UPDATE intelligence_cards SET is_read = 1 WHERE workspace_id = ?', [workspaceId]);
  return true;
}

// CRM Queue operations
async function enqueueCrmRetry(cardId) {
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = await db.get('SELECT * FROM crm_queue WHERE card_id = ?', [cardId]);
  if (existing) {
    await db.run(
      'UPDATE crm_queue SET retries = retries + 1, last_attempt = ? WHERE card_id = ?',
      [now, cardId]
    );
  } else {
    await db.run(
      'INSERT INTO crm_queue (card_id, retries, last_attempt) VALUES (?, 0, ?)',
      [cardId, now]
    );
  }
}

async function getCrmQueue(workspaceId = null) {
  const db = await getDb();
  let query = `
    SELECT 
      ic.id as card_id,
      COALESCE(cq.retries, 0) as retries,
      cq.last_attempt,
      ic.competitor_id, 
      ic.category, 
      ic.summary, 
      ic.impact_score, 
      ic.justification, 
      ic.recommendation, 
      ic.screenshot_path, 
      ic.timestamp, 
      c.name as competitor_name, 
      c.url as competitor_url, 
      ic.workspace_id
    FROM intelligence_cards ic
    JOIN competitors c ON ic.competitor_id = c.id
    LEFT JOIN crm_queue cq ON ic.id = cq.card_id
    WHERE (ic.crm_sync_status = 'pending' OR ic.crm_sync_status = 'failed')
  `;
  const params = [];
  if (workspaceId) {
    query += ' AND ic.workspace_id = ?';
    params.push(workspaceId);
  }
  query += ' ORDER BY ic.timestamp ASC';
  return await db.all(query, params);
}

async function removeFromCrmQueue(cardId) {
  const db = await getDb();
  await db.run('DELETE FROM crm_queue WHERE card_id = ?', [cardId]);
}

// Settings operations
async function getSetting(workspaceId = 'global', key) {
  let finalWorkspaceId = workspaceId;
  let finalKey = key;
  if (key === undefined) {
    finalKey = workspaceId;
    finalWorkspaceId = 'global';
  }

  const isGlobalKey = finalKey !== 'api_key';
  const queryWorkspaceId = isGlobalKey ? 'global' : finalWorkspaceId;

  const db = await getDb();
  let row = await db.get('SELECT value FROM settings WHERE workspace_id = ? AND key = ?', [queryWorkspaceId, finalKey]);

  if (!row) {
    // Dynamically seed default values for the global or workspace-specific configurations
    const defaults = {
      api_key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      digest_schedule: 'daily',
      last_digest_sent: '',
      slack_webhook_url: process.env.SLACK_WEBHOOK_URL || '',
      outbound_webhook_url: '',
      email_config: JSON.stringify({
        provider: 'resend',
        smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtp_port: parseInt(process.env.SMTP_PORT, 10) || 465,
        smtp_user: process.env.SMTP_USER || '',
        smtp_pass: process.env.SMTP_PASS || process.env.RESEND_API_KEY || process.env.RESEND_KEY || 're_TmsR5PR4_3dXLXczyYi4w1pvaYyDJ2jaZ',
        recipient_email: process.env.SMTP_RECIPIENT || process.env.RECIPIENT_EMAIL || 'nitheshk236@gmail.com'
      }),
      crm_config: JSON.stringify({
        active_crm: process.env.NOTION_TOKEN ? 'notion' : 'none',
        notion_token: process.env.NOTION_TOKEN || '',
        notion_db_id: process.env.NOTION_DB_ID || process.env.NOTION_DATABASE_ID || '',
        airtable_key: '',
        airtable_base_id: '',
        airtable_table_name: 'Competitor Intel'
      })
    };

    if (finalKey in defaults) {
      await db.run(
        'INSERT OR REPLACE INTO settings (workspace_id, key, value) VALUES (?, ?, ?)',
        [queryWorkspaceId, finalKey, defaults[finalKey]]
      );
      row = { value: defaults[finalKey] };
    }
  }

  let val = row ? row.value : null;

  if (finalKey === 'crm_config') {
    try {
      const config = val ? JSON.parse(val) : { active_crm: 'none', notion_token: '', notion_db_id: '', airtable_key: '', airtable_base_id: '', airtable_table_name: 'Competitor Intel' };
      let changed = false;
      if (process.env.NOTION_TOKEN && (!config.notion_token || config.active_crm === 'none')) {
        config.active_crm = 'notion';
        config.notion_token = process.env.NOTION_TOKEN;
        changed = true;
      }
      const envDbId = process.env.NOTION_DB_ID || process.env.NOTION_DATABASE_ID;
      if (envDbId && !config.notion_db_id) {
        config.notion_db_id = envDbId;
        changed = true;
      }
      if (changed) {
        val = JSON.stringify(config);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  } else if (finalKey === 'email_config') {
    try {
      const config = val ? JSON.parse(val) : { provider: 'smtp', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', recipient_email: '' };
      let changed = false;
      if (process.env.SMTP_HOST && !config.smtp_host) {
        config.smtp_host = process.env.SMTP_HOST;
        changed = true;
      }
      if (process.env.SMTP_PORT && !config.smtp_port) {
        config.smtp_port = parseInt(process.env.SMTP_PORT, 10) || 587;
        changed = true;
      }
      if (process.env.SMTP_USER && !config.smtp_user) {
        config.smtp_user = process.env.SMTP_USER;
        changed = true;
      }
      if (process.env.SMTP_PASS && !config.smtp_pass) {
        config.smtp_pass = process.env.SMTP_PASS;
        changed = true;
      }
      const envRecipient = process.env.SMTP_RECIPIENT || process.env.RECIPIENT_EMAIL;
      if (envRecipient && !config.recipient_email) {
        config.recipient_email = envRecipient;
        changed = true;
      }
      if (changed) {
        val = JSON.stringify(config);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  } else if (finalKey === 'slack_webhook_url') {
    if ((!val || val === '') && process.env.SLACK_WEBHOOK_URL) {
      val = process.env.SLACK_WEBHOOK_URL;
    }
  } else if (finalKey === 'api_key') {
    if ((!val || val === '') && process.env.API_KEY) {
      val = process.env.API_KEY;
    }
  }

  return val;
}

async function setSetting(workspaceId = 'global', key, value) {
  let finalWorkspaceId = workspaceId;
  let finalKey = key;
  let finalValue = value;
  if (value === undefined) {
    finalValue = key;
    finalKey = workspaceId;
    finalWorkspaceId = 'global';
  }

  const isGlobalKey = finalKey !== 'api_key';
  const saveWorkspaceId = isGlobalKey ? 'global' : finalWorkspaceId;

  const db = await getDb();
  await db.run(
    'INSERT OR REPLACE INTO settings (workspace_id, key, value) VALUES (?, ?, ?)',
    [saveWorkspaceId, finalKey, finalValue]
  );
  return finalValue;
}

// Battlecard operations
async function getBattlecards(workspaceId = 'default') {
  const db = await getDb();
  return await db.all(`
    SELECT b.*, c.name as competitor_name, c.url as competitor_url
    FROM battlecards b
    JOIN competitors c ON b.competitor_id = c.id
    WHERE b.workspace_id = ?
    ORDER BY c.name ASC
  `, [workspaceId]);
}

async function getBattlecardByCompetitor(workspaceId = 'default', competitorId) {
  const db = await getDb();
  return await db.get(`
    SELECT b.*, c.name as competitor_name, c.url as competitor_url
    FROM battlecards b
    JOIN competitors c ON b.competitor_id = c.id
    WHERE b.workspace_id = ? AND b.competitor_id = ?
  `, [workspaceId, competitorId]);
}

async function saveBattlecard(workspaceId = 'default', competitorId, data) {
  const db = await getDb();
  const now = new Date().toISOString();

  const battleguardValue = typeof data.battleguard === 'string'
    ? data.battleguard
    : JSON.stringify(data.battleguard || null);

  await db.run(`
    INSERT INTO battlecards (
      workspace_id, competitor_id, overview, strengths, weaknesses,
      why_we_win, pricing_comparison, objection_handling, landmines,
      battleguard, target_icp, switching_triggers, elevator_pitch, last_generated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(workspace_id, competitor_id) DO UPDATE SET
      overview = excluded.overview,
      strengths = excluded.strengths,
      weaknesses = excluded.weaknesses,
      why_we_win = excluded.why_we_win,
      pricing_comparison = excluded.pricing_comparison,
      objection_handling = excluded.objection_handling,
      landmines = excluded.landmines,
      battleguard = excluded.battleguard,
      target_icp = excluded.target_icp,
      switching_triggers = excluded.switching_triggers,
      elevator_pitch = excluded.elevator_pitch,
      last_generated_at = excluded.last_generated_at
  `, [
    workspaceId,
    competitorId,
    data.overview || '',
    typeof data.strengths === 'string' ? data.strengths : JSON.stringify(data.strengths || []),
    typeof data.weaknesses === 'string' ? data.weaknesses : JSON.stringify(data.weaknesses || []),
    typeof data.why_we_win === 'string' ? data.why_we_win : JSON.stringify(data.why_we_win || []),
    data.pricing_comparison || '',
    typeof data.objection_handling === 'string' ? data.objection_handling : JSON.stringify(data.objection_handling || []),
    typeof data.landmines === 'string' ? data.landmines : JSON.stringify(data.landmines || []),
    battleguardValue,
    data.target_icp || '',
    typeof data.switching_triggers === 'string' ? data.switching_triggers : JSON.stringify(data.switching_triggers || []),
    data.elevator_pitch || '',
    now
  ]);

  return await getBattlecardByCompetitor(workspaceId, competitorId);
}

async function deleteBattlecard(workspaceId = 'default', competitorId) {
  const db = await getDb();
  await db.run('DELETE FROM battlecards WHERE workspace_id = ? AND competitor_id = ?', [workspaceId, competitorId]);
  return { success: true };
}

module.exports = {
  getDb,
  getProfile,
  saveProfile,
  addCompetitor,
  getCompetitors,
  getCompetitorById,
  getCompetitorByUrl,
  updateCompetitor,
  deleteCompetitor,
  saveScrape,
  getLatestScrape,
  getScrapeHistory,
  getScrapes,
  saveIntelligenceCard,
  getIntelligenceCards,
  getIntelligenceCardById,
  updateIntelligenceCard,
  markAllAsRead,
  enqueueCrmRetry,
  getCrmQueue,
  removeFromCrmQueue,
  getSetting,
  setSetting,
  getBattlecards,
  getBattlecardByCompetitor,
  saveBattlecard,
  deleteBattlecard
};

