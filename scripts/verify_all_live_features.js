const path = require('path');
const axios = require('../server/node_modules/axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
const VITE_URL = 'http://localhost:5173';
const TEST_WORKSPACE = 'test_e2e_' + Date.now();
const API_KEY = 'mira_test_key_' + Date.now();

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Workspace-Id': TEST_WORKSPACE,
    'Content-Type': 'application/json'
  },
  timeout: 45000
});

async function runLiveVerification() {
  console.log('===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END FEATURE VERIFICATION SUITE');
  console.log(`Target: ${BASE_URL} | Test Workspace: ${TEST_WORKSPACE}`);
  console.log('===============================================================\n');

  let passedFeatures = 0;
  let totalFeatures = 13;

  try {
    // -------------------------------------------------------------------------
    // FEATURE 1: System Health Check
    // -------------------------------------------------------------------------
    console.log('1️⃣ Checking System Health endpoint (/health)...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert.strictEqual(healthRes.status, 200, 'Health endpoint must return 200');
    assert.strictEqual(healthRes.data.status, 'ok', 'Health status must be ok');
    console.log('   ✅ Feature 1 Passed: Server is healthy and responsive.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 2: Frontend Web App Availability
    // -------------------------------------------------------------------------
    console.log('2️⃣ Checking Frontend Dashboard (Vite on :5173)...');
    const viteRes = await axios.get(VITE_URL);
    assert.strictEqual(viteRes.status, 200, 'Frontend must return 200');
    assert.ok(viteRes.data.includes('<div id="root">'), 'Frontend HTML must contain React root container');
    assert.ok(viteRes.data.includes('src/main.jsx'), 'Frontend HTML must reference main React entrypoint');
    console.log('   ✅ Feature 2 Passed: Frontend UI server is serving the React dashboard application.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 3: Business Profile Onboarding & Workspace Configuration
    // -------------------------------------------------------------------------
    console.log('3️⃣ Checking Business Profile Onboarding API (/api/profile)...');
    const profilePayload = {
      business_name: 'CloudPulse Analytics',
      product_desc: 'Real-time cloud observability and APM platform for microservices.',
      customers: 'DevOps engineers, SREs, and Platform teams',
      price_point: '$150/month per host'
    };
    const saveProfileRes = await client.post('/api/profile', profilePayload);
    assert.strictEqual(saveProfileRes.data.business_name, profilePayload.business_name);

    const getProfileRes = await client.get('/api/profile');
    assert.strictEqual(getProfileRes.data.business_name, profilePayload.business_name);
    assert.strictEqual(getProfileRes.data.product_desc, profilePayload.product_desc);
    console.log('   ✅ Feature 3 Passed: Business profile creation, persistence, and retrieval working.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 4: Competitor Lifecycle Management
    // -------------------------------------------------------------------------
    console.log('4️⃣ Checking Competitor Registration & Lifecycle API (/api/competitors)...');
    const competitorPayload = {
      name: 'Datadog Mock',
      url: 'https://example.com/pricing-test-' + Date.now(),
      interval_hours: 6,
      scope: 'pricing',
      js_enabled: 0
    };
    const compRes = await client.post('/api/competitors', competitorPayload);
    assert.ok(compRes.data.id, 'Competitor must have an assigned ID');
    const competitorId = compRes.data.id;

    // Verify retrieval
    const compListRes = await client.get('/api/competitors');
    const foundComp = compListRes.data.find(c => c.id === competitorId);
    assert.ok(foundComp, 'Competitor must exist in workspace list');

    // Update status (pause)
    await client.put(`/api/competitors/${competitorId}`, { status: 'paused' });
    const compDetailRes = await client.get(`/api/competitors/${competitorId}`);
    assert.strictEqual(compDetailRes.data.competitor.status, 'paused', 'Competitor should be paused');
    console.log('   ✅ Feature 4 Passed: Competitor registration, listing, and lifecycle state updates work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 5: Intelligence Feed & Filtering
    // -------------------------------------------------------------------------
    console.log('5️⃣ Checking Intelligence Cards Feed API (/api/intelligence)...');
    const intelFeedRes = await client.get('/api/intelligence');
    assert.ok(Array.isArray(intelFeedRes.data), 'Feed must return an array');
    
    // Mark all as read
    const readAllRes = await client.post('/api/intelligence/read-all');
    assert.strictEqual(readAllRes.data.success, true);
    console.log('   ✅ Feature 5 Passed: Intelligence feed and batch read status work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 6: Auto-Generated Battlecards & Sales Kill Cards Dossier
    // -------------------------------------------------------------------------
    console.log('6️⃣ Checking Auto-Generated Battlecards & Kill Cards API (/api/battlecards)...');
    const battlecardsRes = await client.get('/api/battlecards');
    assert.ok(Array.isArray(battlecardsRes.data), 'Battlecards endpoint must return an array');

    // Test Battlecard generation endpoint
    const genBattlecardRes = await client.post(`/api/battlecards/${competitorId}/generate`);
    assert.ok(genBattlecardRes.data, 'Battlecard generation should succeed');
    assert.ok(genBattlecardRes.data.strengths || genBattlecardRes.data.weaknesses || genBattlecardRes.data.competitor_id, 'Generated battlecard must have competitive intelligence schema');
    console.log('   ✅ Feature 6 Passed: Auto-generated battlecards and objection-handling dossiers work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 7: MIRA War Room Simulator (Game-Theory Strategy Simulation)
    // -------------------------------------------------------------------------
    console.log('7️⃣ Checking MIRA War Room Simulator API (/api/war-room/simulate)...');
    const simRes = await client.post('/api/war-room/simulate', {
      scenario: 'Competitor drops prices by 25% across all enterprise tiers.',
      description: 'Evaluate immediate market reaction, payoff matrix, and defensive counter-moves.'
    });
    assert.ok(simRes.data, 'War room simulation must return result object');
    assert.ok(simRes.data.scenario_title || simRes.data.recommended_counter_move || simRes.data.id, 'Simulation should provide strategic scenario evaluation');

    // Verify simulation history
    const historyRes = await client.get('/api/war-room/history');
    assert.ok(Array.isArray(historyRes.data), 'War Room history must return an array');
    assert.ok(historyRes.data.length >= 1, 'History must contain the recent simulation');
    console.log('   ✅ Feature 7 Passed: War Room simulator and simulation history persistence work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 8: MIRA Oracle (AI Strategy Co-Pilot Conversational Engine)
    // -------------------------------------------------------------------------
    console.log('8️⃣ Checking MIRA Oracle Strategic Advisory Engine (/api/oracle/chat)...');
    const oracleRes = await client.post('/api/oracle/chat', {
      message: 'What should our immediate defensive strategy be if competitors announce AI features?',
      sessionId: `test_session_${Date.now()}`
    });
    assert.ok(oracleRes.data.reply || oracleRes.data.response, 'Oracle must return conversational advice');
    assert.ok(oracleRes.data.messageId, 'Oracle must persist message with messageId');
    console.log('   ✅ Feature 8 Passed: MIRA Oracle strategy co-pilot reasoning and session storage work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 9: Workspace Settings & API Key Isolation
    // -------------------------------------------------------------------------
    console.log('9️⃣ Checking Workspace Scoped Settings & Integrations (/api/settings)...');
    await client.post('/api/settings', {
      api_key: API_KEY,
      digest_schedule: 'daily',
      semantic_threshold: 0.88,
      slack_webhook_url: 'https://hooks.slack.com/services/test/verify',
      crm_config: { active_crm: 'none' }
    });

    const settingsRes = await client.get('/api/settings');
    assert.strictEqual(settingsRes.data.api_key, API_KEY);
    assert.strictEqual(settingsRes.data.digest_schedule, 'daily');
    assert.strictEqual(settingsRes.data.semantic_threshold, 0.88);
    assert.strictEqual(settingsRes.data.slack_webhook_url, 'https://hooks.slack.com/services/test/verify');
    console.log('   ✅ Feature 9 Passed: Workspace scoped settings and webhook configurations work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 10: Chrome Extension Integration Endpoints
    // -------------------------------------------------------------------------
    console.log('🔟 Checking Chrome Extension API Authentication & Ingestion...');
    // Request with Bearer API Key configured in Feature 9
    const extClient = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const extStatusRes = await extClient.get('/api/extension/status');
    assert.strictEqual(extStatusRes.data.status, 'connected');
    assert.strictEqual(extStatusRes.data.workspaceId, TEST_WORKSPACE);

    const extCountRes = await extClient.get('/api/extension/unread-count');
    assert.ok(typeof extCountRes.data.unreadCount === 'number');

    const extAddRes = await extClient.post('/api/extension/add-competitor', {
      name: 'Extension Ingested Competitor',
      url: 'https://extension-test.com/pricing-' + Date.now()
    });
    assert.ok(extAddRes.data.id, 'Extension ingested competitor should be created');
    console.log('   ✅ Feature 10 Passed: Chrome Extension authentication, unread badges, and 1-click competitor ingestion work.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 11: Debug Status & Diagnostics
    // -------------------------------------------------------------------------
    console.log('1️⃣1️⃣ Checking Diagnostics & Telemetry (/api/debug-status)...');
    const debugRes = await client.get('/api/debug-status');
    assert.ok(debugRes.data.env, 'Debug status should include environment info');
    assert.ok(Array.isArray(debugRes.data.competitors), 'Debug status should include competitor list');
    console.log('   ✅ Feature 11 Passed: Diagnostics telemetry endpoint working.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 12: Cleanup & Safe Teardown
    // -------------------------------------------------------------------------
    console.log('1️⃣2️⃣ Testing Clean Resource Teardown & Cascading Deletions...');
    const delRes = await client.delete(`/api/competitors/${competitorId}`);
    assert.strictEqual(delRes.status, 200);

    const afterList = await client.get('/api/competitors');
    assert.ok(!afterList.data.find(c => c.id === competitorId), 'Deleted competitor must not exist in list');
    console.log('   ✅ Feature 12 Passed: Competitor cascading cleanup and removal working.\n');
    passedFeatures++;

    // -------------------------------------------------------------------------
    // FEATURE 13: Multi-Language Client SDKs (Python & PHP)
    // -------------------------------------------------------------------------
    console.log('1️⃣3️⃣ Verifying Python and PHP SDK Clients...');
    const { execSync } = require('child_process');
    const rootDir = path.join(__dirname, '..');
    const pyOutput = execSync('python3 -m unittest discover -s python/tests 2>&1', { cwd: rootDir }).toString();
    assert.ok(pyOutput.includes('OK'), 'Python SDK tests must pass');
    const phpOutput = execSync('php php/tests/MiraClientTest.php 2>&1', { cwd: rootDir }).toString();
    assert.ok(phpOutput.includes('ALL MIRA PHP TESTS PASSED'), 'PHP SDK tests must pass');
    console.log('   ✅ Feature 13 Passed: Python and PHP client SDK suites pass completely.\n');
    passedFeatures++;

    console.log('===============================================================');
    console.log(`🎉 ALL ${passedFeatures}/${totalFeatures} CORE FEATURES VERIFIED & WORKING PERFECTLY!`);
    console.log('===============================================================');
    return true;
  } catch (err) {
    console.error('\n❌ FEATURE VERIFICATION FAILED:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runLiveVerification().catch(() => process.exit(1));
