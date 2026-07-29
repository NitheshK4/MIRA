const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { env, pipeline } = require('@huggingface/transformers');
const { spawn } = require('child_process');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
env.cacheDir = CACHE_DIR;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const LOCAL_MODEL_DIR = path.join(CACHE_DIR, 'Xenova', 'all-MiniLM-L6-v2');
const ONNX_DIR = path.join(LOCAL_MODEL_DIR, 'onnx');

// List of required model files to fetch from HF
const FILES_TO_DOWNLOAD = [
  { name: 'config.json', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/config.json', destDir: LOCAL_MODEL_DIR },
  { name: 'tokenizer.json', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer.json', destDir: LOCAL_MODEL_DIR },
  { name: 'tokenizer_config.json', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer_config.json', destDir: LOCAL_MODEL_DIR },
  { name: 'model.onnx', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx', destDir: ONNX_DIR }
];

async function ensureEmbeddingModel() {
  if (!fs.existsSync(LOCAL_MODEL_DIR)) fs.mkdirSync(LOCAL_MODEL_DIR, { recursive: true });
  if (!fs.existsSync(ONNX_DIR)) fs.mkdirSync(ONNX_DIR, { recursive: true });

  for (const file of FILES_TO_DOWNLOAD) {
    const filePath = path.join(file.destDir, file.name);
    
    // If file doesn't exist or is empty, download it manually
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
      console.log(`Downloading embedding file: ${file.name}...`);
      
      const tempPath = filePath + '.tmp';
      const writer = fs.createWriteStream(tempPath);
      
      const response = await axios({
        url: file.url,
        method: 'GET',
        responseType: 'stream',
        timeout: 60000
      });
      
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      fs.renameSync(tempPath, filePath);
      console.log(`Successfully downloaded: ${file.name}`);
    }
  }
}

let embedPipeline = null;
let modelInitPromise = null;

// Dynamically load HuggingFace transformers pipeline with concurrency safety
async function getPipeline() {
  if (embedPipeline) return embedPipeline;
  
  if (!modelInitPromise) {
    modelInitPromise = (async () => {
      await ensureEmbeddingModel();
      embedPipeline = await pipeline('feature-extraction', MODEL_NAME);
    })();
  }
  
  await modelInitPromise;
  return embedPipeline;
}

// Compute dot product of two vectors (cosine similarity since vectors are normalized)
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

async function getEmbedding(text) {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Splits text into semantic chunks (paragraphs)
function getChunks(text) {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 10); // Ignore tiny fragments
}

/**
 * Compare two text versions semantically chunk-by-chunk using pure JavaScript.
 * (Saved as a robust local fallback engine).
 */
async function detectChangesJS(oldText, newText, threshold = 0.85) {
  if (!oldText) {
    const newChunks = getChunks(newText);
    return {
      hasChanged: newChunks.length > 0,
      similarity: 0.0,
      diffText: newChunks.map(c => `+ ${c}`).join('\n'),
      addedChunks: newChunks,
      removedChunks: []
    };
  }

  const oldChunks = getChunks(oldText);
  const newChunks = getChunks(newText);

  if (oldChunks.length === 0 && newChunks.length === 0) {
    return { hasChanged: false, similarity: 1.0, diffText: '', addedChunks: [], removedChunks: [] };
  }

  if (oldChunks.length === 0 || newChunks.length === 0) {
    return {
      hasChanged: true,
      similarity: 0.0,
      diffText: newChunks.map(c => `+ ${c}`).join('\n') + '\n' + oldChunks.map(c => `- ${c}`).join('\n'),
      addedChunks: newChunks,
      removedChunks: oldChunks
    };
  }

  const oldEmbeddings = await Promise.all(oldChunks.map(async c => ({ text: c, vector: await getEmbedding(c) })));
  const newEmbeddings = await Promise.all(newChunks.map(async c => ({ text: c, vector: await getEmbedding(c) })));

  const addedChunks = [];
  const matchedOldIndices = new Set();
  const diffLines = [];

  for (const newChunk of newEmbeddings) {
    let bestMatchScore = -1;
    let bestMatchIndex = -1;

    for (let i = 0; i < oldEmbeddings.length; i++) {
      const score = cosineSimilarity(newChunk.vector, oldEmbeddings[i].vector);
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchIndex = i;
      }
    }

    if (bestMatchScore < threshold) {
      addedChunks.push(newChunk.text);
      diffLines.push(`+ ${newChunk.text}`);
    } else {
      matchedOldIndices.add(bestMatchIndex);
    }
  }

  const removedChunks = [];
  for (let i = 0; i < oldEmbeddings.length; i++) {
    if (!matchedOldIndices.has(i)) {
      removedChunks.push(oldEmbeddings[i].text);
      diffLines.push(`- ${oldEmbeddings[i].text}`);
    }
  }

  let totalMatchScore = 0;
  let matchCount = 0;
  
  for (const newChunk of newEmbeddings) {
    let maxScore = 0;
    for (const oldChunk of oldEmbeddings) {
      const score = cosineSimilarity(newChunk.vector, oldChunk.vector);
      if (score > maxScore) maxScore = score;
    }
    totalMatchScore += maxScore;
    matchCount++;
  }

  const overallSimilarity = matchCount > 0 ? (totalMatchScore / matchCount) : 0.0;
  const hasChanged = addedChunks.length > 0 || removedChunks.length > 0;

  return {
    hasChanged,
    similarity: overallSimilarity,
    diffText: diffLines.join('\n'),
    addedChunks,
    removedChunks
  };
}

/**
 * Compare two text versions semantically chunk-by-chunk.
 * Primary: Gemini API with rate-limiting retry.
 * Fallback: Local JS-ONNX transformers pipeline.
 */
async function detectChangesGemini(oldText, newText, apiKey, geminiModel = null) {
  const targetModel = geminiModel || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const systemPrompt = `You are a text change detector. Your job is to compare the old text of a webpage with the new text, and determine if the core content has changed significantly.
Ignore minor cosmetic noise (like clock timestamps changing, minor page views/comment counters incrementing, or copyright years updating).
If new sections, articles, text blocks, or headlines have been added, removed, or rewritten, you must flag this as a change.

Respond STRICTLY in JSON format with these exact keys:
{
  "hasChanged": true or false,
  "similarity": a float between 0.0 and 1.0 (where 1.0 means no change at all, and lower values mean more change. If some headlines/posts changed, similarity should be around 0.5 to 0.8),
  "diffText": "A string highlighting the changes, like adding lines with + and removing with -"
}`;

  const userPrompt = `
Old Webpage Content:
"""
${oldText || '(Empty)'}
"""

New Webpage Content:
"""
${newText || '(Empty)'}
"""

Compare the two contents and return the JSON response.`;

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  let res;
  let retries = 3;
  let delay = 1000;
  
  for (let i = 0; i < retries; i++) {
    try {
      res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      break;
    } catch (err) {
      if (err.response && err.response.status === 429 && i < retries - 1) {
        console.warn(`Gemini change detection rate limited (429). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }

  const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(rawText.trim());
  
  return {
    hasChanged: !!parsed.hasChanged,
    similarity: parseFloat(parsed.similarity ?? 0.5),
    diffText: parsed.diffText || '',
    addedChunks: [],
    removedChunks: []
  };
}

function detectChangesLightweight(oldText, newText, threshold = 0.85) {
  const getWords = (text) => {
    if (!text) return new Set();
    return new Set(text.toLowerCase().match(/\b\w{3,}\b/g) || []);
  };

  const oldWords = getWords(oldText);
  const newWords = getWords(newText);

  if (oldWords.size === 0 && newWords.size === 0) {
    return { hasChanged: false, similarity: 1.0, diffText: '', addedChunks: [], removedChunks: [] };
  }

  const intersection = new Set([...oldWords].filter(w => newWords.has(w)));
  const union = new Set([...oldWords, ...newWords]);
  const jaccardSim = intersection.size / union.size;

  const hasChanged = jaccardSim < threshold;

  return {
    hasChanged,
    similarity: jaccardSim,
    diffText: hasChanged ? `Content changed. Overlap similarity: ${jaccardSim.toFixed(2)}` : '',
    addedChunks: [],
    removedChunks: []
  };
}

async function detectChanges(oldText, newText, threshold = 0.85) {
  const isCloudEnv = !!(process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (isCloudEnv && geminiApiKey) {
    try {
      console.log('Cloud environment detected: Using Gemini API for semantic change detection to save memory...');
      return await detectChangesGemini(oldText, newText, geminiApiKey);
    } catch (err) {
      console.warn('Gemini semantic change detection failed, falling back to lightweight word similarity:', err.message);
      return detectChangesLightweight(oldText, newText, threshold);
    }
  }

  try {
    return await detectChangesJS(oldText, newText, threshold);
  } catch (err) {
    console.warn(`Local JS embedder failed, falling back to lightweight word similarity:`, err.message);
    return detectChangesLightweight(oldText, newText, threshold);
  }
}

module.exports = {
  getEmbedding,
  detectChanges,
  cosineSimilarity
};
