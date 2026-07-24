const { runScrape } = require('./scraper');
const { detectChanges } = require('./detector');
const { analyzeChange } = require('./llm');
const { syncCard, runRetryQueue } = require('./crm');
const { getEnrichmentData } = require('./enrichment');
const { sendSlackNotification } = require('./slack');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

let queue = [];
let isProcessing = false;

// Add a competitor check job to the queue
function addJob(competitorId) {
  // Prevent duplicate active jobs in queue
  if (!queue.includes(competitorId)) {
    queue.push(competitorId);
    console.log(`Job added to queue: Competitor ID ${competitorId}. Current queue size: ${queue.length}`);
    triggerQueueProcessing();
  }
}

function triggerQueueProcessing() {
  if (isProcessing) return;
  isProcessing = true;
  processNextJob();
}

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

    // 1. Scrape the URL
    console.log(`Scraping URL: ${competitor.url} for ${competitor.name}...`);
    const scrapeResult = await runScrape(competitor);
    
    // Save raw scrape text in DB
    const now = new Date().toISOString();
    await db.saveScrape({
      competitor_id: competitorId,
      timestamp: now,
      text_content: scrapeResult.textContent,
      screenshot_path: scrapeResult.screenshotPath
    });

    // Run data enrichment (2nd data source: DNS and Headers)
    try {
      const enrichData = await getEnrichmentData(competitor.url);
      if (enrichData) {
        await db.updateCompetitor(competitorId, { enrichment_data: JSON.stringify(enrichData) });
      }
    } catch (enrichErr) {
      console.error('Enrichment execution failed:', enrichErr.message);
    }

    // 2. Fetch the previous scrape for semantic diff comparison
    const scrapes = await db.getScrapeHistory(competitorId);
    // scrapes[0] is the current scrape just saved, scrapes[1] is the previous one
    const previousScrape = scrapes[1] || null;
    const oldText = previousScrape ? previousScrape.text_content : '';

    // Retrieve threshold setting
    const thresholdSetting = await db.getSetting('semantic_threshold') || '0.85';
    const threshold = parseFloat(thresholdSetting);

    // 3. Detect changes semantically
    console.log(`Running semantic comparison for ${competitor.name}...`);
    const detection = await detectChanges(oldText, scrapeResult.textContent, threshold);

    if (detection.hasChanged) {
      console.log(`Meaningful change detected for ${competitor.name}! Cosine similarity: ${detection.similarity.toFixed(3)}`);

      // 4. Retrieve business profile for LLM context
      const profile = await db.getProfile(competitor.workspace_id);

      // 5. Run LLM Analysis
      console.log(`Running local LLM impact scoring...`);
      const analysis = await analyzeChange(detection.diffText, profile);

      // Save intelligence card
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

      // 6. Push to CRM
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

    // Success update
    await db.updateCompetitor(competitorId, {
      status: 'active',
      last_checked: now
    });

  } catch (err) {
    console.error(`Pipeline execution failed for Competitor ID ${competitorId}:`, err.message);
    try {
      await db.updateCompetitor(competitorId, {
        status: 'error',
        last_checked: new Date().toISOString()
      });
    } catch (e) {}
  }

  // 7. Post-pipeline: Process CRM retry queue to retry failed syncs
  try {
    const hostUrlSetting = await db.getSetting('global', 'host_url') || 'http://localhost:3000';
    await runRetryQueue(hostUrlSetting);
  } catch (err) {
    console.error('Failed to run CRM retry queue:', err.message);
  }

  // Process next job
  processNextJob();
}

module.exports = {
  addJob,
  getQueueSize: () => queue.length
};
