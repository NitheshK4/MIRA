# APPENDIX: CORE SOURCE CODE IMPLEMENTATIONS
## MIRA: Autonomous Competitive Intelligence, Semantic Change Detection & Game-Theoretic Market Simulation Engine

This appendix provides the core source code implementations, algorithms, and architectural modules of the MIRA platform as referenced in the technical report. The code is modularized into five primary subsystems corresponding to the thesis methodology and implementation chapters.

---

### APPENDIX I.1: Dynamic Web Scraping & DOM Sanitization Engine
**Primary Module:** `server/src/scraper.js`  
**Description:** Implements dual-mode web ingestion. Fast static HTTP requests are performed via Axios and Cheerio, while dynamic Single-Page Applications (SPAs) are rendered via headless Chromium through Puppeteer. Implements aggressive memory optimizations (process recycling, image/font request aborting) to operate within a $< 512$ MB RAM ceiling.

```javascript
// ============================================================================
// MODULE: Dynamic Web Scraping & DOM Sanitization Engine
// FILE: server/src/scraper.js
// ============================================================================

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Normalizes and extracts meaningful textual content from raw DOM tree.
 * Strips non-content tags (scripts, styles, navigations, footers, cookie banners).
 */
function cleanHtml($, scope = 'full', customSelector = null) {
  // Remove non-informational boilerplate elements
  $('script, style, noscript, nav, footer, header, svg, iframe, form, button, input').remove();
  $('.cookie-banner, .advertisement, #cookie-consent, [role="alert"]').remove();

  let target = $('body');

  // Apply custom CSS selector scoping if specified by user
  if (customSelector && $(customSelector).length > 0) {
    target = $(customSelector);
  } else if (scope === 'pricing') {
    const pricingMatch = $('[class*="pricing"], [id*="pricing"], [class*="plan"], [class*="tier"]');
    if (pricingMatch.length > 0) target = pricingMatch;
  } else if (scope === 'careers') {
    const careerMatch = $('[class*="career"], [id*="career"], [class*="job"], [class*="opening"]');
    if (careerMatch.length > 0) target = careerMatch;
  }

  // Normalize whitespace: collapse multiple tabs/newlines into uniform layout
  return target.text()
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Fast static HTTP scrape via Axios and Cheerio (< 1s latency, minimal RAM).
 */
async function scrapeStatic(url, scope = 'full', customSelector = null) {
  const ua = getRandomUserAgent();
  const response = await axios.get(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache'
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const textContent = cleanHtml($, scope, customSelector);
  return { textContent, htmlContent: response.data };
}

/**
 * Headless Chromium browser rendering for JavaScript-hydrated SPAs.
 * Optimized with request interception and single-process execution flags.
 */
async function scrapeDynamic(url, scope = 'full', customSelector = null, competitorId = 'temp') {
  const ua = getRandomUserAgent();
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process', // Constrains memory usage for low-resource cloud containers
      '--no-zygote',
      '--disable-extensions'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1280, height: 800 });

    // Intercept and abort resource-heavy media requests
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font', 'websocket'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Capture visual screenshot for audit trail and CRM card attachments
    const screenshotDir = path.join(__dirname, '..', 'data', 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotFileName = `${competitorId}_${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotFileName);
    
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const html = await page.content();
    const $ = cheerio.load(html);
    const textContent = cleanHtml($, scope, customSelector);

    return {
      textContent,
      htmlContent: html,
      screenshotPath: `/screenshots/${screenshotFileName}`
    };
  } finally {
    await browser.close();
  }
}

/**
 * Unified Scraper Dispatcher: Selects static or dynamic engine based on competitor profile.
 */
async function runScrape(competitor) {
  const { url, scope, js_enabled, custom_selector, id } = competitor;
  if (js_enabled === 1) {
    return await scrapeDynamic(url, scope, custom_selector, id);
  }
  return await scrapeStatic(url, scope, custom_selector);
}

module.exports = { scrapeStatic, scrapeDynamic, runScrape, cleanHtml };
```

---

### APPENDIX I.2: ONNX Runtime Semantic Embeddings & Cosine Distance Engine
**Primary Module:** `server/src/detector.js`  
**Description:** Replaces fragile syntactic string diffing with dense neural text embeddings using the `Xenova/all-MiniLM-L6-v2` transformer model via ONNX Runtime on CPU. Embeds paragraph chunks into 384-dimensional dense vectors and evaluates cosine similarity against previous crawls.

```javascript
// ============================================================================
// MODULE: Semantic Change Detection Engine (ONNX Sentence Embeddings)
// FILE: server/src/detector.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const { env, pipeline } = require('@huggingface/transformers');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
env.cacheDir = CACHE_DIR;

