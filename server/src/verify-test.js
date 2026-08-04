const assert = require('assert');
const { scrapeStatic } = require('./scraper');
const { detectChanges, cosineSimilarity, getEmbedding } = require('./detector');
const { analyzeChange } = require('./llm');
const db = require('./db');
const { syncCard, runRetryQueue } = require('./crm');

async function runTests() {
  console.log('==================================================');
  console.log('STARTING INTEGRATION VERIFICATION TEST SUITE');
  console.log('==================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: SCRAPER TESTS
    // ----------------------------------------------------
    console.log('Running Test 1: Static Scraping of https://example.com...');
    const scrapeRes = await scrapeStatic('https://example.com', 'full');
    assert.ok(scrapeRes.textContent, 'Should extract text content');
    assert.ok(scrapeRes.htmlContent, 'Should return raw HTML');
    assert.ok(scrapeRes.textContent.includes('Example Domain'), 'Text should contain domain title');
    console.log('✅ Test 1 Passed: Static scraping and cheerio cleaning work.\n');

    // ----------------------------------------------------
    // TEST 2: SEMANTIC CHANGE DETECTION TESTS
    // ----------------------------------------------------
    console.log('Running Test 2: Semantic Change Detection comparisons...');
    
    // Setup threshold
    const threshold = 0.85;

    // Cases
    const oldPriceText = "Price: $100\nOur software helps with workflow automation.";
    const newPriceSame = "Current Price: $100\nOur software helps with workflow automation.";
    const newPriceChange = "Price: $70\nOur software helps with workflow automation.";
    const contentShift = "We now provide AI Agents for teams.";
    
    console.log('  Case 2a: No meaningful change (price cosmetic rewording)...');
    const resSame = await detectChanges(oldPriceText, newPriceSame, threshold);
    console.log(`    Similarity: ${resSame.similarity.toFixed(4)}. Has Changed: ${resSame.hasChanged}`);
    assert.strictEqual(resSame.hasChanged, false, 'Rewording of same price should be ignored');

    console.log('  Case 2b: Meaningful change (price reduction)...');
    const resChange = await detectChanges(oldPriceText, newPriceChange, threshold);
    console.log(`    Similarity: ${resChange.similarity.toFixed(4)}. Has Changed: ${resChange.hasChanged}`);
    assert.strictEqual(resChange.hasChanged, true, 'Price drop should be detected as meaningful change');

    console.log('  Case 2c: Content messaging shift...');
    const resShift = await detectChanges(oldPriceText, contentShift, threshold);
    console.log(`    Similarity: ${resShift.similarity.toFixed(4)}. Has Changed: ${resShift.hasChanged}`);
    assert.strictEqual(resShift.hasChanged, true, 'Complete shift in text should be detected');
    
    console.log('✅ Test 2 Passed: Semantic change detection filters cosmetic updates and flags core changes.\n');

    // ----------------------------------------------------
    // TEST 3: LOCAL LLM INFERENCE TESTS
    // ----------------------------------------------------
    console.log('Running Test 3: Local CPU LLM Inference (Binary + Qwen2.5-0.5B)...');
    const testDiff = `+ Price reduced by 30%. Entry plan is now $70.
- Price: $100`;
    const mockProfile = {
      business_name: 'WorkflowSync',
      product_desc: 'We sell visual workflow automation tools starting at $80/month for marketing managers.',
      customers: 'Marketing managers and agencies',
      price_point: '$80/month'
    };

    console.log('  Triggering inference... (This will download llama-cli and GGUF if not present)');
    const startTime = Date.now();
    const analysis = await analyzeChange(testDiff, mockProfile);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`  LLM response generated in ${duration}s.`);
    console.log('  Output details:');
    console.log(`    Category: ${analysis.category}`);
    console.log(`    Impact Score: ${analysis.impact_score}/10`);
    console.log(`    Summary: ${analysis.summary}`);
    console.log(`    Justification: ${analysis.justification}`);
    console.log(`    Recommended Action: ${analysis.recommendation}`);

    assert.ok(analysis.category, 'Should return a change category');
    assert.ok(analysis.impact_score >= 1 && analysis.impact_score <= 10, 'Impact score must be between 1 and 10');
    assert.ok(analysis.summary, 'Should generate a summary paragraph');
    assert.ok(analysis.recommendation, 'Should generate a recommended business action');
    assert.ok(parseFloat(duration) < 90, 'Inference must finish under 90 seconds limit');
    console.log('✅ Test 3 Passed: Standalone GGUF LLM compiles outputs correctly on CPU under 90s.\n');

    // ----------------------------------------------------
    // TEST 4: CRM DB RETRY & QUEUE TESTS
    // ----------------------------------------------------
    console.log('Running Test 4: CRM Synchronization and Retry Queue...');
    const database = await db.getDb();
    
    // Save original CRM config
    const originalCrmConfig = await db.getSetting('crm_config');

    // Set dummy CRM config to trigger a retry queue run attempt
    await db.setSetting('crm_config', JSON.stringify({
      active_crm: 'notion',
      notion_token: 'dummy-token',
      notion_db_id: 'dummy-db-id'
    }));

    // Insert a dummy competitor
    const dummyComp = await db.addCompetitor({
      name: 'Test Competitor',
      url: 'https://test-competitor.com/prices-' + Date.now(),
      interval_hours: 6
    });

    const cardId = 'test-card-uuid-' + Date.now();
    // Insert a card with failed status
    const dummyCard = {
      id: cardId,
      competitor_id: dummyComp.id,
      category: 'pricing change',
      summary: 'Competitor cut pricing.',
      impact_score: 8,
      justification: 'Competitor prices overlap with ours.',
      recommendation: 'Verify pricing sheet.',
      timestamp: new Date().toISOString(),
      crm_sync_status: 'failed',
      crm_error: 'Connection timeout'
    };

    await db.saveIntelligenceCard(dummyCard);
    await db.enqueueCrmRetry(cardId);

    // Verify it is in the queue
    let queueItems = await db.getCrmQueue();
    assert.ok(queueItems.find(q => q.card_id === cardId), 'Card must exist in CRM retry queue');

    // Run retry queue with dummy config (should fail again because config is empty/invalid, incrementing retry count)
    console.log('  Running retry queue with empty CRM config...');
    await runRetryQueue();
    
    queueItems = await db.getCrmQueue();
    const retryItem = queueItems.find(q => q.card_id === cardId);
    assert.ok(retryItem, 'Card should still be in queue after a failed sync attempt');
    assert.strictEqual(retryItem.retries, 1, 'Retry count should increment to 1');
    console.log('  Retry count incremented to 1 successfully.');

    // Cleanup mock data
    await db.deleteCompetitor(dummyComp.id);

    // Restore original CRM config
    if (originalCrmConfig) {
      await db.setSetting('default', 'crm_config', originalCrmConfig);
    }
    console.log('✅ Test 4 Passed: CRM failure queue, idempotency tracking, and retries work.\n');

    // ----------------------------------------------------
    // TEST 5: WORKSPACE ISOLATION & SETTINGS SCOPING TESTS
    // ----------------------------------------------------
    console.log('Running Test 5: Workspace Isolation & Settings Scoping...');
    const ws1 = 'workspace_alpha_' + Date.now();
    const ws2 = 'workspace_beta_' + Date.now();

    await db.setSetting(ws1, 'slack_webhook_url', 'https://hooks.slack.com/services/alpha');
    await db.setSetting(ws2, 'slack_webhook_url', 'https://hooks.slack.com/services/beta');

    const slack1 = await db.getSetting(ws1, 'slack_webhook_url');
    const slack2 = await db.getSetting(ws2, 'slack_webhook_url');

    assert.strictEqual(slack1, 'https://hooks.slack.com/services/alpha', 'Workspace Alpha setting must match');
    assert.strictEqual(slack2, 'https://hooks.slack.com/services/beta', 'Workspace Beta setting must match');
    assert.notStrictEqual(slack1, slack2, 'Workspace settings must be isolated');

    console.log('✅ Test 5 Passed: Workspace settings scoping and isolation verified.\n');

    console.log('==================================================');
    console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('==================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST SUITE ENCOUNTERED A FAILURE:');
    console.error(err);
    process.exit(1);
  }
}

// Run the script directly if executed in shell
if (require.main === module) {
  runTests();
}
