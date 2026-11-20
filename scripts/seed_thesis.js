const db = require('../server/src/db');

async function seed() {
  const dbInst = await db.getDb();
  const ws = 'ws-thesis';

  // 1. Profile
  await db.saveProfile(ws, {
    business_name: 'CloudPulse AI',
    product_desc: 'Autonomous AI-Driven Cloud Infrastructure Observability & APM Platform',
    customers: 'DevOps, SRE, and Platform Engineering Teams at High-Growth Enterprises',
    price_point: '$49 / host / month with unlimited log ingestion and zero overage penalties'
  });

  // 2. Settings
  await db.setSetting(ws, 'semantic_threshold', '0.85');
  await db.setSetting(ws, 'digest_schedule', 'daily');
  await db.setSetting(ws, 'slack_webhook_url', 'https://hooks.slack.com/services/T06A1B2C3/B07D4E5F6/9g8h7i6j5k4l3m2n1');
  await db.setSetting(ws, 'outbound_webhook_url', 'https://hooks.zapier.com/hooks/catch/942105/mira-stream');
  await db.setSetting(ws, 'api_key', 'mira_live_sk_78e9f2a4c1b0d83e');
  await db.setSetting(ws, 'crm_config', JSON.stringify({
    active_crm: 'notion',
    notion_token: 'secret_mira_prod_9981247812938120',
    notion_db_id: '8f7e2d1c-4b5a-6970-8e1f-2a3b4c5d6e7f',
    airtable_key: 'pat_9812749817294812',
    airtable_base_id: 'app981274MIRA',
    airtable_table_name: 'Competitor Intel Live'
  }));
  await db.setSetting(ws, 'email_config', JSON.stringify({
    smtp_host: 'smtp.sendgrid.net',
    smtp_port: 587,
    smtp_user: 'apikey',
    smtp_pass: 'SG.example_key_hidden',
    recipient_email: 'strategy-team@cloudpulse.ai'
  }));

  // Clean existing ws-thesis data
  await dbInst.run('DELETE FROM competitors WHERE workspace_id = ?', [ws]);
  await dbInst.run('DELETE FROM intelligence_cards WHERE workspace_id = ?', [ws]);
  await dbInst.run('DELETE FROM battlecards WHERE workspace_id = ?', [ws]);
  await dbInst.run('DELETE FROM warroom_simulations WHERE workspace_id = ?', [ws]);
  await dbInst.run('DELETE FROM oracle_messages WHERE workspace_id = ?', [ws]);
  await dbInst.run('DELETE FROM oracle_sessions WHERE workspace_id = ?', [ws]);

  // Insert Competitors
  const comp1 = await db.addCompetitor(ws, {
    name: 'Datadog',
    url: 'https://www.datadoghq.com/pricing/',
    interval_hours: 6,
    scope: 'full',
    status: 'active',
    js_enabled: 1
  });
  const comp2 = await db.addCompetitor(ws, {
    name: 'Dynatrace',
    url: 'https://www.dynatrace.com/pricing/',
    interval_hours: 6,
    scope: 'full',
    status: 'active',
    js_enabled: 1
  });
  const comp3 = await db.addCompetitor(ws, {
    name: 'New Relic',
    url: 'https://newrelic.com/pricing',
    interval_hours: 12,
    scope: 'pricing',
    status: 'active',
    js_enabled: 1
  });
  const comp4 = await db.addCompetitor(ws, {
    name: 'Grafana Labs',
    url: 'https://grafana.com/pricing/',
    interval_hours: 24,
    scope: 'full',
    status: 'active',
    js_enabled: 1
  });

  // Pick existing screenshot files for display
  const sampleScreenshot = '/screenshots/86_1794733697331.png';
  const sampleScreenshot2 = '/screenshots/95_1794747670015.png';

  // Add historical scrapes for Datadog
  await dbInst.run(
    'INSERT INTO scrapes (competitor_id, timestamp, text_content, screenshot_path) VALUES (?, ?, ?, ?)',
    [
      comp1.id,
      new Date(Date.now() - 86400000 * 2).toISOString(),
      'Datadog Infrastructure Monitoring: $15 per host/month. APM Pro: $31 per host/month. Log Management: Ingest $0.10/GB, Retain $1.70/million events. Custom Metrics: $5.00 per 100 metrics. 14-day free trial.',
      sampleScreenshot
    ]
  );
  await dbInst.run(
    'INSERT INTO scrapes (competitor_id, timestamp, text_content, screenshot_path) VALUES (?, ?, ?, ?)',
    [
      comp1.id,
      new Date(Date.now() - 3600000 * 2).toISOString(),
      'Datadog Infrastructure Monitoring: $18 per host/month. APM Pro: $35 per host/month. Mandatory LLM Observability Add-on: $250/service/month. Log Management: Ingest $0.12/GB, Retain $2.10/million events. Custom Metrics: $6.50 per 100 metrics. 14-day free trial.',
      sampleScreenshot2
    ]
  );

  // Scrapes for Dynatrace
  await dbInst.run(
    'INSERT INTO scrapes (competitor_id, timestamp, text_content, screenshot_path) VALUES (?, ?, ?, ?)',
    [
      comp2.id,
      new Date(Date.now() - 3600000 * 8).toISOString(),
      'Dynatrace Full Stack Monitoring: $74/month per 8GB host. Davis AI Engine for automated anomaly detection. Integrates with AWS, Azure, GCP.',
      sampleScreenshot
    ]
  );

  // Intelligence Cards
  await dbInst.run(
    `INSERT INTO intelligence_cards (id, competitor_id, category, summary, impact_score, justification, recommendation, screenshot_path, crm_sync_status, is_read, timestamp, workspace_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'card-dd-001',
      comp1.id,
      'pricing change',
      'Datadog increased APM Pro pricing from $31 to $35/host/mo (+12.9%) and introduced a mandatory $250/service/mo LLM Observability surcharge. Custom metrics rates increased to $6.50/100 metrics.\n\nWhy it matters: This aggressive pricing escalation directly impacts enterprise mid-market renewals, generating significant customer budget friction.',
      9,
      'Datadog\'s 13% price increase and custom metric overage penalties create an acute budget crisis for containerized Kubernetes workloads. Mid-market customers are actively evaluating cost-effective alternatives with predictable telemetry pricing.',
      'Deploy an aggressive "Datadog Unbundle & Save" displacement campaign. Update sales battlecards with a side-by-side TCO calculator demonstrating 42% annualized savings with CloudPulse AI\'s flat-rate APM.',
      sampleScreenshot2,
      'synced',
      0,
      new Date(Date.now() - 3600000 * 2).toISOString(),
      ws
    ]
  );

  await dbInst.run(
    `INSERT INTO intelligence_cards (id, competitor_id, category, summary, impact_score, justification, recommendation, screenshot_path, crm_sync_status, is_read, timestamp, workspace_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'card-dt-002',
      comp2.id,
      'product or feature update',
      'Dynatrace launched Davis CoPilot GA featuring automated root-cause analysis and predictive Kubernetes scaling recommendations.\n\nWhy it matters: Positions Dynatrace deeper into autonomous remediation, creating competitive pressure on our Q1 AI roadmap.',
      7,
      'Davis CoPilot relies heavily on proprietary OneAgent injection, which requires root privileges on production nodes. Security-conscious enterprise prospects view this as a potential vulnerability compared to modern eBPF kernel-level monitoring.',
      'Highlight CloudPulse AI\'s non-invasive eBPF architecture in sales collaterals. Host a live webinar on "Zero-Overhead Kubernetes Observability Without Invasive User-Space Agents".',
      sampleScreenshot,
      'synced',
      1,
      new Date(Date.now() - 3600000 * 8).toISOString(),
      ws
    ]
  );

  await dbInst.run(
    `INSERT INTO intelligence_cards (id, competitor_id, category, summary, impact_score, justification, recommendation, screenshot_path, crm_sync_status, is_read, timestamp, workspace_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'card-nr-003',
      comp3.id,
      'content or messaging shift',
      'New Relic redesigned its primary homepage positioning around "OpenTelemetry Native Ingestion" and consumption-based telemetry pool pricing.\n\nWhy it matters: Confirms broad industry convergence toward OpenTelemetry standards, validating CloudPulse AI\'s native OTel collector foundation.',
      6,
      'Validates our technological approach while seeking to neutralize our OpenTelemetry edge. However, New Relic\'s per-user seat pricing continues to penalize engineering orgs with large developer rosters.',
      'Target engineering leaders with content highlighting our "Unlimited User Seats & Role-Based Access" policy vs New Relic\'s $349/user/month Full Platform User tax.',
      sampleScreenshot,
      'synced',
      1,
      new Date(Date.now() - 3600000 * 18).toISOString(),
      ws
    ]
  );

  // Battlecard for Datadog
  await dbInst.run(
    `INSERT INTO battlecards (workspace_id, competitor_id, overview, strengths, weaknesses, why_we_win, pricing_comparison, objection_handling, landmines, last_generated_at, battleguard, target_icp, switching_triggers, elevator_pitch)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ws,
      comp1.id,
      'Datadog is the incumbent market leader in cloud infrastructure and application monitoring, boasting 600+ integrations. However, aggressive usage-based pricing models, hidden custom metric penalties, and steep annual price hikes create acute buyer frustration across fast-growing engineering teams.',
      JSON.stringify([
        'Extensive enterprise ecosystem with 600+ pre-built vendor integrations',
        'Recognized brand authority and undisputed Gartner Magic Quadrant leader',
        'Mature unified interface spanning metrics, traces, logs, and security signals'
      ]),
      JSON.stringify([
        'Unpredictable invoice shock driven by opaque custom metric multipliers and log retention fees',
        'High CPU and memory overhead caused by heavy user-space monitoring daemons on Kubernetes nodes',
        'Aggressive vendor lock-in with closed-source agent instrumentation and costly migration hurdles'
      ]),
      JSON.stringify([
        'Predictable all-inclusive pricing at $49/host/month with zero ingestion penalties or surprise fees',
        'Modern kernel-space eBPF telemetry delivering instant observability with zero code instrumentation',
        'Autonomous AI-powered root cause analysis eliminating manual query construction and alert triage fatigue'
      ]),
      'Datadog APM costs $35/host/mo + $0.12/GB log ingest + $6.50/100 custom metrics + $250/service LLM fee. CloudPulse AI delivers all-inclusive telemetry at a flat $49/host/mo with unlimited logs, saving 38–52% on annual observability TCO.',
      JSON.stringify([
        {
          objection: 'Our engineering team has already invested months creating hundreds of custom Datadog dashboards.',
          response: 'CloudPulse AI provides an automated 1-click Datadog dashboard importer that converts your existing JSON dashboard exports into native OpenTelemetry views in under 5 minutes without rewriting queries.'
        },
        {
          objection: 'Datadog is the proven safe enterprise choice for SOC2 and HIPAA compliance.',
          response: 'CloudPulse AI is SOC2 Type II and HIPAA certified with end-to-end client-side encryption and automated PII masking that prevents sensitive customer tokens from ever leaving your cluster boundary.'
        }
      ]),
      JSON.stringify([
        'Ask the prospect: "What percentage of your last quarterly Datadog invoice was comprised of unbudgeted custom metrics or log ingestion overages?"',
        'Inquire about cluster overhead: "How many CPU cores across your Kubernetes nodes are consumed solely by running monitoring daemons during peak traffic?"',
        'Ask about team access: "Are junior developers currently restricted from accessing logs due to Datadog per-seat licensing limits?"'
      ]),
      new Date().toISOString(),
      'Enterprise Ready',
      'Mid-market & enterprise SaaS organizations ($10M–$100M ARR) running containerized microservices on Kubernetes facing >$50k/year in escalating observability bills.',
      JSON.stringify([
        'Annual Datadog contract renewal quote with >15% price hike',
        'Production outage prolonged by delayed log ingestion or dropped spans',
        'Executive directive to eliminate vendor lock-in and adopt OpenTelemetry standards'
      ]),
      'CloudPulse AI delivers complete Kubernetes and cloud observability powered by eBPF and autonomous AI triage at half the cost of Datadog—with zero agents to configure and guaranteed zero invoice surprises.'
    ]
  );

  // Oracle Session & Messages
  const sessionId = 'session-thesis-01';
  await dbInst.run(
    'INSERT INTO oracle_sessions (session_id, workspace_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, ws, 'Datadog Pricing Defense Strategy', new Date().toISOString(), new Date().toISOString()]
  );

  await db.saveOracleMessage(
    sessionId,
    ws,
    'user',
    'How should our sales team capitalize on Datadog\'s recent 13% price increase on APM Pro and their new mandatory LLM Observability surcharge?'
  );

  await db.saveOracleMessage(
    sessionId,
    ws,
    'assistant',
    `### Strategic Executive Assessment: Datadog Pricing Escalation
Datadog's price hike from **$31 to $35/host/mo** combined with their mandatory **$250/mo LLM Observability surcharge** creates an immediate displacement window for **CloudPulse AI**. Enterprise buyers are experiencing sharp budget fatigue, particularly around unbudgeted custom metric overages.

### Recommended Sales Displacement Playbook:
1. **Targeting**: Focus on mid-market accounts ($20M-$80M ARR) approaching Q4 contract renewals.
2. **The "Zero Overages" Pitch**: Contrast Datadog's variable consumption meter with CloudPulse AI's guaranteed **$49/host flat-rate**.
3. **Objection Pre-emption**: Offer our automated 1-click Datadog dashboard converter to eliminate migration friction.

*Projected Win-Rate Improvement: +24% in competitive mid-market bake-offs.*`
  );

  // War Room Simulation
  await db.saveWarRoomSimulation(
    ws,
    'Enterprise Pricing War: Countering Incumbent Rate Hike',
    'Competitor Datadog has raised APM rates by 13% and instituted mandatory LLM surcharges. We simulate launching a flat-rate displacement tier at $49/host.',
    {
      scenario_title: 'Enterprise Pricing War: Countering Incumbent Rate Hike',
      rounds: [
        {
          round: 1,
          player_move: 'Announce Guaranteed Price-Lock & Migration Credit',
          competitor_reaction: 'Datadog account executives offer aggressive multi-year discount locks (up to 20%) to retain top tier accounts.',
          market_impact: 'High interest among mid-market tier; 18 enterprise POCs initiated in week 1.',
          payoff: { player: '+18% Pipeline Growth', competitor: '-6% Renewal Expansion' }
        },
        {
          round: 2,
          player_move: 'Publish Independent TCO Benchmark Whitepaper',
          competitor_reaction: 'Competitor introduces bundled free tiers for non-production environments to slow pipeline leakage.',
          market_impact: 'Market consensus shifts toward transparent pricing; buyer CAC decreases by 32%.',
          payoff: { player: '+27% Deal Velocity', competitor: '-11% Net Expansion Rate' }
        }
      ],
      equilibrium_analysis: 'Stackelberg Leader Advantage: CloudPulse AI captures high-margin mid-market accounts before the incumbent can restructure complex enterprise licensing contracts in the subsequent fiscal quarter.',
      projected_outcomes: {
        market_share_gain: '+4.8%',
        revenue_risk: 'Low (< 2%)',
        customer_churn_delta: '-1.4%'
      }
    }
  );

  console.log('Successfully seeded ws-thesis with complete enterprise competitive intelligence data!');
}

seed().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