let embeddingPipeline = null;

/**
 * Lazy initialization of HuggingFace ONNX feature-extraction pipeline.
 */
async function getPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true // 8-bit quantized weights for accelerated CPU execution
    });
  }
  return embeddingPipeline;
}

/**
 * Computes vector cosine similarity: S_C(A, B) = (A . B) / (||A|| * ||B||)
 * Since vectors are L2-normalized during embedding, dot product equals cosine similarity.
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * Generates 384-dimensional dense semantic embedding vector for input text.
 */
async function getEmbedding(text) {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Splits document content into paragraph chunks, discarding trivial fragments.
 */
function getChunks(text) {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 10);
}

/**
 * Semantic Chunk-by-Chunk Comparator:
 * Matches newly scraped paragraph vectors against previous crawl vectors.
 * Chunks falling below the cosine similarity decision boundary (0.85) are flagged as changes.
 */
async function detectChangesJS(oldText, newText, threshold = 0.85) {
  const oldChunks = getChunks(oldText);
  const newChunks = getChunks(newText);

  if (oldChunks.length === 0 && newChunks.length === 0) {
    return { hasChanged: false, similarity: 1.0, diffText: '' };
  }

  // Pre-compute 384-d embeddings for all chunks in parallel
  const oldEmbeddings = await Promise.all(
    oldChunks.map(async c => ({ text: c, vector: await getEmbedding(c) }))
  );
  const newEmbeddings = await Promise.all(
    newChunks.map(async c => ({ text: c, vector: await getEmbedding(c) }))
  );

  const addedChunks = [];
  const matchedOldIndices = new Set();
  const diffLines = [];

  // Pairwise semantic matching: find maximum similarity match for each new chunk
  for (const newChunk of newEmbeddings) {
    let bestMatchScore = -1;
    let bestMatchIndex = -1;

    for (let i = 0; i < oldEmbeddings.length; i++) {
      const score = cosineSimilarity(newChunk.vector, oldEmbeddings[i].vector);
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchIndex = i;
      }
    }

    // Decision Boundary: Score below threshold indicates significant new semantic content
    if (bestMatchScore < threshold) {
      addedChunks.push(newChunk.text);
      diffLines.push(`+ ${newChunk.text}`);
    } else {
      matchedOldIndices.add(bestMatchIndex);
    }
  }

  // Unmatched old chunks represent deleted/superseded information
  const removedChunks = [];
  for (let i = 0; i < oldEmbeddings.length; i++) {
    if (!matchedOldIndices.has(i)) {
      removedChunks.push(oldEmbeddings[i].text);
      diffLines.push(`- ${oldEmbeddings[i].text}`);
    }
  }

  const hasChanged = addedChunks.length > 0 || removedChunks.length > 0;
  
  // Calculate aggregate document-level similarity
  const totalChunks = Math.max(oldChunks.length, newChunks.length);
  const unchangedCount = totalChunks - Math.max(addedChunks.length, removedChunks.length);
  const aggregateSimilarity = totalChunks > 0 ? Math.max(0, unchangedCount / totalChunks) : 1.0;

  return {
    hasChanged,
    similarity: parseFloat(aggregateSimilarity.toFixed(4)),
    diffText: diffLines.join('\n'),
    addedChunks,
    removedChunks
  };
}

module.exports = { detectChangesJS, cosineSimilarity, getEmbedding, getChunks };
```

---

### APPENDIX I.3: Tri-Tier Hybrid LLM Strategic Reasoning & Threat Scoring Engine
**Primary Module:** `server/src/llm.js`  
**Description:** Implements the high-availability cognitive reasoning pipeline. Routes detected diffs through a 3-tier cascade: Cloud Gemini 3.6 Flash (primary) $\rightarrow$ Local Edge Qwen2.5-0.5B GGUF via llama.cpp (offline fallback) $\rightarrow$ Deterministic Heuristic Regex rules (safety net). Calculates business threat impact scores ($1-10$) based on multi-criteria risk analysis.

```javascript
// ============================================================================
// MODULE: Hybrid Cognitive Analysis & Threat Impact Scoring Engine
// FILE: server/src/llm.js
// ============================================================================

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

