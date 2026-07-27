const path = require('path');
const fs = require('fs');
const fsSync = fs;
const { spawn, execSync } = require('child_process');
const axios = require('axios');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const BIN_DIR = path.join(__dirname, '..', 'bin');
const DATA_DIR = path.join(__dirname, '..', 'data');
const LLAMA_PATH_FILE = path.join(BIN_DIR, 'llama-cli-path.txt');
const MODEL_PATH = path.join(DATA_DIR, 'qwen2.5-0.5b-instruct-q4_k_m.gguf');
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';

// Ensure directories exist
if (!fsSync.existsSync(BIN_DIR)) fsSync.mkdirSync(BIN_DIR, { recursive: true });
if (!fsSync.existsSync(DATA_DIR)) fsSync.mkdirSync(DATA_DIR, { recursive: true });

// Helper to get cached llama-cli path
function getStoredLlamaPath() {
  if (fsSync.existsSync(LLAMA_PATH_FILE)) {
    const resolvedPath = fsSync.readFileSync(LLAMA_PATH_FILE, 'utf-8').trim();
    if (fsSync.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
  return null;
}

// Download llama-cli binary dynamically from GitHub releases
async function downloadLlamaCli() {
  const cachedPath = getStoredLlamaPath();
  if (cachedPath) {
    return cachedPath;
  }

  console.log('Downloading llama-cli binary...');
  try {
    // Query Github API for latest release
    const releaseRes = await axios.get('https://api.github.com/repos/ggml-org/llama.cpp/releases/latest', {
      headers: { 'User-Agent': 'acie-installer' }
    });
    
    const assets = releaseRes.data.assets;
    let targetAsset = null;
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'darwin') {
      const matchKey = arch === 'arm64' ? 'bin-macos-arm64.tar.gz' : 'bin-macos-x64.tar.gz';
      targetAsset = assets.find(a => a.name.includes(matchKey));
    } else if (platform === 'linux') {
      // Look for standard ubuntu or linux x64 binary
      targetAsset = assets.find(a => a.name.includes('bin-ubuntu-x64.tar.gz') || a.name.includes('bin-linux-x64.tar.gz'));
    }

    if (!targetAsset) {
      // Fallback to a stable tag if latest query fails to find suitable prebuilt asset
      console.log('Could not find platform asset in latest release, falling back to build b3600...');
      const fallbackBuild = 'b3600';
      const fileExt = platform === 'darwin' ? (arch === 'arm64' ? 'macos-arm64.tar.gz' : 'macos-x64.tar.gz') : 'ubuntu-x64.tar.gz';
      const downloadUrl = `https://github.com/ggml-org/llama.cpp/releases/download/${fallbackBuild}/llama-${fallbackBuild}-bin-${fileExt}`;
      return await downloadAndExtract(downloadUrl, platform);
    }

    console.log(`Found asset: ${targetAsset.name}. Downloading...`);
    return await downloadAndExtract(targetAsset.browser_download_url, platform);
  } catch (err) {
    console.error('Failed to download llama-cli dynamically:', err.message);
    throw err;
  }
}

async function downloadAndExtract(url, platform) {
  const tempFile = path.join(BIN_DIR, 'llama_temp.tar.gz');
  const writer = fsSync.createWriteStream(tempFile);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('Extracting archive...');
  try {
    // Standard extraction via tar utility (preserves symlinks on disk)
    execSync(`tar -xzf "${tempFile}" -C "${BIN_DIR}"`);
    
    let resolvedCliPath = '';

    // Recursively scan BIN_DIR for llama-cli
    const scanDir = (dir) => {
      const entries = fsSync.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          if (entry.name === 'llama-cli') {
            resolvedCliPath = fullPath;
            break;
          }
        }
      }
    };

    scanDir(BIN_DIR);

    if (!resolvedCliPath || !fsSync.existsSync(resolvedCliPath)) {
      throw new Error('llama-cli executable not found in extracted contents.');
    }

    // Make executable
    fsSync.chmodSync(resolvedCliPath, '755');
    
    // Also chmod any other binaries in the same folder if present
    try {
      const parentDir = path.dirname(resolvedCliPath);
      const siblingFiles = fsSync.readdirSync(parentDir);
      for (const file of siblingFiles) {
        const siblingPath = path.join(parentDir, file);
        const stat = fsSync.statSync(siblingPath);
        if (stat.isFile() && (file.startsWith('llama-') || file.endsWith('.dylib') || file.endsWith('.so'))) {
          fsSync.chmodSync(siblingPath, '755');
        }
      }
    } catch (e) {}

    // Save path
    fsSync.writeFileSync(LLAMA_PATH_FILE, resolvedCliPath, 'utf-8');
    console.log(`llama-cli binary and libraries registered at: ${resolvedCliPath}`);

    // Cleanup temp zip
    try {
      fsSync.unlinkSync(tempFile);
    } catch (e) {}

    return resolvedCliPath;
  } catch (err) {
    console.error('Extraction failed:', err.message);
    throw err;
  }
}

