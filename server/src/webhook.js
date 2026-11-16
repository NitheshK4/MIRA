// ============================================================================
// FILE: webhook.js
// PURPOSE: Generic Outbound Webhook Integration Engine
// LOGIC OVERVIEW:
// 1. Receives newly detected intelligence cards from the background scanner.
// 2. Packages the competitor details, impact ratings, recommendations, and evidence
//    into a clean, standardized JSON payload.
// 3. Dispatches HTTP POST to user endpoints (Zapier, Make.com, n8n, Discord, etc.).
// ============================================================================

const axios = require('axios');

// ============================================================================
// CORE LOGIC: sendWebhookNotification
// PURPOSE: Dispatches full JSON telemetry of an intelligence event to external endpoints
// LOGIC STEPS:
//   Step 1: Check if an outbound webhook URL has been configured for the workspace.
//   Step 2: Construct normalized JSON payload adhering to the MIRA event schema.
//   Step 3: Send HTTP POST request with an 8-second timeout.
// ============================================================================
async function sendWebhookNotification(card, competitorName, webhookUrl) {
  // Step 1: Guard clause - abort if no external webhook URL is registered
  if (!webhookUrl) return;

  try {
    // --------------------------------------------------------------------------
    // CORE LOGIC: Standardized Event Payload Construction
    // Normalized format for seamless parsing in automation platforms (Zapier/n8n)
    // --------------------------------------------------------------------------
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

    // --------------------------------------------------------------------------
    // CORE LOGIC: HTTP POST Outbound Transmission
    // --------------------------------------------------------------------------
    await axios.post(webhookUrl, payload, {
      timeout: 8000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`Outbound webhook fired successfully for card ${card.id}`);
  } catch (err) {
    // Gracefully catch network errors so the main processing queue never crashes
    console.error('Outbound webhook dispatch failed:', err.message);
  }
}

module.exports = { sendWebhookNotification };
