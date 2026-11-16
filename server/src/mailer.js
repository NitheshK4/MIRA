// ============================================================================
// FILE: mailer.js
// PURPOSE: Automated Email Digest Notification Engine for Competitor Intelligence
// LOGIC OVERVIEW:
// 1. Gathers newly recorded competitor intelligence cards for a given workspace.
// 2. Sorts and filters the cards by impact score (highlighting top 3 highest threats).
// 3. Groups the remaining changes by competitor name to keep reports readable.
// 4. Formats everything into a modern, responsive HTML digest template.
// 5. Transports the email via Resend HTTP API or standard SMTP (Nodemailer).
// 6. Updates the database timestamp ('last_digest_sent') upon successful delivery.
// ============================================================================

const nodemailer = require('nodemailer');
const axios = require('axios');
const db = require('./db');

// ============================================================================
// TEMPLATE GENERATOR: Builds the responsive HTML email body
// LOGIC:
// - Extracts the top 3 cards globally across all competitors by impact score.
// - Groups remaining cards by competitor name.
// - Applies conditional color branding based on impact score:
//     Score >= 8: Red (#ef4444) -> Critical threat
//     Score >= 5: Orange (#f97316) -> Medium threat
//     Score < 5:  Blue (#3b82f6) -> Informational
// ============================================================================
function generateDigestHtml(cards, periodName = 'Periodic') {
  // Sort cards globally by impact score descending to identify the top 3 critical threats
  const sortedGlobally = [...cards].sort((a, b) => b.impact_score - a.impact_score);
  const top3 = sortedGlobally.slice(0, 3);

  // Group cards by competitor name so readers can digest updates per company
  const groups = {};
  for (const card of cards) {
    if (!groups[card.competitor_name]) {
      groups[card.competitor_name] = [];
    }
    groups[card.competitor_name].push(card);
  }

  // Sort competitor groups so the competitor with the highest impact change appears first
  const sortedGroupNames = Object.keys(groups).sort((a, b) => {
    const maxA = Math.max(...groups[a].map(c => c.impact_score));
    const maxB = Math.max(...groups[b].map(c => c.impact_score));
    return maxB - maxA;
  });

  // Dynamic visual styling helper for severity badges and borders
  const getScoreColor = (score) => {
    if (score >= 8) return '#ef4444'; // Red (High severity)
    if (score >= 5) return '#f97316'; // Orange (Medium severity)
    return '#3b82f6'; // Blue (Low severity)
  };

  // Render Top 3 Highlights HTML markup
  const highlightsHtml = top3.map((card, idx) => `
    <div style="background-color: #1e293b; border-left: 4px solid ${getScoreColor(card.impact_score)}; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <span style="font-weight: bold; color: #f8fafc; font-size: 16px;">#${idx + 1} - ${card.competitor_name}</span>
        <span style="background-color: ${getScoreColor(card.impact_score)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">Score ${card.impact_score}/10</span>
      </div>
      <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">Category: ${card.category}</div>
      <p style="color: #cbd5e1; margin: 0 0 10px 0; line-height: 1.5; font-size: 14px;">${card.summary.split('\n')[0]}</p>
      <div style="background-color: #0f172a; padding: 10px; border-radius: 4px; border: 1px solid #334155;">
        <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; display: block; margin-bottom: 4px;">Recommended Action:</strong>
        <span style="color: #f1f5f9; font-size: 13px;">${card.recommendation}</span>
      </div>
    </div>
  `).join('');

  // Render Competitor Groups HTML markup
  const groupsHtml = sortedGroupNames.map(compName => {
    const compCards = groups[compName].sort((a, b) => b.impact_score - a.impact_score);
    const cardListHtml = compCards.map(card => `
      <div style="border-bottom: 1px solid #334155; padding: 12px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 600; color: #e2e8f0; font-size: 14px;">${card.category.toUpperCase()}</span>
          <span style="color: ${getScoreColor(card.impact_score)}; font-weight: bold; font-size: 14px;">Impact: ${card.impact_score}/10</span>
        </div>
        <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 13px; line-height: 1.4;">${card.summary.split('\n')[0]}</p>
        <div style="font-size: 12px; color: #cbd5e1;">
          <strong style="color: #38bdf8;">Recommendation: </strong>${card.recommendation}
        </div>
      </div>
    `).join('');

    return `
      <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 6px; padding: 18px; margin-bottom: 20px;">
        <h3 style="color: #f1f5f9; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; font-size: 18px;">
          ${compName}
        </h3>
        <div>${cardListHtml}</div>
      </div>
    `;
  }).join('');

  // Assemble full responsive HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Competitor Intelligence Digest</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.025em;">
            Autonomous Competitor Intelligence Engine
          </h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">
            ${periodName} Competitor Intelligence Digest Report
          </p>
        </div>

        <!-- Highlights Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px dashed #334155; padding-bottom: 4px;">
            🔥 Top High-Impact Highlights
          </h2>
          <div>${highlightsHtml}</div>
        </div>

        <!-- Competitor Feed -->
        <div style="margin-bottom: 20px;">
          <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px dashed #334155; padding-bottom: 4px;">
            📋 Full Intel Feed Summary
          </h2>
          <div>${groupsHtml}</div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; margin-top: 30px;">
          This is an automated digest email sent from your Autonomous Competitor Intelligence Engine instance.
          <br>
          CRM Integration Status: Active.
        </div>

      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// CORE LOGIC: sendDigestEmail
// PURPOSE: Main execution controller for sending scheduled digests
// LOGIC STEPS:
//   Step 1: Normalize workspace parameters and retrieve email credentials from DB.
//   Step 2: Check timestamp of last sent digest to query only NEW changes.
//   Step 3: Generate the HTML email report (or mock card if triggered in test mode).
//   Step 4: Detect delivery channel (Resend API if key starts with 're_', else SMTP).
//   Step 5: Dispatch the email payload and persist new 'last_digest_sent' timestamp.
// ============================================================================
async function sendDigestEmail(workspaceId = 'default', period = 'daily', overrideConfig = null) {
  // Step 1: Normalize arguments if invoked with shifted params (e.g. ('daily', config))
  let finalWorkspaceId = workspaceId;
  let finalPeriod = period;
  let finalOverride = overrideConfig;
  if (workspaceId === 'daily' || workspaceId === 'weekly' || workspaceId === 'test') {
    finalPeriod = workspaceId;
    finalWorkspaceId = 'default';
    finalOverride = typeof period === 'object' ? period : null;
  }

  // Load email configuration (Host, Port, User, Pass, Recipient) from DB or override
  let emailConfig = finalOverride;
  if (!emailConfig) {
    const emailConfigJson = await db.getSetting(finalWorkspaceId, 'email_config');
    emailConfig = emailConfigJson ? JSON.parse(emailConfigJson) : null;
  }

  // Abort gracefully if credentials are not configured in settings
  if (!emailConfig || !emailConfig.smtp_host || !emailConfig.recipient_email) {
    console.log(`Skipping digest email for workspace ${finalWorkspaceId}: SMTP credentials or recipient email not configured.`);
    return { success: false, reason: 'Credentials not configured' };
  }

  const lastDigest = await db.getSetting(finalWorkspaceId, 'last_digest_sent') || '';
  const now = new Date().toISOString();

  // Step 2: Query all cards and filter only those created since the last digest run
  const cards = await db.getIntelligenceCards(finalWorkspaceId);
  let newCards = lastDigest
    ? cards.filter(c => new Date(c.timestamp) > new Date(lastDigest))
    : cards; // Send all on first run

  // Handle 'test' trigger from the dashboard Settings tab
  if (finalPeriod === 'test') {
    if (newCards.length === 0) {
      newCards = [{
        competitor_name: 'Example Competitor',
        category: 'pricing change',
        impact_score: 8,
        summary: 'This is a mock intelligence card to test your SMTP configuration. The competitor has reduced their entry-level plan price by 30%.',
        recommendation: 'Verify that this test email was received successfully in your inbox.',
        timestamp: now
      }];
    }
  } else {
    // If no new changes happened since last run, do not spam the user's inbox
    if (newCards.length === 0) {
      console.log(`Skipping digest email for workspace ${finalWorkspaceId}: No new competitor changes detected since last digest.`);
      return { success: true, reason: 'No new changes' };
    }
  }

  // Step 3: Compile email content and title
  const periodName = finalPeriod.charAt(0).toUpperCase() + finalPeriod.slice(1);
  const htmlContent = generateDigestHtml(newCards, periodName);
  const emailSubject = `[ACIE] Competitor Intelligence Digest - ${newCards.length} New Alerts`;

  // Check whether to use Resend REST API or standard Nodemailer SMTP
  const isResend = emailConfig.provider === 'resend' || (emailConfig.smtp_pass && emailConfig.smtp_pass.startsWith('re_'));

  try {
    // Step 4: Dispatch email
    if (isResend) {
      // ----------------------------------------------------
      // CORE LOGIC: Resend HTTP API Dispatch
      // ----------------------------------------------------
      console.log('Sending email via Resend HTTP API...');
      const fromEmail = (emailConfig.smtp_user && emailConfig.smtp_user.includes('@'))
        ? emailConfig.smtp_user
        : 'onboarding@resend.dev';
      await axios.post('https://api.resend.com/emails', {
        from: `Competitor Intel Bot <${fromEmail}>`,
        to: emailConfig.recipient_email,
        subject: emailSubject,
        html: htmlContent
      }, {
        headers: {
          'Authorization': `Bearer ${emailConfig.smtp_pass}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } else {
      // ----------------------------------------------------
      // CORE LOGIC: Standard SMTP Transport via Nodemailer
      // ----------------------------------------------------
      console.log('Sending email via standard SMTP...');
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtp_host,
        port: parseInt(emailConfig.smtp_port || '587', 10),
        secure: parseInt(emailConfig.smtp_port || '587', 10) === 465,
        auth: {
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_pass
        }
      });
      await transporter.sendMail({
        from: `"Competitor Intel Bot" <${emailConfig.smtp_user}>`,
        to: emailConfig.recipient_email,
        subject: emailSubject,
        html: htmlContent
      });
    }

    // Step 5: Persist timestamp of this run to prevent duplicate alerts in future runs
    await db.setSetting(finalWorkspaceId, 'last_digest_sent', now);
    console.log(`Digest email sent successfully for workspace ${finalWorkspaceId}.`);
    return { success: true, count: newCards.length };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;
    console.error(`Failed to send digest email for workspace ${finalWorkspaceId}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

module.exports = {
  sendDigestEmail,
  generateDigestHtml
};

module.exports = {
  sendDigestEmail,
  generateDigestHtml
};