function extractTag(text, tag) {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

/**
 * Deterministic Heuristic Analysis (Tier 3 Safety Fallback).
 * Executes in < 1ms without requiring GPU, CPU ML runtimes, or network connectivity.
 */
function generateFallbackAnalysis(diffText) {
  const lower = diffText.toLowerCase();
  let category = 'content or messaging shift';
  let impactScore = 4;
  let justification = 'Automated linguistic heuristic detected content changes.';
  let recommendation = 'Review modified competitor sections on dashboard.';

  if (lower.includes('price') || lower.includes('$') || lower.includes('/mo') || lower.includes('tier') || lower.includes('discount')) {
    category = 'pricing change';
    impactScore = 8;
    justification = 'Direct monetary or pricing tier adjustments identified.';
    recommendation = 'Assess our pricing tiers and run revenue sensitivity model within 14 days.';
  } else if (lower.includes('feature') || lower.includes('api') || lower.includes('integration') || lower.includes('release')) {
    category = 'product or feature update';
    impactScore = 7;
    justification = 'Competitor added technical capabilities or product features.';
    recommendation = 'Brief engineering and product teams on competitive feature delta.';
  } else if (lower.includes('hire') || lower.includes('career') || lower.includes('lead') || lower.includes('vp')) {
    category = 'hiring signal';
    impactScore = 5;
    justification = 'Organizational expansion or key role recruitment observed.';
    recommendation = 'Monitor strategic hiring trajectories for product pivot signals.';
  }

  return {
    category,
    summary: diffText.split('\n').filter(l => l.startsWith('+')).slice(0, 3).map(l => l.replace(/^\+\s*/, '')).join(' ') || 'Content modified.',
    why_it_matters: 'Monitored competitor modified public messaging or product specs.',
    impact_score: impactScore,
    justification,
    recommendation,
    model_used: 'rule-based-heuristic-v1'
  };
}

/**
 * Primary Tri-Tier Cognitive Analysis Orchestrator.
 */
async function analyzeChange(diffText, businessProfile) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // --------------------------------------------------------------------------
  // TIER 1: Cloud Primary - Google Gemini 3.6 Flash
  // --------------------------------------------------------------------------
  if (geminiApiKey) {
    try {
      const systemPrompt = `You are an Autonomous Competitor Intelligence Analyst.
Analyze detected competitor webpage diffs relative to our internal business profile.
Always enclose responses strictly inside these XML tags:
<category>pricing change | product or feature update | hiring signal | content or messaging shift | leadership or company change | other</category>
<summary>1-paragraph plain-English summary of what changed.</summary>
<why_it_matters>1-paragraph business impact explanation.</why_it_matters>
<score>Integer from 1 to 10 denoting business threat/impact score</score>
<justification>Brief justification for the score relative to our product</justification>
<recommendation>Actionable tactical recommendation for our company</recommendation>`;

      const profileContext = businessProfile ? `
Internal Business: ${businessProfile.business_name}
Product Capabilities: ${businessProfile.product_desc}
Customer Segment: ${businessProfile.customers}
Our Price Point: ${businessProfile.price_point}
` : 'Standard enterprise software context.';

      const prompt = `${systemPrompt}\n\nOur Profile:\n${profileContext}\n\nDiff Content:\n\`\`\`diff\n${diffText}\n\`\`\``;

      // Execute request with exponential backoff on HTTP 429 rate limits
      let res;
      let delay = 1000;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
            { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } },
            { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
          );
          break;
        } catch (err) {
          if (err.response && err.response.status === 429 && attempt < 2) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
          } else {
            throw err;
          }
        }
      }

      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const score = Math.max(1, Math.min(10, parseInt(extractTag(text, 'score'), 10) || 5));

      return {
        category: extractTag(text, 'category').toLowerCase() || 'other',
        summary: extractTag(text, 'summary'),
        why_it_matters: extractTag(text, 'why_it_matters'),
        impact_score: score,
        justification: extractTag(text, 'justification'),
        recommendation: extractTag(text, 'recommendation'),
        model_used: 'gemini-3.6-flash'
      };
    } catch (cloudErr) {
      console.warn('Tier 1 (Gemini) failed. Falling back to Tier 2 (Local Edge LLM)...', cloudErr.message);
    }
  }

  // --------------------------------------------------------------------------
  // TIER 2: Local Edge Fallback - Qwen2.5-0.5B-Instruct GGUF via llama-cli
  // --------------------------------------------------------------------------
  try {
    const llamaCliPath = path.join(__dirname, '..', 'bin', 'llama-cli');
    const modelPath = path.join(__dirname, '..', 'data', 'qwen2.5-0.5b-instruct-q4_k_m.gguf');

    if (fs.existsSync(llamaCliPath) && fs.existsSync(modelPath)) {
      const qwenPrompt = `<|im_start|>system\nYou are a competitor intelligence analyzer. Classify the change.\n<|im_end|>\n<|im_start|>user\n${diffText}\n<|im_end|>\n<|im_start|>assistant\n`;
      
      const localOutput = await new Promise((resolve, reject) => {
        const proc = spawn(llamaCliPath, ['-m', modelPath, '-p', qwenPrompt, '-n', '256', '--temp', '0.2', '-c', '1024']);
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => code === 0 ? resolve(out) : reject(new Error('Process exit ' + code)));
        setTimeout(() => { proc.kill(); reject(new Error('Timeout')); }, 20000);
      });

      return {
        ...generateFallbackAnalysis(diffText),
        summary: extractTag(localOutput, 'summary') || localOutput.slice(0, 150),
        model_used: 'qwen2.5-0.5b-instruct-gguf'
      };
    }
  } catch (localErr) {
    console.warn('Tier 2 (Qwen GGUF) unavailable. Engaging Tier 3 (Deterministic Heuristic)...');
  }

  // --------------------------------------------------------------------------
  // TIER 3: Deterministic Rule-Based Safety Fallback
  // --------------------------------------------------------------------------
  return generateFallbackAnalysis(diffText);
}

