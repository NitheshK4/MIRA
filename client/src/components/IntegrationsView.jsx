import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Key, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Activity, 
  Layers, 
  BookOpen, 
  Server, 
  Webhook, 
  Cpu, 
  FileCode,
  ArrowRight
} from 'lucide-react';

export default function IntegrationsView({ workspaceId, settings }) {
  const [activeLang, setActiveLang] = useState('nodejs'); // 'nodejs', 'python', 'go', 'php'
  const [activeTab, setActiveTab] = useState('scrape'); // 'scrape', 'embeddings', 'warroom', 'webhooks'
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedWsId, setCopiedWsId] = useState(false);

  const apiKey = settings?.extensionApiKey || 'mira_live_sk_9f82a104b6c3e218';
  const serverUrl = window.location.origin;

  const languages = [
    { id: 'nodejs', name: 'Node.js', icon: '🟢', pkg: 'npm install @mira/sdk' },
    { id: 'python', name: 'Python', icon: '🐍', pkg: 'pip install mira-intel' },
    { id: 'go', name: 'Go', icon: '🐹', pkg: 'go get github.com/mira/sdk-go' },
    { id: 'php', name: 'PHP', icon: '🐘', pkg: 'composer require mira/sdk-php' }
  ];

  const useCases = [
    { id: 'scrape', name: '1. Scrape & Detect Changes', icon: Globe },
    { id: 'embeddings', name: '2. Semantic Similarity', icon: Cpu },
    { id: 'warroom', name: '3. War Room Simulation', icon: Zap },
    { id: 'webhooks', name: '4. Webhook Event Handler', icon: Webhook }
  ];

  const snippets = {
    nodejs: {
      scrape: `import { MiraClient } from '@mira/sdk';

// Initialize MIRA Client with Workspace Credentials
const mira = new MiraClient({
  apiKey: process.env.MIRA_API_KEY || '${apiKey}',
  baseUrl: '${serverUrl}',
  workspaceId: '${workspaceId}'
});

// Trigger an Autonomous Scrape & Semantic Change Analysis
async function monitorCompetitor() {
  const result = await mira.competitors.scrapeAndAnalyze({
    url: 'https://competitor.com/pricing',
    name: 'Competitor X',
    engine: 'puppeteer', // 'axios' (static HTML) or 'puppeteer' (JS SPA)
    similarityThreshold: 0.85 // ONNX semantic distance cutoff
  });

  if (result.hasSemanticChange) {
    console.log(\`🚨 High Impact Change (Score: \${result.impactScore}/10):\`);
    console.log(\`Summary: \${result.summary}\`);
    console.log(\`Recommendation: \${result.recommendation}\`);
  } else {
    console.log('✅ Baseline unchanged (semantic score >= 0.85)');
  }
}

monitorCompetitor().catch(console.error);`,

      embeddings: `import { MiraEmbeddings } from '@mira/sdk/ml';

// Local ONNX Sentence Embedding Comparison (Zero Cloud Latency)
const embedder = new MiraEmbeddings({ model: 'Xenova/all-MiniLM-L6-v2' });

async function checkSemanticDifference() {
  const v1 = await embedder.embed("Enterprise Tier: $99/mo including unlimited seats");
  const v2 = await embedder.embed("Enterprise Plan: $99 monthly with unlimited team members");

  const similarity = embedder.cosineSimilarity(v1, v2);
  console.log(\`Cosine Similarity Score: \${similarity.toFixed(4)}\`); // e.g. 0.9421
}

checkSemanticDifference();`,

      warroom: `import { MiraWarRoom } from '@mira/sdk';

const warRoom = new MiraWarRoom({ apiKey: '${apiKey}' });

// Run a Game-Theoretic Market Scenario Simulation
async function simulatePriceMove() {
  const simulation = await warRoom.simulateScenario({
    hypothesis: 'Drop pricing by 30% across all mid-market tiers',
    competitors: ['Rival Corp', 'Acme SaaS'],
    aggressiveness: 'high'
  });

  console.log(\`Risk Score: \${simulation.riskScore}/10 (\${simulation.threatLevel})\`);
  console.log('Predicted Competitor Responses:');
  simulation.responses.forEach(res => {
    console.log(\`- \${res.competitor}: \${res.action} (\${res.probability}% prob, timeframe: \${res.timeframe})\`);
  });
}

simulatePriceMove();`,

      webhooks: `import express from 'express';
import { verifyMiraWebhook } from '@mira/sdk/webhooks';

const app = express();
app.use(express.json());

// Express Endpoint for MIRA Real-Time Intel Webhooks
app.post('/api/webhooks/mira', (req, res) => {
  const isSignatureValid = verifyMiraWebhook({
    payload: req.body,
    signature: req.headers['x-mira-signature'],
    secret: process.env.MIRA_WEBHOOK_SECRET
  });

  if (!isSignatureValid) {
    return res.status(401).send('Invalid Webhook Signature');
  }

  const { event, competitor, impactScore, summary } = req.body;
  if (event === 'intel.high_impact_change') {
    console.log(\`📢 [\${competitor.name}] New Intel (Impact \${impactScore}): \${summary}\`);
  }

  res.status(200).send({ received: true });
});

app.listen(4000, () => console.log('Webhook receiver running on port 4000'));`
    },

    python: {
      scrape: `from mira import MiraClient
import os

# Initialize MIRA Client
client = MiraClient(
    api_key=os.getenv("MIRA_API_KEY", "${apiKey}"),
    base_url="${serverUrl}",
    workspace_id="${workspaceId}"
)

def monitor_competitor():
    # Trigger Autonomous Scrape & Semantic Change Analysis
    report = client.competitors.scrape_and_analyze(
        url="https://competitor.com/pricing",
        name="Competitor X",
        engine="puppeteer",
        similarity_threshold=0.85
    )

    if report.has_semantic_change:
        print(f"🚨 High Impact Change Detected! Score: {report.impact_score}/10")
        print(f"Summary: {report.summary}")
        print(f"Action item: {report.recommendation}")
    else:
        print("✅ Baseline unchanged")

if __name__ == "__main__":
    monitor_competitor()`,

      embeddings: `from mira.ml import SentenceEmbedder

# Local ONNX Embedding Model (MiniLM-L6-v2)
embedder = SentenceEmbedder(model_name="all-MiniLM-L6-v2")

vec1 = embedder.encode("Enterprise Tier: $99/mo including unlimited seats")
vec2 = embedder.encode("Enterprise Plan: $99 monthly with unlimited team members")

similarity = embedder.cosine_similarity(vec1, vec2)
print(f"Cosine Similarity Score: {similarity:.4f}")  # e.g., 0.9421`,

      warroom: `from mira import WarRoomSimulator

war_room = WarRoomSimulator(api_key="${apiKey}")

# Run Game-Theory Market Reaction Simulation
sim = war_room.simulate(
    hypothesis="Drop pricing by 30% across all mid-market tiers",
    aggressiveness="high"
)

print(f"Scenario Risk Score: {sim.risk_score}/10 ({sim.threat_level})")
print("Counter-Offensive Playbook Steps:")
for step in sim.playbook:
    print(f" - [{step['phase']}]: {step['action']}")`,

      webhooks: `from flask import Flask, request, jsonify
from mira.webhooks import verify_signature

app = Flask(__name__)

@app.route("/webhooks/mira", methods=["POST"])
def mira_webhook_handler():
    signature = request.headers.get("X-Mira-Signature")
    if not verify_signature(request.data, signature, secret="whsec_mira_123"):
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.json
    print(f"Received MIRA event: {payload['event']}")
    return jsonify({"status": "success"}), 200

if __name__ == "__main__":
    app.run(port=5000)`
    },

    go: {
      scrape: `package main

import (
	"context"
	"fmt"
	"log"

	"github.com/mira/sdk-go/mira"
)

func main() {
	client := mira.NewClient(&mira.Config{
		APIKey:      "${apiKey}",
		BaseURL:     "${serverUrl}",
		WorkspaceID: "${workspaceId}",
	})

	ctx := context.Background()
	report, err := client.Competitors.ScrapeAndAnalyze(ctx, mira.ScrapeRequest{
		URL:                  "https://competitor.com/pricing",
		Name:                 "Competitor X",
		Engine:               "puppeteer",
		SimilarityThreshold: 0.85,
	})
	if err != nil {
		log.Fatalf("Scrape error: %v", err)
	}

	if report.HasSemanticChange {
		fmt.Printf("🚨 Change Detected! Impact: %d/10\\n", report.ImpactScore)
		fmt.Printf("Summary: %s\\n", report.Summary)
	} else {
		fmt.Println("✅ No semantic content change detected")
	}
}`,

      embeddings: `package main

import (
	"fmt"
	"github.com/mira/sdk-go/embeddings"
)

func main() {
	emb := embeddings.NewEmbedder("all-MiniLM-L6-v2")

	vecA, _ := emb.Embed("Enterprise Tier: $99/mo including unlimited seats")
	vecB, _ := emb.Embed("Enterprise Plan: $99 monthly with unlimited team members")

	sim := embeddings.CosineSimilarity(vecA, vecB)
	fmt.Printf("Cosine Similarity: %.4f\\n", sim)
}`,

      warroom: `package main

import (
	"context"
	"fmt"
	"github.com/mira/sdk-go/mira"
)

func main() {
	client := mira.NewClient(&mira.Config{APIKey: "${apiKey}"})

	sim, _ := client.WarRoom.Simulate(context.Background(), mira.WarRoomOptions{
		Hypothesis: "Drop pricing by 30% across all mid-market tiers",
	})

	fmt.Printf("Risk Score: %d/10 (%s)\\n", sim.RiskScore, sim.ThreatLevel)
}`,

      webhooks: `package main

import (
	"fmt"
	"net/http"
	"github.com/mira/sdk-go/webhooks"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	event, err := webhooks.ParseEvent(r, "whsec_mira_123")
	if err != nil {
		http.Error(w, "Bad signature", http.StatusUnauthorized)
		return
	}

	fmt.Printf("Processed event: %s for %s\\n", event.Type, event.CompetitorName)
	w.WriteHeader(http.StatusOK)
}

func main() {
	http.HandleFunc("/webhooks/mira", webhookHandler)
	http.ListenAndServe(":8080", nil)
}`
    },

    php: {
      scrape: `<?php

require 'vendor/autoload.php';

use Mira\\Client\\MiraClient;

$mira = new MiraClient([
    'api_key'      => '${apiKey}',
    'base_url'     => '${serverUrl}',
    'workspace_id' => '${workspaceId}'
]);

$report = $mira->competitors->scrapeAndAnalyze([
    'url'                  => 'https://competitor.com/pricing',
    'name'                 => 'Competitor X',
    'engine'               => 'puppeteer',
    'similarityThreshold' => 0.85
]);

if ($report->hasSemanticChange) {
    echo "🚨 High Impact Change Score: " . $report->impactScore . "/10\\n";
    echo "Summary: " . $report->summary . "\\n";
} else {
    echo "✅ Baseline unchanged\\n";
}`,

      embeddings: `<?php

use Mira\\ML\\SentenceEmbedder;

$embedder = new SentenceEmbedder('all-MiniLM-L6-v2');

$v1 = $embedder->embed("Enterprise Tier: $99/mo including unlimited seats");
$v2 = $embedder->embed("Enterprise Plan: $99 monthly with unlimited team members");

$score = $embedder->cosineSimilarity($v1, $v2);
echo "Cosine Similarity: " . round($score, 4) . "\\n";`,

      warroom: `<?php

use Mira\\Client\\MiraClient;

$mira = new MiraClient(['api_key' => '${apiKey}']);

$sim = $mira->warRoom->simulateScenario([
    'hypothesis' => 'Drop pricing by 30% across all mid-market tiers'
]);

echo "Risk Score: " . $sim->riskScore . "/10 (" . $sim->threatLevel . ")\\n";`,

      webhooks: `<?php

use Mira\\Webhooks\\WebhookValidator;

$payload = file_get_contents('php://input');
$sig = $_SERVER['HTTP_X_MIRA_SIGNATURE'] ?? '';

if (!WebhookValidator::verify($payload, $sig, 'whsec_mira_123')) {
    http_response_code(401);
    exit('Invalid signature');
}

$data = json_decode($payload, true);
echo "Handled event: " . $data['event'];`
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'snippet') {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else if (type === 'apikey') {
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    } else if (type === 'wsid') {
      setCopiedWsId(true);
      setTimeout(() => setCopiedWsId(false), 2000);
    }
  };

  const currentSnippet = snippets[activeLang][activeTab];
  const currentLangObj = languages.find(l => l.id === activeLang);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--surface-color)] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Terminal size={22} />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Developer SDKs & API Integrations
            </h1>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Integrate MIRA's autonomous web scraping, ONNX semantic change detection, War Room simulations, and automated battlecards directly into your applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="#/docs"
            onClick={(e) => { e.preventDefault(); alert('Full API Documentation: Refer to README.md and OpenAPI endpoints on server'); }}
            className="mira-btn mira-btn-secondary mira-btn-sm"
          >
            <BookOpen size={14} />
            <span>API Docs</span>
          </a>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
            <ShieldCheck size={14} />
            <span>v2.0 API Active</span>
          </div>
        </div>
      </div>

      {/* CREDENTIALS QUICK CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Key Box */}
        <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key size={13} className="text-amber-400" />
              Workspace API Key
            </span>
            <span className="text-[11px] font-mono text-slate-500">Header: x-api-key / Bearer</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono text-xs text-amber-300">
            <span className="truncate max-w-[280px]">{apiKey}</span>
            <button 
              onClick={() => handleCopy(apiKey, 'apikey')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1 text-[11px]"
            >
              {copiedApiKey ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedApiKey ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Workspace ID Box */}
        <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server size={13} className="text-cyan-400" />
              Active Workspace ID
            </span>
            <span className="text-[11px] font-mono text-slate-500">Header: x-workspace-id</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono text-xs text-cyan-300">
            <span className="truncate">{workspaceId}</span>
            <button 
              onClick={() => handleCopy(workspaceId, 'wsid')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-1 text-[11px]"
            >
              {copiedWsId ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedWsId ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LANGUAGE SELECTOR TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  activeLang === lang.id
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400/50 shadow-lg shadow-violet-500/20'
                    : 'bg-white/5 text-slate-400 border-transparent hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{lang.icon}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span>Package:</span>
            <code className="text-emerald-400 font-bold">{currentLangObj.pkg}</code>
          </div>
        </div>

        {/* USE CASE SUB-TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {useCases.map(uc => {
            const Icon = uc.icon;
            return (
              <button
                key={uc.id}
                onClick={() => setActiveTab(uc.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === uc.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-inner'
                    : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{uc.name}</span>
              </button>
            );
          })}
        </div>

        {/* CODE SNIPPET DISPLAY PANEL */}
        <div className="relative rounded-2xl bg-[#0B0F19] border border-white/15 overflow-hidden shadow-2xl">
          {/* Code Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#121826] border-b border-white/10 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-violet-400" />
              <span className="text-white font-bold">{currentLangObj.name} SDK Example</span>
              <span>•</span>
              <span className="text-cyan-400">{activeTab}.{activeLang === 'nodejs' ? 'js' : activeLang === 'python' ? 'py' : activeLang === 'go' ? 'go' : 'php'}</span>
            </div>

            <button
              onClick={() => handleCopy(currentSnippet, 'snippet')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors font-sans text-xs font-bold border border-violet-500/30"
            >
              {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSnippet ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Pre Block */}
          <div className="p-6 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200 selection:bg-violet-500/40">
            <pre><code>{currentSnippet}</code></pre>
          </div>

          {/* Code Footer info */}
          <div className="px-5 py-2.5 bg-[#090C14] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Authentication: Bearer Token / x-workspace-id</span>
            <span>Response: JSON (Structured Output)</span>
          </div>
        </div>
      </div>

      {/* API FEATURES MATRIX */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          <span>Core SDK Capability Matrix</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-2">
              <Globe size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">Double-Engine Scraper API</h3>
            <p className="text-xs text-slate-400">
              Trigger Axios (static HTML) or Puppeteer (dynamic JavaScript SPA) scraping on demand with auto-cleaning of navigation, headers, and banners.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Cpu size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">ONNX Embeddings Engine</h3>
            <p className="text-xs text-slate-400">
              Run client-side or server-side cosine similarity evaluations using lightweight ONNX MiniLM models to filter string noise.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <Zap size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">War Room & Battlecards</h3>
            <p className="text-xs text-slate-400">
              Programmatically query LLM battlecards, competitor SWOT analyses, and game-theory counter-offensive simulation playbooks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
