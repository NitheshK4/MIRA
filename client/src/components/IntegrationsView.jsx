import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Key, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Server, 
  Webhook, 
  Cpu, 
  FileCode,
  BookOpen
} from 'lucide-react';

export default function IntegrationsView({ workspaceId, settings }) {
  const [activeLang, setActiveLang] = useState('php'); // 'php', 'python', 'go'
  const [activeTab, setActiveTab] = useState('competitors'); // 'competitors', 'changes', 'battlecards', 'warroom', 'webhooks'
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedWsId, setCopiedWsId] = useState(false);

  const apiKey = settings?.api_key || 'NOT_CONFIGURED';
  const serverUrl = window.location.origin;

  const languages = [
    { id: 'php', name: 'PHP', icon: '🐘', pkg: "require_once 'php/MiraClient.php';" },
    { id: 'python', name: 'Python', icon: '🐍', pkg: 'from python.mira_sdk import MiraClient' },
    { id: 'go', name: 'Go', icon: '🐹', pkg: 'import "mira"' }
  ];

  const useCases = [
    { id: 'competitors', name: '1. Competitors & Scan', icon: Globe },
    { id: 'changes', name: '2. Intelligence Feed', icon: Cpu },
    { id: 'battlecards', name: '3. Battlecards', icon: ShieldCheck },
    { id: 'warroom', name: '4. War Room Simulation', icon: Zap },
    { id: 'webhooks', name: '5. Outbound Webhook', icon: Webhook }
  ];

  const snippets = {
    php: {
      competitors: `<?php
require_once 'php/MiraClient.php';

$mira = new MiraClient(
    '${serverUrl}',
    '${workspaceId}',
    '${apiKey}'
);

// 1. List existing competitors
$competitors = $mira->getCompetitors();
print_r($competitors);

// 2. Add a new competitor target
$comp = $mira->addCompetitor('Competitor X', 'https://competitor.com/pricing');
print_r($comp);

// 3. Trigger immediate scraper job (POST /api/competitors/:id/scrape)
if (isset($comp['id'])) {
    $scrape = $mira->triggerScrape($comp['id']);
    print_r($scrape);
}`,

      changes: `<?php
require_once 'php/MiraClient.php';

$mira = new MiraClient(
    '${serverUrl}',
    '${workspaceId}',
    '${apiKey}'
);

// Fetch recent intelligence alerts (GET /api/changes)
$feed = $mira->getChanges(50);
$cards = is_array($feed) && isset($feed['changes']) ? $feed['changes'] : $feed;

foreach ((array)$cards as $card) {
    $category = $card['category'] ?? 'Intel';
    $name = $card['competitor_name'] ?? 'Competitor';
    $score = $card['impact_score'] ?? 0;
    $summary = $card['summary'] ?? '';

    echo "🚨 [{$category}] {$name} (Impact Score: {$score}/10)\n";
    echo "Summary: {$summary}\n\n";
}`,

      battlecards: `<?php
require_once 'php/MiraClient.php';

$mira = new MiraClient(
    '${serverUrl}',
    '${workspaceId}',
    '${apiKey}'
);

// Retrieve auto-generated sales battlecards (GET /api/battlecards)
$battlecards = $mira->getBattlecards();
print_r($battlecards);`,

      warroom: `<?php
require_once 'php/MiraClient.php';

$mira = new MiraClient(
    '${serverUrl}',
    '${workspaceId}',
    '${apiKey}'
);

// Trigger game-theory market scenario simulation (POST /api/war-room/simulate)
$simulation = $mira->simulateWarRoom('Drop pricing by 30% across all mid-market tiers');
print_r($simulation);`,

      webhooks: `<?php
// PHP Receiver for MIRA Outbound Webhooks
$payload = file_get_contents('php://input');
$event = json_decode($payload, true);

if ($event && isset($event['intel'])) {
    $compName = $event['competitor']['name'] ?? 'Unknown';
    $score = $event['intel']['impact_score'] ?? 0;
    $summary = $event['intel']['summary'] ?? '';

    error_log("📢 [MIRA Webhook] {$compName} - Impact {$score}/10: {$summary}");
    http_response_code(200);
    echo json_encode(['received' => true]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
}`
    },

    python: {
      competitors: `from python.mira_sdk import MiraClient

client = MiraClient(
    base_url="${serverUrl}",
    workspace_id="${workspaceId}",
    api_key="${apiKey}"
)

# 1. Get monitored competitors (GET /api/competitors)
competitors = client.get_competitors()
print("Competitors:", competitors)

# 2. Add a new competitor (POST /api/competitors)
comp = client.add_competitor(name="Competitor X", url="https://competitor.com/pricing")
print("Added Competitor:", comp)

# 3. Trigger immediate scrape (POST /api/competitors/:id/scrape)
if "id" in comp:
    scan = client.trigger_scrape(comp["id"])
    print("Scrape Status:", scan)`,

      changes: `from python.mira_sdk import MiraClient

client = MiraClient(
    base_url="${serverUrl}",
    workspace_id="${workspaceId}",
    api_key="${apiKey}"
)

# Fetch intelligence change feed (GET /api/changes)
feed = client.get_changes(limit=50)
cards = feed.get("changes", feed) if isinstance(feed, dict) else feed

for card in cards:
    category = card.get("category", "Intel")
    name = card.get("competitor_name", "Competitor")
    score = card.get("impact_score", 0)
    summary = card.get("summary", "")
    print(f"🚨 [{category}] {name} (Impact: {score}/10)")
    print(f"Summary: {summary}\n")`,

      battlecards: `from python.mira_sdk import MiraClient

client = MiraClient(
    base_url="${serverUrl}",
    workspace_id="${workspaceId}",
    api_key="${apiKey}"
)

# Retrieve competitive battlecards (GET /api/battlecards)
cards = client.get_battlecards()
print("Battlecards:", cards)`,

      warroom: `from python.mira_sdk import MiraClient

client = MiraClient(
    base_url="${serverUrl}",
    workspace_id="${workspaceId}",
    api_key="${apiKey}"
)

# Execute War Room game-theory simulation (POST /api/war-room/simulate)
sim = client.simulate_war_room(scenario="Drop pricing by 30% across all mid-market tiers")
print("War Room Outcome:", sim)`,

      webhooks: `from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/webhooks/mira", methods=["POST"])
def handle_mira_webhook():
    event = request.json
    if not event or "intel" not in event:
        return jsonify({"error": "Invalid payload"}), 400

    comp = event.get("competitor", {}).get("name", "Unknown")
    score = event.get("intel", {}).get("impact_score", 0)
    summary = event.get("intel", {}).get("summary", "")

    print(f"📢 [MIRA Webhook] {comp} - Impact {score}/10: {summary}")
    return jsonify({"status": "received"}), 200

if __name__ == "__main__":
    app.run(port=5000)`
    },

    go: {
      competitors: `package main

import (
	"context"
	"fmt"
	"log"

	mira "github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func main() {
	client := mira.NewClient(
		"${serverUrl}",
		mira.WithWorkspaceID("${workspaceId}"),
		mira.WithAPIKey("${apiKey}"),
	)

	ctx := context.Background()

	// 1. Get competitors (GET /api/competitors)
	comps, err := client.GetCompetitors(ctx)
	if err != nil {
		log.Fatalf("GetCompetitors error: %v", err)
	}
	fmt.Printf("Competitors count: %d\\n", comps.Count)

	// 2. Add competitor (POST /api/competitors)
	comp, err := client.AddCompetitor(ctx, "Competitor X", "https://competitor.com/pricing")
	if err != nil {
		log.Fatalf("AddCompetitor error: %v", err)
	}
	fmt.Printf("Added: %+v\\n", comp)

	// 3. Trigger immediate scrape (POST /api/competitors/:id/scrape)
	scan, err := client.TriggerScrape(ctx, 1)
	if err != nil {
		log.Fatalf("TriggerScrape error: %v", err)
	}
	fmt.Printf("Scan result: %+v\\n", scan)
}`,

      changes: `package main

import (
	"context"
	"fmt"
	"log"

	mira "github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func main() {
	client := mira.NewClient(
		"${serverUrl}",
		mira.WithWorkspaceID("${workspaceId}"),
		mira.WithAPIKey("${apiKey}"),
	)

	// Fetch changes feed (GET /api/changes)
	feed, err := client.GetChanges(context.Background(), 50, nil)
	if err != nil {
		log.Fatalf("GetChanges error: %v", err)
	}

	for _, card := range feed.Changes {
		fmt.Printf("🚨 [%s] %s (Impact: %d/10)\\nSummary: %s\\n\\n",
			card.Category, card.CompetitorName, card.ImpactScore, card.Summary)
	}
}`,

      battlecards: `package main

import (
	"context"
	"fmt"
	"log"

	mira "github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func main() {
	client := mira.NewClient(
		"${serverUrl}",
		mira.WithWorkspaceID("${workspaceId}"),
		mira.WithAPIKey("${apiKey}"),
	)

	// Get battlecards (GET /api/battlecards)
	cards, err := client.GetBattlecards(context.Background())
	if err != nil {
		log.Fatalf("GetBattlecards error: %v", err)
	}
	fmt.Printf("Battlecards count: %d\\n", len(cards.Battlecards))
}`,

      warroom: `package main

import (
	"context"
	"fmt"
	"log"

	mira "github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func main() {
	client := mira.NewClient(
		"${serverUrl}",
		mira.WithWorkspaceID("${workspaceId}"),
		mira.WithAPIKey("${apiKey}"),
	)

	// Run War Room simulation (POST /api/war-room/simulate)
	sim, err := client.SimulateWarRoom(context.Background(), mira.WarRoomRequest{
		Scenario: "Drop pricing by 30% across all mid-market tiers",
	})
	if err != nil {
		log.Fatalf("SimulateWarRoom error: %v", err)
	}
	fmt.Printf("Simulation result: %+v\\n", sim)
}`,

      webhooks: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type MiraWebhookPayload struct {
	Event      string \`json:"event"\`
	Competitor struct {
		Name string \`json:"name"\`
	} \`json:"competitor"\`
	Intel struct {
		ImpactScore int    \`json:"impact_score"\`
		Summary     string \`json:"summary"\`
	} \`json:"intel"\`
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	var payload MiraWebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("📢 [MIRA Webhook] %s - Impact %d/10: %s\\n",
		payload.Competitor.Name, payload.Intel.ImpactScore, payload.Intel.Summary)
	w.WriteHeader(http.StatusOK)
}

func main() {
	http.HandleFunc("/webhooks/mira", webhookHandler)
	http.ListenAndServe(":8080", nil)
}`
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

  const currentSnippet = snippets[activeLang]?.[activeTab] || '';
  const currentLangObj = languages.find(l => l.id === activeLang) || languages[0];

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
            Integrate MIRA's autonomous web scraping, semantic change feeds, sales battlecards, and War Room strategy simulations directly using supported PHP, Python, and Go SDKs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="#/docs"
            onClick={(e) => { e.preventDefault(); alert('Refer to README.md for full endpoint specifications.'); }}
            className="mira-btn mira-btn-secondary mira-btn-sm"
          >
            <BookOpen size={14} />
            <span>API Docs</span>
          </a>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
            <ShieldCheck size={14} />
            <span>v2.0 REST API Active</span>
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
            <span className="text-[11px] font-mono text-slate-500">Header: Authorization Bearer / X-Api-Key</span>
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
            <span className="text-[11px] font-mono text-slate-500">Header: X-Workspace-Id</span>
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
            <span>Import / Include:</span>
            <code className="text-emerald-400 font-bold">{currentLangObj.pkg}</code>
          </div>
        </div>

        {/* USE CASE SUB-TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
              <span className="text-white font-bold">{currentLangObj.name} SDK Integration Example</span>
              <span>•</span>
              <span className="text-cyan-400">{activeTab}.{activeLang === 'python' ? 'py' : activeLang === 'go' ? 'go' : 'php'}</span>
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
            <span>Auth Header: Authorization: Bearer / X-Workspace-Id</span>
            <span>Response: Application/JSON</span>
          </div>
        </div>
      </div>

      {/* API FEATURES MATRIX */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          <span>Supported Native SDK Implementations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-2">
              <Globe size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">PHP Subsystem (`php/MiraClient.php`)</h3>
            <p className="text-xs text-slate-400">
              Object-oriented PHP client supporting competitor monitoring, instant scrape triggers, change feeds, battlecard querying, and War Room simulations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Cpu size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">Python SDK (`python/mira_sdk`)</h3>
            <p className="text-xs text-slate-400">
              Native Python wrapper using standard library `urllib` for zero-dependency integration across data science, automation, and analytics pipelines.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <Zap size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">Go Client (`go/mira.go`)</h3>
            <p className="text-xs text-slate-400">
              Fully typed Go package with context cancellation, custom option functions (`WithWorkspaceID`, `WithAPIKey`), and JSON struct unmarshaling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