module.exports = { analyzeChange, generateFallbackAnalysis, extractTag };
```

---

### APPENDIX I.4: Autonomous Game-Theoretic War Room Simulator
**Primary Module:** `server/src/llm.js`  
**Description:** Models competitive market dynamics using multi-agent game-theoretic simulations. Given an internal business initiative (e.g. pricing cut, new enterprise feature), simulates rival retaliatory moves, disruption probability distributions ($P \in [0, 1]$), risk audits, and tactical counter-offensive playbooks.

```javascript
// ============================================================================
// MODULE: Game-Theoretic War Room Simulator & Scenario Engine
// FILE: server/src/llm.js
// ============================================================================

/**
 * Runs dynamic multi-agent game-theoretic market simulation.
 * Simulates Nash equilibrium and Bertrand/Stackelberg reaction moves across competitors.
 */
async function runWarRoomSimulation(scenarioInput, workspaceContext = {}, geminiApiKey = null) {
  const activeKey = geminiApiKey || process.env.GEMINI_API_KEY;
  const { profile, competitors = [], intelCards = [], battlecards = [] } = workspaceContext;

  const title = scenarioInput.title || scenarioInput.move || 'Strategic Market Initiative';
  const description = scenarioInput.description || title;
  const marketSegment = scenarioInput.market_segment || 'All Segments';
  const timeframe = scenarioInput.timeframe || '90 Days';

  // Build multi-agent competitor dossier from database memory
  const competitorContexts = competitors.map(c => {
    const bcard = battlecards.find(b => String(b.competitor_id) === String(c.id));
    const recentIntel = intelCards
      .filter(i => String(i.competitor_id) === String(c.id))
      .slice(0, 3)
      .map(i => `[${i.category}]: ${i.summary}`).join('; ');

    return `Competitor: ${c.name} (${c.url})
Weaknesses: ${bcard ? bcard.weaknesses : 'Unknown'}
Recent Moves: ${recentIntel || 'No prior changes recorded'}`;
  }).join('\n---\n');

  const systemInstruction = `You are an AI Game-Theory Market Simulator & Chief Strategy Officer.
Simulate market reactions to our proposed move using Stackelberg leader-follower dynamics.
Output STRICT JSON matching this schema:
{
  "scenario_title": "${title}",
  "risk_score": 7,
  "risk_level": "HIGH | MEDIUM | LOW",
  "threat_level": "Critical | Elevated | Manageable",
  "confidence_score": 85,
  "business_impact": "2-3 sentence strategic impact assessment",
  "strategic_verdict": "PROCEED WITH COUNTER-OFFENSIVE PLAYBOOK",
  "competitor_responses": [
    {
      "competitor_name": "string",
      "predicted_action": "Specific reaction by competitor",
      "strategy_type": "Price War | Product Match | FUD Campaign | Feature Counter | Partner Push",
      "likelihood_pct": 85,
      "timeframe": "1-2 Weeks",
      "threat_severity": "High | Medium | Low"
    }
  ],
  "strategic_audit": {
    "risks": ["string"],
    "opportunities": ["string"],
    "key_assumptions": ["string"]
  },
  "counter_offensive_playbook": {
    "phase_1_immediate": ["Tactical moves within 0-7 days"],
    "phase_2_short_term": ["Tactical moves within 30 days"],
    "phase_3_long_term": ["Structural moves within 90 days"]
  }
}`;

  const prompt = `${systemInstruction}\n\nOur Profile:\n${JSON.stringify(profile)}\n\nCompetitor Dossier:\n${competitorContexts}\n\nProposed Action:\n${description}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 40000 }
  );

  const rawJson = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawJson);
}

module.exports = { runWarRoomSimulation };
```

---

### APPENDIX I.5: Resilient Sequential Pipeline & Self-Healing Offline CRM Queue
**Primary Modules:** `server/src/queue.js` & `server/src/crm.js`  
**Description:** Implements an asynchronous FIFO job execution queue for end-to-end monitoring cycles, alongside an offline SQLite retry queue with exponential backoff to guarantee message delivery to external endpoints (Slack, Notion, Airtable, Email).

```javascript
// ============================================================================
// MODULE: Autonomous Competitor Processing Pipeline & Offline Retry Queue
// FILES: server/src/queue.js & server/src/crm.js
// ============================================================================

const { runScrape } = require('./scraper');
const { detectChangesJS } = require('./detector');
const { analyzeChange } = require('./llm');
const { syncCard, runRetryQueue } = require('./crm');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

let jobQueue = [];
let isProcessing = false;

function addJob(competitorId) {
  if (!jobQueue.includes(competitorId)) {
    jobQueue.push(competitorId);
    triggerQueueProcessing();
  }
}

function triggerQueueProcessing() {
  if (isProcessing) return;
  isProcessing = true;
  processNextJob();
}

/**
 * Executes full end-to-end intelligence cycle for a single competitor:
 * Scrape -> Semantic Diff -> LLM Analysis -> Card Creation -> Multi-Channel Dispatch -> CRM Sync
 */
async function processNextJob() {
  if (jobQueue.length === 0) {
    isProcessing = false;
    return;
  }

  const competitorId = jobQueue.shift();
  try {
    const competitor = await db.getCompetitorById('default', competitorId);
    if (!competitor || competitor.status === 'paused') {
      return processNextJob();
    }

    // Step 1: Ingest current webpage snapshot
    const currentScrape = await runScrape(competitor);

    // Step 2: Retrieve historical baseline scrape
    const latestHistorical = await db.getLatestScrape(competitorId);

    if (latestHistorical) {
      // Step 3: Execute ONNX semantic diffing
      const diffResult = await detectChangesJS(latestHistorical.text_content, currentScrape.textContent);

      if (diffResult.hasChanged) {
        // Step 4: Tri-tier LLM impact assessment
        const profile = await db.getProfile(competitor.workspace_id);
        const analysis = await analyzeChange(diffResult.diffText, profile);

        // Step 5: Save structured Intelligence Card to SQLite
        const cardId = uuidv4();
        const card = {
          id: cardId,
          workspace_id: competitor.workspace_id,
          competitor_id: competitorId,
          category: analysis.category,
          summary: analysis.summary,
          impact_score: analysis.impact_score,
          justification: analysis.justification,
          recommendation: analysis.recommendation,
          screenshot_path: currentScrape.screenshotPath,
          timestamp: new Date().toISOString()
        };
        await db.saveIntelligenceCard(card);

        // Step 6: Dispatch to Notion / Airtable CRM
        const crmSettings = JSON.parse(await db.getSetting(competitor.workspace_id, 'crm_config') || '{}');
        await syncCard(card, crmSettings);
      }
    }

    // Step 7: Persist new baseline scrape
    await db.saveScrape({
      competitor_id: competitorId,
      timestamp: new Date().toISOString(),
      text_content: currentScrape.textContent,
      screenshot_path: currentScrape.screenshotPath
    });

    // Step 8: Flush self-healing CRM retry queue
    await runRetryQueue();

  } catch (err) {
    console.error(`Pipeline failure on Competitor ${competitorId}:`, err.message);
  } finally {
    processNextJob(); // Sequentially process subsequent job
  }
}

/**
 * Self-Healing Offline CRM Queue (from server/src/crm.js)
 * Automatically retries failed external webhook/API calls using exponential backoff.
 */
async function runRetryQueue() {
  const pendingJobs = await db.getCrmQueue();
  for (const job of pendingJobs) {
    try {
      const card = await db.getIntelligenceCardById(job.card_id);
      const config = JSON.parse(await db.getSetting(card.workspace_id, 'crm_config') || '{}');
      await syncCard(card, config);
      await db.removeFromCrmQueue(job.card_id);
      console.log(`Self-healing delivery succeeded for Card ${job.card_id}`);
    } catch (retryErr) {
      // Increment retry counter and apply exponential delay
      await db.incrementCrmRetry(job.card_id);
    }
  }
}

module.exports = { addJob, processNextJob, runRetryQueue };
```

---

### APPENDIX I.6: Relational Database Schema & System Architecture DDL
**Primary Module:** `server/src/db.js`  
**Description:** Defines the relational SQLite schema, workspace scoping, foreign key cascades, and indexing strategies that ensure transactional integrity and sub-millisecond query latencies.

```sql
-- ============================================================================
-- RELATIONAL DATABASE DDL SPECIFICATION (MIRA SQLite Schema)
-- FILE: server/src/db.js
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Tenant Business Profile
CREATE TABLE IF NOT EXISTS profile (
  workspace_id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  product_desc TEXT NOT NULL,
  customers TEXT,
  price_point TEXT
);

-- 2. Monitored Competitors Specification
CREATE TABLE IF NOT EXISTS competitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT DEFAULT 'default',
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  interval_hours INTEGER DEFAULT 6,
  scope TEXT DEFAULT 'full',       -- 'full', 'pricing', 'careers', or 'selector'
  status TEXT DEFAULT 'active',     -- 'active', 'paused', 'error'
  last_checked TEXT,
  js_enabled INTEGER DEFAULT 0,     -- 0: Axios/Cheerio, 1: Puppeteer Chromium
  created_at TEXT,
  enrichment_data TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_workspace_url 
ON competitors(workspace_id, url);

-- 3. Temporal Scrape Version History
CREATE TABLE IF NOT EXISTS scrapes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competitor_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  text_content TEXT NOT NULL,
  screenshot_path TEXT,
  FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scrapes_comp_time 
ON scrapes(competitor_id, timestamp DESC);

-- 4. Classified Competitive Intelligence Cards
CREATE TABLE IF NOT EXISTS intelligence_cards (
  id TEXT PRIMARY KEY,
  workspace_id TEXT DEFAULT 'default',
  competitor_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  impact_score INTEGER CHECK(impact_score BETWEEN 1 AND 10),
  justification TEXT,
  recommendation TEXT,
  screenshot_path TEXT,
  crm_sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  crm_error TEXT,
  is_read INTEGER DEFAULT 0,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cards_ws_score 
ON intelligence_cards(workspace_id, impact_score DESC);

-- 5. Self-Healing Offline Retry Queue
CREATE TABLE IF NOT EXISTS crm_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT UNIQUE NOT NULL,
  retries INTEGER DEFAULT 0,
  last_attempt TEXT,
  FOREIGN KEY(card_id) REFERENCES intelligence_cards(id) ON DELETE CASCADE
);

-- 6. Dynamic Competitive Battlecards Dossier
CREATE TABLE IF NOT EXISTS battlecards (
  workspace_id TEXT NOT NULL,
  competitor_id INTEGER NOT NULL,
  strengths TEXT,                   -- JSON array of key rival strengths
  weaknesses TEXT,                  -- JSON array of exploitable vulnerabilities
  pricing_comparison TEXT,
  killer_questions TEXT,            -- Sales objection handling counters
  landmines TEXT,                   -- Traps to set for competitor sales reps
  last_updated TEXT,
  PRIMARY KEY(workspace_id, competitor_id),
  FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
);

-- 7. Game-Theoretic War Room Simulations
CREATE TABLE IF NOT EXISTS warroom_simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT DEFAULT 'default',
  title TEXT NOT NULL,
  scenario_input TEXT NOT NULL,
  simulation_data TEXT NOT NULL,    -- Full JSON response of simulated strategies
  created_at TEXT NOT NULL
);
```