// Download GGUF Model
async function downloadModel() {
  if (fs.existsSync(MODEL_PATH)) {
    return MODEL_PATH;
  }

  console.log('Downloading Qwen2.5-0.5B GGUF model (~382MB) from Hugging Face...');
  const writer = fs.createWriteStream(MODEL_PATH);
  
  const response = await axios({
    url: MODEL_URL,
    method: 'GET',
    responseType: 'stream'
  });

  // Track progress
  let downloadedBytes = 0;
  const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
  
  response.data.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    if (totalBytes > 0 && downloadedBytes % (10 * 1024 * 1024) < chunk.length) {
      const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
      console.log(`Download progress: ${pct}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
    }
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('Model download complete.');
  return MODEL_PATH;
}

// Helper to extract tagged blocks from LLM response
function extractTag(text, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * A robust rule-based heuristic fallback analysis when cloud Gemini/Qwen are rate-limited or unavailable.
 */
function generateFallbackAnalysis(diffText) {
  const diffLower = (diffText || '').toLowerCase();
  let category = 'other';
  let impact_score = 3;
  let summary = 'A change was detected on the competitor\'s website. Detailed AI summary is temporarily unavailable due to API rate limits or service constraints.';
  let justification = 'Heuristic analysis fallback. Detailed justification requires LLM access.';
  let recommendation = 'Review the changes directly on the competitor\'s website.';

  if (diffLower.includes('price') || diffLower.includes('$') || diffLower.includes('pricing') || diffLower.includes('cost') || diffLower.includes('plan')) {
    category = 'pricing change';
    impact_score = 7;
    summary = 'A potential pricing change or plan update was detected in the competitor\'s website text.';
    recommendation = 'Verify if competitor has changed pricing tiers or prices.';
  } else if (diffLower.includes('hire') || diffLower.includes('career') || diffLower.includes('jobs') || diffLower.includes('join our team') || diffLower.includes('opening')) {
    category = 'hiring signal';
    impact_score = 4;
    summary = 'A new job opening or hiring signal was detected on the competitor\'s website.';
    recommendation = 'Monitor the competitor\'s team expansion and focus area.';
  } else if (diffLower.includes('release') || diffLower.includes('feature') || diffLower.includes('update') || diffLower.includes('launch') || diffLower.includes('new') || diffLower.includes('version')) {
    category = 'product or feature update';
    impact_score = 6;
    summary = 'A product update or new feature release was detected on the competitor\'s website.';
    recommendation = 'Check the competitor product changelog and document the new features.';
  } else if (diffLower.includes('ceo') || diffLower.includes('founder') || diffLower.includes('leadership') || diffLower.includes('executive') || diffLower.includes('appoint')) {
    category = 'leadership or company change';
    impact_score = 5;
    summary = 'A leadership change or company organizational announcement was detected.';
    recommendation = 'Verify updates to the competitor\'s leadership team.';
  }

  if (diffText) {
    const lines = diffText.split('\n').filter(line => line.startsWith('+') || line.startsWith('-'));
    const preview = lines.slice(0, 5).join('\n');
    summary += `\n\nDiff Preview:\n${preview}`;
  }

  return {
    category,
    summary,
    impact_score,
    justification,
    recommendation,
    inferenceTime: 0.0
  };
}

// Main analysis runner
async function analyzeChange(diffText, businessProfile) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    console.log('Using Google Gemini API for inference...');
    const startTime = Date.now();
    try {
      const systemPrompt = `You are a Competitor Intelligence Analyst. Your task is to analyze a detected change on a competitor's website, classify it, and score its business impact relative to our own business profile.
Always respond using the following XML tags:
<category>Select one: pricing change, product or feature update, hiring signal, content or messaging shift, leadership or company change, other</category>
<summary>A one-paragraph plain-English summary of what changed.</summary>
<why_it_matters>A one-paragraph plain-English explanation of why this change matters to our business.</why_it_matters>
<score>An integer from 1 to 10 representing the business threat/impact score</score>
<justification>A brief justification for the impact score relative to our business context</justification>
<recommendation>A brief recommended action for our business (e.g. "Consider a pricing response within 30 days" or "Monitor hiring in this area for the next quarter")</recommendation>`;

      const profileContext = businessProfile ? `
Our Business Name: ${businessProfile.business_name || 'Our Company'}
What our product does: ${businessProfile.product_desc || 'General Software Services'}
Who our customers are: ${businessProfile.customers || 'General Businesses'}
Our pricing/price point: ${businessProfile.price_point || 'Not specified'}
` : 'No specific business profile context is available.';

      const userPrompt = `
Here is our business profile for context:
${profileContext}

Here is the diff of the competitor's website content (+ indicates added lines, - indicates removed lines):
\`\`\`diff
${diffText}
\`\`\`

Analyze the competitor's changes above and generate the classified intelligence card. Keep your responses strictly inside the requested XML tags.`;

      const prompt = `${systemPrompt}\n\n${userPrompt}`;

      let res;
      let retries = 3;
      let delay = 1000;

      for (let i = 0; i < retries; i++) {
        try {
          res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 }
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
          );
          break;
        } catch (err) {
          if (err.response && err.response.status === 429 && i < retries - 1) {
            console.warn(`Gemini API rate limited (429). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            throw err;
          }
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`Gemini API responded in ${duration}s.`);

      const category = extractTag(text, 'category').toLowerCase().trim() || 'other';
      let summary = extractTag(text, 'summary');
      const whyItMatters = extractTag(text, 'why_it_matters');
      const scoreText = extractTag(text, 'score');
      let justification = extractTag(text, 'justification');
      let recommendation = extractTag(text, 'recommendation');

      // Defaults for robustness
      if (!summary) summary = 'A change was detected on the competitor\'s website.';
      if (!justification) justification = 'Business impact scored based on competitor change context.';
      if (!recommendation) recommendation = 'Review the changes directly on the competitor\'s website.';

      const parsedScore = parseInt(scoreText.match(/\d+/)?.[0] || '1', 10);
      const impact_score = Math.min(Math.max(parsedScore, 1), 10);

      const validCategories = [
        'pricing change',
        'product or feature update',
        'hiring signal',
        'content or messaging shift',
        'leadership or company change',
        'other'
      ];
      const finalCategory = validCategories.includes(category) ? category : 'other';

      return {
        category: finalCategory,
        summary: `${summary}\n\nWhy it matters: ${whyItMatters}`,
        impact_score,
        justification,
        recommendation,
        inferenceTime: parseFloat(duration)
      };
    } catch (err) {
      console.error('Gemini API request failed, falling back to local/fallback options:', err.message);
    }
  }

  // If we are on Railway or other memory-constrained cloud environments, running a local model will crash the container
  const isCloudEnv = !!(process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);
  if (isCloudEnv) {
    console.warn('Local Qwen model inference is disabled in cloud environments. Using robust heuristic fallback.');
    return generateFallbackAnalysis(diffText);
  }

  const llamaPath = await downloadLlamaCli();
  await downloadModel();

  const profileContext = businessProfile ? `
Our Business Name: ${businessProfile.business_name || 'Our Company'}
What our product does: ${businessProfile.product_desc || 'General Software Services'}
Who our customers are: ${businessProfile.customers || 'General Businesses'}
Our pricing/price point: ${businessProfile.price_point || 'Not specified'}
` : 'No specific business profile context is available.';

  // Format system prompt and instruction
  const systemPrompt = `You are a Competitor Intelligence Analyst. Your task is to analyze a detected change on a competitor's website, classify it, and score its business impact relative to our own business profile.
Always respond using the following XML tags:
<category>Select one: pricing change, product or feature update, hiring signal, content or messaging shift, leadership or company change, other</category>
<summary>A one-paragraph plain-English summary of what changed.</summary>
<why_it_matters>A one-paragraph plain-English explanation of why this change matters to our business.</why_it_matters>
<score>An integer from 1 to 10 representing the business threat/impact score</score>
<justification>A brief justification for the impact score relative to our business context</justification>
<recommendation>A brief recommended action for our business (e.g. "Consider a pricing response within 30 days" or "Monitor hiring in this area for the next quarter")</recommendation>`;

  const userPrompt = `
Here is our business profile for context:
${profileContext}

Here is the diff of the competitor's website content (+ indicates added lines, - indicates removed lines):
\`\`\`diff
${diffText}
\`\`\`

Analyze the competitor's changes above and generate the classified intelligence card. Keep your responses strictly inside the requested XML tags.`;

  // Format using Qwen Chat Template
  const formattedPrompt = `<|im_start|>system
${systemPrompt}<|im_end|>
<|im_start|>user
${userPrompt}<|im_end|>
<|im_start|>assistant
`;

  // Write prompt to a temp file to avoid CLI argument limits and shell injection
  const tempPromptFile = path.join(DATA_DIR, `prompt_${Date.now()}.txt`);
  fs.writeFileSync(tempPromptFile, formattedPrompt, 'utf-8');

  return new Promise((resolve, reject) => {
    console.log('Spawning llama-cli for inference...');
    const startTime = Date.now();

    // Spawn llama-cli process with optimized flags for CPU
    // -c 1024: context size
    // -n 512: max generated tokens
    // --temp 0.2: low temperature for consistent output structure
    const child = spawn(llamaPath, [
      '-m', MODEL_PATH,
      '-f', tempPromptFile,
      '-c', '1024',
      '-n', '512',
      '--temp', '0.2',
      '--threads', '2', // Run on 2 threads to be safe with Railway free CPUs
      '--log-disable',
      '--no-conversation', // Prevent chat-template REPL mode
      '--single-turn'      // Exit after generating output
    ]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', async (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`llama-cli process exited with code ${code} in ${duration}s`);
      
      // Cleanup temp prompt file
      try {
        fs.unlinkSync(tempPromptFile);
      } catch (e) {}

      if (code !== 0) {
        return reject(new Error(`LLM inference failed with code ${code}. Stderr: ${stderr}`));
      }

      // Parse structured tags
      const category = extractTag(stdout, 'category').toLowerCase().trim() || 'other';
      let summary = extractTag(stdout, 'summary');
      const whyItMatters = extractTag(stdout, 'why_it_matters');
      const scoreText = extractTag(stdout, 'score');
      let justification = extractTag(stdout, 'justification');
      let recommendation = extractTag(stdout, 'recommendation');

      // Defaults for robustness
      if (!summary) summary = 'A change was detected on the competitor\'s website.';
      if (!justification) justification = 'Business impact scored based on competitor change context.';
      if (!recommendation) recommendation = 'Review the changes directly on the competitor\'s website.';

      const parsedScore = parseInt(scoreText.match(/\d+/)?.[0] || '1', 10);
      const impact_score = Math.min(Math.max(parsedScore, 1), 10);

      const validCategories = [
        'pricing change',
        'product or feature update',
        'hiring signal',
        'content or messaging shift',
        'leadership or company change',
        'other'
      ];
      const finalCategory = validCategories.includes(category) ? category : 'other';

      const fullSummary = `${summary}\n\nWhy it matters: ${whyItMatters}`;

      resolve({
        category: finalCategory,
        summary: fullSummary,
        impact_score,
        justification,
        recommendation,
        inferenceTime: parseFloat(duration)
      });
    });

    // Handle timeout (90s limit)
    setTimeout(() => {
      child.kill();
      try {
        fs.unlinkSync(tempPromptFile);
      } catch (e) {}
      reject(new Error('LLM inference timed out (exceeded 90 seconds limit).'));
    }, 90000);
  });
}

async function generateBattlecardData(competitor, recentScrapes = [], intelCards = [], businessProfile = null, geminiApiKey = null) {
  const compName = competitor.name || competitor.url || 'Competitor';
  const compUrl = competitor.url || '';

  const profileContext = businessProfile ? `
Our Business Name: ${businessProfile.business_name || 'Our Company'}
Our Product & Services: ${businessProfile.product_desc || 'General Software Services'}
Our Target Audience: ${businessProfile.customers || 'Businesses & Consumers'}
Our Price Point: ${businessProfile.price_point || 'Standard pricing'}
` : 'Our business profile is not specified.';

  const scrapeSnippet = recentScrapes.map(s => (s.text_content || '').substring(0, 1000)).join('\n---\n');
  const intelSummary = intelCards.map(c => `- [${c.category}] (Impact: ${c.impact_score}/10): ${c.summary}`).join('\n');

  const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  if (activeGeminiKey) {
    try {
      console.log(`Generating AI Battlecard for ${compName} using Gemini API...`);
      const systemInstruction = `You are a Senior Competitive Intelligence & Sales Enablement Strategist.
Your task is to generate a comprehensive sales battlecard comparing "Our Business" vs "${compName}".

Respond ONLY with a valid JSON object wrapped inside <json> ... </json> tags matching this exact structure:
{
  "overview": "A crisp 2-3 sentence overview of ${compName}, their positioning, and target market.",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Vulnerability 1", "Vulnerability 2", "Vulnerability 3"],
  "why_we_win": ["Key Differentiator 1", "Key Differentiator 2", "Key Differentiator 3"],
  "pricing_comparison": "Analysis comparing our pricing structure vs ${compName}'s pricing.",
  "objection_handling": [
    { "objection": "Common prospect objection regarding ${compName}", "response": "Winning counter-script for our sales team" },
    { "objection": "Second objection", "response": "Winning counter-script" },
    { "objection": "Third objection", "response": "Winning counter-script" }
  ],
  "landmines": ["Landmine question reps should ask prospects", "Landmine question 2", "Landmine question 3"]
}`;

      const promptText = `
Here is our business profile:
${profileContext}

Competitor Name: ${compName}
Competitor URL: ${compUrl}

Recent Website Scrapes / Snippets:
${scrapeSnippet || 'No recent scrapes recorded.'}

Recent Intelligence Signals Detected:
${intelSummary || 'No recent intelligence cards.'}

Generate the tactical AI sales battlecard for ${compName} now. Format inside <json> tags.
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeGeminiKey}`,
        {
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${promptText}` }] }]
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/) || text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
      const jsonString = (jsonMatch[1] || text).trim();

      try {
        const parsed = JSON.parse(jsonString);
        return {
          overview: parsed.overview || `${compName} operates in the same space as ${businessProfile?.business_name || 'our company'}.`,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          why_we_win: Array.isArray(parsed.why_we_win) ? parsed.why_we_win : [],
          pricing_comparison: parsed.pricing_comparison || 'Pricing details are being evaluated against our price tier.',
          objection_handling: Array.isArray(parsed.objection_handling) ? parsed.objection_handling : [],
          landmines: Array.isArray(parsed.landmines) ? parsed.landmines : []
        };
      } catch (e) {
        console.warn('Failed to parse Gemini JSON output for battlecard. Raw text:', text);
      }
    } catch (err) {
      console.error('Gemini API error during battlecard generation:', err.message);
    }
  }

  // Robust Heuristic Fallback
  console.log(`Using fallback heuristic battlecard generator for ${compName}...`);
  return {
    overview: `${compName} (${compUrl}) is a direct market competitor offering solutions in this domain.`,
    strengths: [
      `Established brand presence at ${compUrl}`,
      'Active content and product positioning updates',
      'Broad targeted customer base'
    ],
    weaknesses: [
      'May lack our tailored business features & personalized support',
      'Potential rigidity in custom integration requirements',
      'Pricing opacity compared to transparent value tiers'
    ],
    why_we_win: [
      `Faster implementation and agility tailored to ${businessProfile?.customers || 'target prospects'}`,
      'Superior customer support and direct relationship management',
      `More competitive total cost of ownership vs ${compName}`
    ],
    pricing_comparison: `Our price point (${businessProfile?.price_point || 'Flexible pricing'}) provides higher ROI compared to ${compName}'s standard offerings.`,
    objection_handling: [
      {
        objection: `"${compName} has been in the market longer."`,
        response: `"While they have legacy presence, our platform is purpose-built for modern workflows, providing faster deployment and greater feature responsiveness."`
      },
      {
        objection: `"${compName} offers similar core features."`,
        response: `"Core features may look similar on paper, but our platform delivers significantly better usability, lower total cost of ownership, and dedicated customer success."`
      }
    ],
    landmines: [
      `"How fast can ${compName} implement custom workflow requirements for your team?"`,
      `"Does ${compName}'s pricing include all platform features, or are key modules locked behind enterprise add-ons?"`,
      `"What is ${compName}'s response time SLA for critical support issues?"`
    ]
  };
}

/**
 * AI Strategy Co-Pilot ("MIRA Oracle") response generator
 */
async function generateStrategyCopilotResponse(userMessage, conversationHistory = [], workspaceContext = {}, geminiApiKey = null) {
  const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;
  const { profile, competitors = [], intelCards = [], battlecards = [] } = workspaceContext;

  const profileSummary = profile ? `
Our Business Name: ${profile.business_name || 'Our Company'}
Our Product: ${profile.product_desc || 'SaaS / Digital Service'}
Target Audience: ${profile.customers || 'General Businesses'}
Pricing Tier: ${profile.price_point || 'Standard Pricing'}
` : 'Our business profile is not configured.';

  const competitorsSummary = competitors.length > 0 
    ? competitors.map(c => `- ${c.name} (${c.url}) - Status: ${c.status}`).join('\n')
    : 'No competitors registered in radar yet.';

  const cardsSummary = intelCards.length > 0
    ? intelCards.slice(0, 10).map(c => `- [${c.category}] (Impact ${c.impact_score}/10): ${c.summary}`).join('\n')
    : 'No recent change signals detected.';

  if (activeGeminiKey) {
    try {
      console.log('Generating AI Strategy Co-Pilot response using Gemini API...');
      const systemInstruction = `You are "MIRA Oracle", a top-tier Chief Competitive Intelligence Strategist.
You assist product leaders, sales teams, and executives in analyzing competitors, identifying market opportunities, and executing counter-strategies.
Be direct, sharp, highly tactical, and professional. Use markdown formatting with bold headings, bullet points, and key takeaways.

CONTEXT ON OUR BUSINESS & MARKET RADAR:
${profileSummary}

REGISTERED COMPETITOR TARGETS:
${competitorsSummary}

RECENT INTELLIGENCE SIGNALS:
${cardsSummary}`;

      const historyFormatted = conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'MIRA Oracle'}: ${m.text}`).join('\n');
      const fullPrompt = `${systemInstruction}\n\nCONVERSATION HISTORY:\n${historyFormatted}\n\nUser Question: ${userMessage}\n\nMIRA Oracle Response:`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeGeminiKey}`,
        {
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.4 }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      console.error('Gemini API error during Strategy Copilot response:', err.message);
    }
  }

  // Fallback intelligent response builder
  const compCount = competitors.length;
  const highImpactCards = intelCards.filter(c => c.impact_score >= 7);

  return `### 🔮 MIRA Strategic Intelligence Report

Based on live telemetry across your **${compCount} monitored competitors** and **${intelCards.length} market signals**:

1. **Market Positioning Overview**
   - Your profile (**${profile?.business_name || 'Our Company'}**) is currently competing against key targets: ${competitors.slice(0, 3).map(c => c.name).join(', ') || 'registered targets'}.
   - Recent signals indicate ${highImpactCards.length > 0 ? `${highImpactCards.length} high-impact competitor moves detected this week.` : 'stable competitor activity over the current window.'}

2. **Strategic Recommendation for "${userMessage.substring(0, 40)}..."**
   - **Sales Enablement**: Ensure sales reps emphasize ROI and feature depth against ${competitors[0]?.name || 'competitors'}.
   - **Product Differentiation**: Focus on rapid integration and direct customer support SLAs where larger rivals struggle with rigidity.
   - **Pricing Agility**: Monitor pricing changes closely before initiating price reductions.

*Note: For deeper multi-agent scenario modelling, run a hypothesis in the **War Room** tab.*`;
}

/**
 * Interactive War Room ("What-If Market Simulator")
 */
async function runWarRoomSimulation(proposedMove, workspaceContext = {}, geminiApiKey = null) {
  const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;
  const { profile, competitors = [], intelCards = [], battlecards = [] } = workspaceContext;

  const profileSummary = profile ? `
Business Name: ${profile.business_name || 'Our Company'}
Product Description: ${profile.product_desc || 'SaaS Platform'}
Target Segment: ${profile.customers || 'B2B Software Buyers'}
Current Pricing: ${profile.price_point || 'Standard Tier'}
` : 'Business profile not set.';

  const compList = competitors.map(c => `- ${c.name} (${c.url})`).join('\n') || '- Generic Industry Competitors';

  if (activeGeminiKey) {
    try {
      console.log(`Running War Room simulation for proposed move: "${proposedMove}" using Gemini API...`);
      const systemInstruction = `You are an AI Multi-Agent Market & Game Theory Simulator.
Your role is to simulate competitive market reactions to a proposed strategic move by our company.

Respond ONLY with a valid JSON object wrapped inside <json> ... </json> tags matching this exact structure:
{
  "scenario": "Short descriptive title of the proposed move",
  "risk_score": 7,
  "risk_level": "HIGH",
  "market_impact_summary": "2-3 sentences explaining market dynamics, buyer response, and revenue potential.",
  "competitor_responses": [
    {
      "competitor_name": "Competitor Name",
      "predicted_action": "Exact predicted reaction (e.g. price cut, ad blast, feature release)",
      "likelihood_pct": 85,
      "timeframe": "1-2 Weeks",
      "threat_severity": "High"
    }
  ],
  "counter_offensive_playbook": [
    {
      "step": 1,
      "phase": "Immediate (Days 1-7)",
      "action": "Actionable tactical move",
      "details": "Execution guidelines for reps or product team"
    },
    {
      "step": 2,
      "phase": "Mid-term (Weeks 2-4)",
      "action": "Secondary strategic offensive",
      "details": "Execution guidelines"
    }
  ],
  "strategic_verdict": "PROCEED WITH CAUTION"
}`;

      const promptText = `
OUR BUSINESS CONTEXT:
${profileSummary}

MONITORED COMPETITORS:
${compList}

PROPOSED STRATEGIC MARKET MOVE TO SIMULATE:
"${proposedMove}"

Simulate market reaction and generate the simulation report wrapped in <json> tags.
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeGeminiKey}`,
        {
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${promptText}` }] }]
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/) || text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
      const jsonString = (jsonMatch[1] || text).trim();

      try {
        const parsed = JSON.parse(jsonString);
        return {
          scenario: parsed.scenario || proposedMove,
          risk_score: typeof parsed.risk_score === 'number' ? parsed.risk_score : 6,
          risk_level: parsed.risk_level || 'MEDIUM',
          market_impact_summary: parsed.market_impact_summary || 'The proposed move will disrupt competitor positioning and force defensive responses.',
          competitor_responses: Array.isArray(parsed.competitor_responses) ? parsed.competitor_responses : [],
          counter_offensive_playbook: Array.isArray(parsed.counter_offensive_playbook) ? parsed.counter_offensive_playbook : [],
          strategic_verdict: parsed.strategic_verdict || 'HIGH DISRUPTIVE POTENTIAL'
        };
      } catch (e) {
        console.warn('Failed to parse Gemini JSON output for War Room simulation. Raw text:', text);
      }
    } catch (err) {
      console.error('Gemini API error during War Room simulation:', err.message);
    }
  }

  // Fallback Simulation Engine
  const targetCompNames = competitors.length > 0 ? competitors.map(c => c.name) : ['Primary Rival', 'Secondary Competitor'];
  
  return {
    scenario: proposedMove,
    risk_score: 6,
    risk_level: 'MEDIUM',
    market_impact_summary: `Simulated execution of "${proposedMove}" across ${targetCompNames.length} competitor ecosystems. Expect initial market friction followed by competitive alignment within 14 days.`,
    competitor_responses: targetCompNames.map((name, i) => ({
      competitor_name: name,
      predicted_action: i === 0 ? `Initiate defensive feature announcement & match promotional pricing.` : `Launch targeted campaign pointing out legacy feature gaps.`,
      likelihood_pct: 80 - i * 15,
      timeframe: `${i + 1}-${i + 3} Weeks`,
      threat_severity: i === 0 ? 'High' : 'Moderate'
    })),
    counter_offensive_playbook: [
      {
        step: 1,
        phase: "Immediate (Days 1-7)",
        action: "Sales Battlecard & Objection Script Distribution",
        details: "Equip SDRs and AEs with comparison sheets before competitors adjust messaging."
      },
      {
        step: 2,
        phase: "Mid-Term (Weeks 2-4)",
        action: "Customer Value Proof Campaign",
        details: "Publish customer success case studies to reinforce market authority."
      }
    ],
    strategic_verdict: "STRATEGICALLY SOUND (MEDIUM RISK)"
  };
}

module.exports = {
  downloadLlamaCli,
  downloadModel,
  analyzeChange,
  generateBattlecardData,
  generateStrategyCopilotResponse,
  runWarRoomSimulation
};


