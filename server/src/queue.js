// ============================================================================
// FILE: queue.js
// PURPOSE: Autonomous Competitor Processing Pipeline & Sequential Queue Manager
// LOGIC OVERVIEW:
// 1. Manages a FIFO queue of competitor monitoring jobs to prevent resource contention.
// 2. Executes end-to-end intelligence cycle:
//      Scrape -> Enrich (DNS/Tech) -> Semantic Diff -> LLM Analysis -> Card Creation
//      -> Real-time SSE Broadcast -> Slack/Webhook Alert -> CRM Sync -> Battlecard Synthesis.
// 3. Flushes the SQLite CRM retry queue after each run for self-healing synchronization.
// ============================================================================

const { runScrape } = require('./scraper');
const { detectChanges } = require('./detector');
const { analyzeChange, generateBattlecardData } = require('./llm');
const { syncCard, runRetryQueue } = require('./crm');
const { getEnrichmentData } = require('./enrichment');
const { sendSlackNotification } = require('./slack');
const { sendWebhookNotification } = require('./webhook');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

let queue = [];
let isProcessing = false;

// ============================================================================
// QUEUE ENQUEUE: Adds a competitor check job to the queue
// Prevents duplicate concurrent jobs for the same competitor ID
// ============================================================================
function addJob(competitorId) {
  if (!queue.includes(competitorId)) {
    queue.push(competitorId);
    console.log(`Job added to queue: Competitor ID ${competitorId}. Current queue size: ${queue.length}`);
    triggerQueueProcessing();
  }
}

// Initiates queue processing loop if not already running
function triggerQueueProcessing() {
  if (isProcessing) return;
  isProcessing = true;
  processNextJob();
}

