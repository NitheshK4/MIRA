const { Client } = require('@notionhq/client');
const axios = require('axios');
const db = require('./db');

// Sync a single card to the configured CRM
async function syncCard(card, config, hostUrl = 'http://localhost:3000') {
  if (!config || config.active_crm === 'none') {
    return { success: true, status: 'skipped', message: 'No CRM integration configured.' };
  }

  const screenshotUrl = card.screenshot_path
    ? (card.screenshot_path.startsWith('http') ? card.screenshot_path : `${hostUrl}${card.screenshot_path}`)
    : '';

  try {
    if (config.active_crm === 'notion') {
      if (!config.notion_token || !config.notion_db_id) {
        throw new Error('Notion token or Database ID is missing in settings.');
      }
      await syncToNotion(card, config, screenshotUrl);
    } else if (config.active_crm === 'airtable') {
      if (!config.airtable_key || !config.airtable_base_id) {
        throw new Error('Airtable API key or Base ID is missing in settings.');
      }
      await syncToAirtable(card, config, screenshotUrl);
    }

    // Success: Update database status
    await db.updateIntelligenceCard(card.id, {
      crm_sync_status: 'synced',
      crm_error: ''
    });

    // Remove from queue if it was queued
    await db.removeFromCrmQueue(card.id);

    return { success: true, status: 'synced' };
  } catch (err) {
    const errMsg = err.message || 'Unknown CRM sync error';
    console.error(`CRM sync failed for card ${card.id}:`, errMsg);

    // Save failure status and error in DB
    await db.updateIntelligenceCard(card.id, {
      crm_sync_status: 'failed',
      crm_error: errMsg
    });

    // Enqueue for future retry
    await db.enqueueCrmRetry(card.id);

    return { success: false, status: 'failed', error: errMsg };
  }
}

// Notion Sync Helper
async function syncToNotion(card, config, screenshotUrl) {
  const notion = new Client({ auth: config.notion_token });

  const dateStr = card.timestamp ? card.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
  const timeStr = card.timestamp ? card.timestamp.split('T')[1].split('.')[0] : new Date().toISOString().split('T')[1].split('.')[0];
  const cardTitle = `[${card.category.toUpperCase()}] ${card.competitor_name} (${dateStr} ${timeStr})`;

  // Retrieve actual database schema to resolve properties matching case-insensitively and ignoring whitespaces
  const dbInfo = await notion.databases.retrieve({ database_id: config.notion_db_id });
  const actualProperties = dbInfo.properties || {};

  const getPropName = (targetName) => {
    const norm = targetName.toLowerCase().trim();
    for (const key of Object.keys(actualProperties)) {
      if (key.toLowerCase().trim() === norm) {
        return key;
      }
    }
    return targetName; // fallback
  };

  // Idempotency check: Search database for an existing entry with the same card title or URL
  try {
    const urlProp = getPropName('URL');
    const titleProp = getPropName('Title');
    const existing = await notion.databases.query({
      database_id: config.notion_db_id,
      filter: {
        and: [
          {
            property: urlProp,
            url: {
              equals: card.competitor_url
            }
          },
          {
            property: titleProp,
            title: {
              equals: cardTitle
            }
          }
        ]
      }
    });
    if (existing.results && existing.results.length > 0) {
      console.log(`Card ${card.id} already exists in Notion. Skipping duplicate write.`);
      return;
    }
  } catch (err) {
    console.warn('Notion duplicate query failed, proceeding with create:', err.message);
  }

  const properties = {
    [getPropName('Title')]: {
      title: [
        {
          text: {
            content: cardTitle
          }
        }
      ]
    },
    [getPropName('Competitor Name')]: {
      select: {
        name: card.competitor_name.replace(/,/g, '') // Notion selects don't allow commas
      }
    },
    [getPropName('URL')]: {
      url: card.competitor_url
    },
    [getPropName('Category')]: {
      select: {
        name: card.category
      }
    },
    [getPropName('Impact Score')]: {
      number: card.impact_score
    },
    [getPropName('Recommended Action')]: {
      rich_text: [
        {
          text: {
            content: card.recommendation || ''
          }
        }
      ]
    },
    [getPropName('Summary')]: {
      rich_text: [
        {
          text: {
            content: (card.summary || '').substring(0, 2000) // Notion text block limit is 2000 chars
          }
        }
      ]
    },
    [getPropName('Justification')]: {
      rich_text: [
        {
          text: {
            content: (card.justification || '').substring(0, 2000)
          }
        }
      ]
    }
  };

  if (screenshotUrl) {
    properties[getPropName('Screenshot URL')] = {
      url: screenshotUrl
    };
  }

  await notion.pages.create({
    parent: { database_id: config.notion_db_id },
    properties: properties
  });
}

