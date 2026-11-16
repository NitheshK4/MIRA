// ============================================================================
// FILE: scraper.js
// PURPOSE: Intelligent Double-Engine Competitor Web Scraper & Screenshot Archiver
// LOGIC OVERVIEW:
// 1. Dual Scrape Architecture:
//      - Fast Engine (Axios + Cheerio): Lightweight, sub-second static HTML scraping.
//      - Dynamic Engine (Puppeteer Headless): Full Chrome JS execution for SPAs + screenshot capture.
// 2. Strict Memory Optimization:
//      - Blocks images, videos, fonts, and WebSockets inside Puppeteer to stay under 512MB RAM.
// 3. Noise Stripping Pipeline (`cleanHtml`):
//      - Strips cookie banners, popups, GDPR dialogs, navigation bars, headers, and footers.
//      - Extracts clean, high-signal semantic text lines.
// ============================================================================

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// User-Agent rotation pool to prevent bot detection and rate-limiting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================================================
// CORE LOGIC: cleanHtml
// PURPOSE: Removes HTML boilerplate, navigation, cookie banners & extracts clean text
// LOGIC STEPS:
//   Step 1: Remove non-content tags (<script>, <style>, <iframe>, <nav>, <footer>).
//   Step 2: Prune cookie consent dialogs (OneTrust, Optanon, modals).
//   Step 3: Target designated scope container ('pricing', 'careers', or custom selector).
//   Step 4: Extract text lines, filter UI noise (e.g. "click", "accept"), and deduplicate.
// ============================================================================
function cleanHtml($, scope = 'full', customSelector = null) {
  // Step 1: Remove structural non-content elements
  $('script').remove();
  $('style').remove();
  $('iframe').remove();
  $('noscript').remove();
  $('header').remove();
  $('footer').remove();
  $('nav').remove();
  
  // Step 2: Strip common cookie consent, popup, and banner selectors
  const noiseSelectors = [
    '[class*="cookie"]', '[id*="cookie"]', 
    '[class*="consent"]', '[id*="consent"]',
    '[class*="banner"]', '[id*="banner"]',
    '[class*="popup"]', '[id*="popup"]',
    '[class*="modal"]', '[id*="modal"]',
    '[class*="ad-"]', '[class*="advertisement"]',
    '#onetrust-consent-sdk', '.optanon-consent-sdk',
    '[role="dialog"]', '[aria-modal="true"]'
  ];
  
  noiseSelectors.forEach(selector => {
    try {
      $(selector).remove();
    } catch (e) {
      // Ignore invalid CSS selectors
    }
  });

  // Step 3: Identify targeted container based on monitoring scope
  let targetElement = $('body');

  if (customSelector) {
    const selected = $(customSelector);
    if (selected.length > 0) {
      targetElement = selected;
    }
  } else if (scope === 'pricing') {
    // Focus specifically on pricing grids, tiers, and subscription tables
    const pricingSelectors = [
      '#pricing', '.pricing', 'section[id*="pricing"]', 'div[class*="pricing"]',
      '#price', '.price', 'div[class*="plan"]', 'div[class*="tier"]'
    ];
    for (const selector of pricingSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        targetElement = found;
        break;
      }
    }
  } else if (scope === 'careers') {
    // Focus specifically on job openings and career listings
    const careersSelectors = [
      '#careers', '.careers', 'section[id*="careers"]', 'div[class*="careers"]',
      '#jobs', '.jobs', 'div[class*="job-"]', 'div[class*="opening"]'
    ];
    for (const selector of careersSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        targetElement = found;
        break;
      }
    }
  }

  // Step 4: Extract meaningful text lines
  const lines = [];
  targetElement.find('*').each(function() {
    const text = $(this).clone().children().remove().end().text().trim();
    if (text) {
      // Filter out low-value UI noise words
      if (text.length > 1 && !text.match(/^(click|login|signup|share|follow|scroll|cookie|close|accept|decline|ok|yes|no)$/i)) {
        lines.push(text);
      }
    }
  });

  // Deduplicate consecutive identical lines (common in tables or repetitive lists)
  const cleanLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 || lines[i] !== lines[i - 1]) {
      cleanLines.push(lines[i]);
    }
  }

  return cleanLines.join('\n');
}