// ============================================================================
// CORE LOGIC: processNextJob
// PURPOSE: Primary execution pipeline for scraping, analyzing, and alerting on competitor changes
// LOGIC STEPS:
//   Step 1: Dequeue competitor & fetch configuration from SQLite.
//   Step 2: Scrape webpage content & capture visual screenshot.
//   Step 3: Enrich competitor profile with DNS records and server headers.
//   Step 4: Retrieve historical scrape & execute semantic comparison (cosine similarity).
//   Step 5: If change detected (similarity < threshold):
//             a. LLM analyzes business impact (1-10 score, justification, recommendation).
//             b. Persist intelligence card to DB & broadcast via SSE to dashboard.
//             c. Dispatch real-time Slack alert if score >= 8.
//             d. Fire outbound automation webhook.
//             e. Synchronize card to Notion / Airtable CRM.
//   Step 6: Synthesize/update AI Battlecard living document.
//   Step 7: Flush CRM retry queue for any previous transient failures.
//   Step 8: Recursively process subsequent job in queue.
// ============================================================================
async function processNextJob() {
  if (queue.length === 0) {
    isProcessing = false;
    console.log('Queue is empty. Background processing finished.');
    return;
  }

  const competitorId = queue.shift();
  console.log(`Processing queue job: Competitor ID ${competitorId}...`);

  try {
    const competitor = await db.getCompetitorById(competitorId);
    if (!competitor) {
      console.log(`Skipping job: Competitor ${competitorId} not found in database.`);
      processNextJob();
      return;
    }

    if (competitor.status === 'paused') {
      console.log(`Skipping job: Competitor ${competitorId} (${competitor.name}) is paused.`);
      processNextJob();
      return;
    }

    // --------------------------------------------------------------------------
    // CORE PIPELINE STEP 1: Scrape Webpage & Capture Screenshot
    // --------------------------------------------------------------------------
    console.log(`Scraping URL: ${competitor.url} for ${competitor.name}...`);
    const scrapeResult = await runScrape(competitor);
    
    // Save raw scrape text snapshot in database
    const now = new Date().toISOString();
    await db.saveScrape({
      competitor_id: competitorId,
      timestamp: now,
      text_content: scrapeResult.textContent,
      screenshot_path: scrapeResult.screenshotPath
    });

    // --------------------------------------------------------------------------
    // CORE PIPELINE STEP 2: Secondary Data Source - DNS & Tech Stack Enrichment
    // --------------------------------------------------------------------------
    try {
      const enrichData = await getEnrichmentData(competitor.url);
      if (enrichData) {
        await db.updateCompetitor(competitorId, { enrichment_data: JSON.stringify(enrichData) });
      }
    } catch (enrichErr) {
      console.error('Enrichment execution failed:', enrichErr.message);
    }

    // --------------------------------------------------------------------------
    // CORE PIPELINE STEP 3: Semantic Change Detection
    // Compares latest scrape against immediately preceding historical scrape
    // --------------------------------------------------------------------------
    const scrapes = await db.getScrapeHistory(competitorId);
    // scrapes[0] is the current scrape just saved, scrapes[1] is the previous one
    const previousScrape = scrapes[1] || null;
    const oldText = previousScrape ? previousScrape.text_content : '';

    // Retrieve customizable semantic threshold (default 0.85)
    const thresholdSetting = await db.getSetting('semantic_threshold') || '0.85';
    const threshold = parseFloat(thresholdSetting);

    console.log(`Running semantic comparison for ${competitor.name}...`);
    const detection = await detectChanges(oldText, scrapeResult.textContent, threshold);

    // --------------------------------------------------------------------------
    // CORE PIPELINE STEP 4: LLM Threat Analysis & Scoring
    // Executes only when semantic divergence is detected (similarity < threshold)
    // --------------------------------------------------------------------------
    if (detection.hasChanged) {
      console.log(`Meaningful change detected for ${competitor.name}! Cosine similarity: ${detection.similarity.toFixed(3)}`);

      // Retrieve user's business profile for context-aware analysis
      const profile = await db.getProfile(competitor.workspace_id);

      // Run LLM inference to categorize change and generate actionable advice
      console.log(`Running local LLM impact scoring...`);
      const analysis = await analyzeChange(detection.diffText, profile);

      // Persist newly minted intelligence card
      const cardId = uuidv4();
      const newCard = {
        id: cardId,
        workspace_id: competitor.workspace_id,
        competitor_id: competitorId,
        category: analysis.category,
        summary: analysis.summary,
        impact_score: analysis.impact_score,
        justification: analysis.justification,
        recommendation: analysis.recommendation,
        screenshot_path: scrapeResult.screenshotPath,
        crm_sync_status: 'pending',
        crm_error: '',
        timestamp: now
      };

      await db.saveIntelligenceCard(newCard);

      // Broadcast new card in real time to connected web UI clients via Server-Sent Events (SSE)
      if (global.broadcastSSE) {
        global.broadcastSSE('intel-card-created', {
          card: {
            ...newCard,
            competitor_name: competitor.name
          }
        });
      }

      // ------------------------------------------------------------------------
      // CORE PIPELINE STEP 5: Multi-Channel Alert Dispatch
      // ------------------------------------------------------------------------
      // Send real-time Slack notification for high impact changes (score >= 8)
      if (newCard.impact_score >= 8) {
        try {
          const slackUrl = await db.getSetting(competitor.workspace_id, 'slack_webhook_url');
          if (slackUrl) {
            await sendSlackNotification({
              ...newCard,
              competitor_url: competitor.url
            }, competitor.name, slackUrl);
          }
        } catch (slackErr) {
          console.error('Slack notification dispatch failed:', slackErr.message);
        }
      }

      // Fire outbound webhook for every detected change (Zapier/Make/Discord)
      try {
        const outboundWebhookUrl = await db.getSetting(competitor.workspace_id, 'outbound_webhook_url');
        if (outboundWebhookUrl) {
          await sendWebhookNotification({
            ...newCard,
            competitor_url: competitor.url
          }, competitor.name, outboundWebhookUrl);
        }
      } catch (webhookErr) {
        console.error('Outbound webhook dispatch failed:', webhookErr.message);
      }

      // Push intelligence card to Notion or Airtable CRM
      console.log(`Syncing intelligence card to CRM...`);
      const crmConfigJson = await db.getSetting(competitor.workspace_id, 'crm_config');
      const crmConfig = crmConfigJson ? JSON.parse(crmConfigJson) : null;
      
      const hostUrlSetting = await db.getSetting('global', 'host_url') || 'http://localhost:3000';
      
      const crmResult = await syncCard({
        ...newCard,
        competitor_name: competitor.name,
        competitor_url: competitor.url
      }, crmConfig, hostUrlSetting);

      console.log(`CRM Sync status: ${crmResult.status}`);
    } else {
      console.log(`No meaningful changes detected for ${competitor.name}. Cosine similarity: ${detection.similarity.toFixed(3)}`);
    }

    // --------------------------------------------------------------------------
    // CORE PIPELINE STEP 6: Auto-Synthesize AI Competitive Battlecard
    // Recomputes Strengths, Weaknesses, Killer Questions & Landmines
    // --------------------------------------------------------------------------
    try {
      console.log(`Synthesizing background AI Battlecard for ${competitor.name}...`);
      const recentScrapes = await db.getScrapeHistory(competitorId, 3);
      const intelCards = await db.getIntelligenceCards(competitor.workspace_id, competitorId, 5);
      const businessProfile = await db.getProfile(competitor.workspace_id);
      const userGeminiKey = await db.getSetting(competitor.workspace_id, 'gemini_api_key');

      const battlecardData = await generateBattlecardData(
        competitor,
        recentScrapes,
        intelCards,
        businessProfile,
        userGeminiKey
      );

      const savedCard = await db.saveBattlecard(competitor.workspace_id, competitorId, battlecardData);
      console.log(`✅ Background AI Battlecard synthesized and saved for ${competitor.name}.`);

      if (global.broadcastSSE) {
        global.broadcastSSE('battlecard-updated', {
          competitorId,
          battlecard: savedCard
        });
      }
    } catch (bcardErr) {
      console.error(`Background battlecard auto-synthesis failed for ${competitor.name}:`, bcardErr.message);
    }

    // Mark competitor check as successful
    await db.updateCompetitor(competitorId, {
      status: 'active',
      last_checked: now
    });

    if (global.broadcastSSE) {
      global.broadcastSSE('scan-completed', {
        competitorId,
        name: competitor.name,
        timestamp: now
      });
    }

  } catch (err) {
    console.error(`Pipeline execution failed for Competitor ID ${competitorId}:`, err.message);
    try {
      await db.updateCompetitor(competitorId, {
        status: 'error',
        last_checked: new Date().toISOString()
      });
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // CORE PIPELINE STEP 7: Process CRM Retry Queue (Self-Healing Sync)
  // Retries previously failed Notion/Airtable API requests
  // --------------------------------------------------------------------------
  try {
    const hostUrlSetting = await db.getSetting('global', 'host_url') || 'http://localhost:3000';
    await runRetryQueue(hostUrlSetting);
  } catch (err) {
    console.error('Failed to run CRM retry queue:', err.message);
  }

  // Step 8: Tail call - execute next job in queue
  processNextJob();
}

module.exports = {
  addJob,
  getQueueSize: () => queue.length
};

module.exports = {
  addJob,
  getQueueSize: () => queue.length
};
