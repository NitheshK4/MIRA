const axios = require('axios');

/**
 * Fires a generic outbound webhook POST with the full intel card payload.
 * Compatible with Zapier, Make, n8n, Pipedream, Discord, and any HTTP endpoint.
 *
 * @param {object} card        - The intelligence card object
 * @param {string} competitorName - Human-readable competitor name
 * @param {string} webhookUrl  - The configured outbound webhook URL
 */
async function sendWebhookNotification(card, competitorName, webhookUrl) {
  if (!webhookUrl) return;

  try {
    const payload = {
      source: 'MIRA',
      event: 'intel_card_created',
      timestamp: card.timestamp || new Date().toISOString(),
      competitor: {
        id: card.competitor_id,
        name: competitorName,
        url: card.competitor_url || null
      },
      intel: {
        id: card.id,
        category: card.category,
        summary: card.summary,
        impact_score: card.impact_score,
        justification: card.justification,
        recommendation: card.recommendation,
        screenshot_path: card.screenshot_path || null
      }
    };

    await axios.post(webhookUrl, payload, {
      timeout: 8000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`Outbound webhook fired successfully for card ${card.id}`);
  } catch (err) {
    console.error('Outbound webhook dispatch failed:', err.message);
  }
}

module.exports = { sendWebhookNotification };