// ============================================================================
// CORE LOGIC: scrapeStatic
// PURPOSE: Fast, lightweight static HTTP scrape via Axios and Cheerio (< 1s)
// ============================================================================
async function scrapeStatic(url, scope = 'full', customSelector = null) {
  const ua = getRandomUserAgent();
  const response = await axios.get(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const textContent = cleanHtml($, scope, customSelector);
  return {
    textContent,
    htmlContent: response.data
  };
}

// ============================================================================
// CORE LOGIC: scrapeDynamic
// PURPOSE: Full Chromium browser rendering for JavaScript SPAs & visual screenshot
// OPTIMIZATION: Strips images, fonts, and media requests to maintain a <= 512MB RAM footprint
// ============================================================================
async function scrapeDynamic(url, scope = 'full', customSelector = null, competitorId = 'temp') {
  const ua = getRandomUserAgent();
  
  // Launch Chromium with aggressive memory-saving flags
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process', // Critical for keeping RAM usage minimal
      '--no-zygote',
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1280, height: 800 });

    // Request interception: Abort images, media, and fonts to save memory and network bandwidth
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font', 'websocket'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate with a 30s timeout
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Allow brief settle window for client-side JS / React / Vue rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);
    const textContent = cleanHtml($, scope, customSelector);

    // Capture visual snapshot for visual diff auditing in the dashboard
    let screenshotPath = '';
    try {
      const filename = `${competitorId}_${Date.now()}.png`;
      const fullPath = path.join(SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: fullPath, type: 'png' });
      screenshotPath = `/screenshots/${filename}`;
    } catch (err) {
      console.error('Failed to take screenshot:', err.message);
    }

    return {
      textContent,
      htmlContent,
      screenshotPath
    };
  } finally {
    // Ensure browser process is always terminated
    await browser.close();
  }
}

// ============================================================================
// CORE LOGIC: runScrape
// PURPOSE: Unified scrape controller with automatic fallback
// LOGIC:
//   - If competitor has `js_enabled === true`, invokes `scrapeDynamic` directly.
//   - If static, executes `scrapeStatic` first. If static fetch fails (e.g. bot firewall),
//     automatically falls back to `scrapeDynamic`.
// ============================================================================
async function runScrape(competitor) {
  const { url, scope, js_enabled, id } = competitor;

  if (js_enabled) {
    return await scrapeDynamic(url, scope, null, id);
  } else {
    try {
      const result = await scrapeStatic(url, scope, null);
      
      // Attempt visual screenshot capture
      let screenshotPath = '';
      try {
        const pResult = await scrapeDynamic(url, scope, null, id);
        screenshotPath = pResult.screenshotPath;
      } catch (e) {
        console.error('Screenshot capture failed for static page:', e.message);
      }
      
      return {
        textContent: result.textContent,
        htmlContent: result.htmlContent,
        screenshotPath
      };
    } catch (err) {
      // Fallback: If static scraping fails, attempt dynamic Puppeteer scrape
      console.log(`Static scrape failed for ${url}, trying dynamic fallback...`);
      try {
        const pResult = await scrapeDynamic(url, scope, null, id);
        return {
          textContent: pResult.textContent,
          htmlContent: pResult.htmlContent,
          screenshotPath: pResult.screenshotPath
        };
      } catch (fallbackErr) {
        throw new Error(`Static scrape failed: ${err.message}. Dynamic fallback also failed: ${fallbackErr.message}`);
      }
    }
  }
}

module.exports = {
  scrapeStatic,
  scrapeDynamic,
  runScrape
};

module.exports = {
  scrapeStatic,
  scrapeDynamic,
  runScrape
};