// Airtable Sync Helper
async function syncToAirtable(card, config, screenshotUrl) {
  const tableName = config.airtable_table_name || 'Competitor Intel';
  const url = `https://api.airtable.com/v0/${config.airtable_base_id}/${encodeURIComponent(tableName)}`;
  const dateStr = card.timestamp ? card.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
  const timeStr = card.timestamp ? card.timestamp.split('T')[1].split('.')[0] : new Date().toISOString().split('T')[1].split('.')[0];
  const cardTitle = `[${card.category.toUpperCase()}] ${card.competitor_name} (${dateStr} ${timeStr})`;

  // Idempotency check: Search Airtable for an existing entry with the same title and URL
  try {
    const filterFormula = `AND({URL}='${card.competitor_url.replace(/'/g, "\\'")}', {Title}='${cardTitle.replace(/'/g, "\\'")}')`;
    const checkUrl = `${url}?filterByFormula=${encodeURIComponent(filterFormula)}`;
    const checkRes = await axios.get(checkUrl, {
      headers: {
        'Authorization': `Bearer ${config.airtable_key}`
      },
      timeout: 6000
    });
    if (checkRes.data && checkRes.data.records && checkRes.data.records.length > 0) {
      console.log(`Card ${card.id} already exists in Airtable. Skipping duplicate write.`);
      return;
    }
  } catch (err) {
    console.warn('Airtable duplicate query failed, proceeding with create:', err.message);
  }

  const fields = {
    'Title': cardTitle,
    'Competitor Name': card.competitor_name,
    'URL': card.competitor_url,
    'Category': card.category,
    'Summary': card.summary,
    'Justification': card.justification,
    'Impact Score': card.impact_score,
    'Recommended Action': card.recommendation,
    'Timestamp': card.timestamp
  };

  if (screenshotUrl) {
    fields['Screenshot URL'] = screenshotUrl;
  }

  await axios.post(
    url,
    { fields },
    {
      headers: {
        'Authorization': `Bearer ${config.airtable_key}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
}

// Run the retry queue for all pending failed syncs
async function runRetryQueue(hostUrl = 'http://localhost:3000') {
  const queue = await db.getCrmQueue();
  if (queue.length === 0) {
    return { processed: 0, successes: 0 };
  }

  console.log(`Processing CRM retry queue: ${queue.length} items pending...`);

  let successes = 0;
  for (const item of queue) {
    const crmConfigJson = await db.getSetting(item.workspace_id || 'default', 'crm_config');
    const crmConfig = crmConfigJson ? JSON.parse(crmConfigJson) : null;

    if (!crmConfig || crmConfig.active_crm === 'none') {
      console.log(`Skipping retry queue item ${item.card_id}: No active CRM configuration.`);
      continue;
    }

    const card = {
      id: item.card_id,
      workspace_id: item.workspace_id,
      competitor_id: item.competitor_id,
      competitor_name: item.competitor_name,
      competitor_url: item.competitor_url,
      category: item.category,
      summary: item.summary,
      impact_score: item.impact_score,
      justification: item.justification,
      recommendation: item.recommendation,
      screenshot_path: item.screenshot_path,
      timestamp: item.timestamp
    };

    const res = await syncCard(card, crmConfig, hostUrl);
    if (res.success) {
      successes++;
    }
  }

  console.log(`CRM retry queue processing complete. Successes: ${successes}/${queue.length}`);
  return { processed: queue.length, successes };
}

module.exports = {
  syncCard,
  runRetryQueue
};
