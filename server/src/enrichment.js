// ============================================================================
// FILE: enrichment.js
// PURPOSE: Automated Competitor Infrastructure & Tech-Stack Discovery
// LOGIC OVERVIEW:
// 1. Extracts domain hostname from a competitor's target URL.
// 2. Resolves IPv4 DNS addresses (`A` records) to locate hosting infrastructure.
// 3. Resolves Mail Exchange (`MX` records) to detect corporate email providers (Google Workspace, M365, etc.).
// 4. Inspects HTTP response headers (`Server`, `X-Powered-By`) to identify web frameworks and servers.
// 5. Returns a structured tech profile stored alongside the competitor record in SQLite.
// ============================================================================

const dns = require('dns').promises;
const { URL } = require('url');
const axios = require('axios');

// ============================================================================
// CORE LOGIC: getEnrichmentData
// PURPOSE: Performs non-intrusive DNS and HTTP header profiling for a competitor
// LOGIC STEPS:
//   Step 1: Parse hostname from the input URL.
//   Step 2: Query DNS A-records (IPv4) & MX-records (Email routing).
//   Step 3: Perform lightweight HEAD/GET request to probe server tech headers.
//   Step 4: Package and return timestamped infrastructure profile object.
// ============================================================================
async function getEnrichmentData(urlStr) {
  try {
    // Step 1: Parse hostname from URL string
    const parsedUrl = new URL(urlStr);
    const hostname = parsedUrl.hostname;
    
    console.log(`Running data enrichment for: ${hostname}...`);

    // --------------------------------------------------------------------------
    // CORE LOGIC: DNS & MX Infrastructure Resolution
    // Resolves server hosting IPs and corporate email routing
    // --------------------------------------------------------------------------
    let ipAddresses = [];
    let mxRecords = [];
    try {
      ipAddresses = await dns.resolve4(hostname);
    } catch (e) {
      console.log(`IP lookup failed for ${hostname}:`, e.message);
    }
    
    try {
      const mx = await dns.resolveMx(hostname);
      mxRecords = mx.map(m => `${m.exchange} (priority: ${m.priority})`);
    } catch (e) {
      console.log(`MX lookup failed for ${hostname}:`, e.message);
    }

    // --------------------------------------------------------------------------
    // CORE LOGIC: Tech Stack HTTP Header Inspection
    // Inspects 'Server' (e.g. Cloudflare, nginx) and 'X-Powered-By' (e.g. Next.js, Express)
    // --------------------------------------------------------------------------
    let serverHeader = 'Unknown';
    let powerHeader = '';
    try {
      const res = await axios.head(urlStr, { timeout: 6000, validateStatus: () => true });
      if (res.headers['server']) serverHeader = res.headers['server'];
      if (res.headers['x-powered-by']) powerHeader = res.headers['x-powered-by'];
    } catch (e) {
      // Fallback to GET request if HEAD is blocked or rejected by target server
      try {
        const res = await axios.get(urlStr, { timeout: 6000, validateStatus: () => true });
        if (res.headers['server']) serverHeader = res.headers['server'];
        if (res.headers['x-powered-by']) powerHeader = res.headers['x-powered-by'];
      } catch (e2) {}
    }

    // Return structured tech profile
    return {
      ipAddresses,
      mxRecords,
      serverHeader,
      xPoweredBy: powerHeader,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Enrichment failed:', err.message);
    return null;
  }
}

module.exports = { getEnrichmentData };
