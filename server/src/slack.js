// ============================================================================
// FILE: slack.js
// PURPOSE: Real-Time Slack Webhook Alert Dispatcher
// LOGIC OVERVIEW:
// 1. Accepts newly generated high-impact intelligence cards (impact score >= 8).
// 2. Constructs a rich Slack Block/Attachment payload with visual severity colors:
//      - Score >= 8: Crimson Red (#ef4444)
//      - Score < 8:  Amber Orange (#f97316)
// 3. Posts the formatted message to the user-configured incoming Slack webhook URL.
// ============================================================================

const axios = require('axios');

// ============================================================================
// CORE LOGIC: sendSlackNotification
// PURPOSE: Formats and dispatches high-priority intel alerts to Slack channels
// LOGIC STEPS:
//   Step 1: Validate webhook URL (exit early if not configured).
//   Step 2: Construct structured Slack attachment payload with category, score,
//           summary, and actionable recommendation.
//   Step 3: Execute HTTP POST request with an 8-second timeout to avoid blocking.
// ============================================================================
async function sendSlackNotification(card, competitorName, webhookUrl) {
  // Step 1: Guard clause - abort silently if no webhook URL is configured
  if (!webhookUrl) return;

  try {
    // --------------------------------------------------------------------------
    // CORE LOGIC: Slack Payload Assembly
    // Formats competitor title, impact score badge, summary text, and timestamp
    // --------------------------------------------------------------------------
    const payload = {
      text: `🔥 *High-Impact Competitor Intel Detected! (Score: ${card.impact_score}/10)*`,
      attachments: [
        {
          color: card.impact_score >= 8 ? '#ef4444' : '#f97316',
          title: `[${card.category.toUpperCase()}] ${competitorName}`,
          title_link: card.competitor_url || undefined,
          text: `*Summary:* ${card.summary}\n\n*Recommended Action:* ${card.recommendation}`,
          fields: [
            {
              title: "Category",
              value: card.category,
              short: true
            },
            {
              title: "Impact Score",
              value: `${card.impact_score}/10`,
              short: true
            }
          ],
          ts: Math.floor(new Date(card.timestamp || Date.now()).getTime() / 1000)
        }
      ]
    };

    // --------------------------------------------------------------------------
    // CORE LOGIC: HTTP POST Dispatch to Slack Webhook Endpoint
    // --------------------------------------------------------------------------
    await axios.post(webhookUrl, payload, { timeout: 8000 });
    console.log(`Slack real-time notification sent for card ${card.id}`);
  } catch (err) {
    // Log dispatch failure without throwing so the main background queue continues
    console.error('Failed to send Slack notification:', err.message);
  }
}

module.exports = { sendSlackNotification };
