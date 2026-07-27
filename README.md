<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,50:7C3AED,100:EC4899&height=230&section=header&text=M%20I%20R%20A&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Market%20Intelligence%20and%20Research%20Automation&descSize=18&descAlignY=58&descAlign=50" width="100%" />

<!-- Typing Animation -->
<br/>
<a href="#-overview">
<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&duration=3000&pause=1500&color=A78BFA&center=true&vCenter=true&multiline=true&repeat=true&width=820&height=80&lines=Scrape+%E2%86%92+Detect+%E2%86%92+Analyze+%E2%86%92+Simulate+%E2%86%92+Dominate;Autonomous+Competitor+Intelligence+Engine+with+AI+War+Room" alt="Typing SVG" />
</a>

<br/><br/>

<!-- Primary Badges -->
[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![HuggingFace](https://img.shields.io/badge/🤗_ONNX-FFD21E?style=for-the-badge)](https://huggingface.co)
[![Chrome MV3](https://img.shields.io/badge/Chrome_MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com)

[![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://slack.com)
[![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white)](https://notion.so)
[![Gmail](https://img.shields.io/badge/SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

![RAM](https://img.shields.io/badge/RAM-≤_512MB-blueviolet?style=flat-square)
![Inference](https://img.shields.io/badge/Inference-CPU_Only-orange?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
[![Stars](https://img.shields.io/github/stars/NitheshK4/Autonomous-Competitor-Intelligence-Engine?style=flat-square&color=FFD21E)](https://github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/stargazers)

</div>

<br/>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📑 Table of Contents

<details open>
<summary>Click to expand</summary>

- [Overview](#-overview)
- [What's New — v2.0](#-whats-new--v20)
- [Live Demo](#-live-demo)
- [System Architecture](#️-system-architecture)
- [ML Pipeline](#-ml-pipeline)
- [Chrome Extension](#-chrome-extension)
- [Core Features](#-core-features)
- [AI Strategy Co-Pilot (MIRA Oracle)](#-ai-strategy-co-pilot--mira-oracle)
- [Competitive War Room Simulator](#️-competitive-war-room-simulator)
- [Auto-Generated Battlecards](#-auto-generated-battlecards)
- [Model Configurations](#-model-configurations)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Integration Guides](#-integration-guides)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Known Limitations](#️-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🌟 Overview

> **MIRA** (**M**arket **I**ntelligence & **R**esearch **A**utomation) is an autonomous, self-healing competitor monitoring engine with an **AI-powered strategy co-pilot** and **competitive war room simulator**. It scrapes competitor websites on a configurable schedule, detects *meaningful* content changes using **ONNX sentence embeddings**, analyzes business impact with **Gemini 2.5 Flash** (with a local **Qwen GGUF** fallback), generates **auto-battlecards**, and pushes real-time alerts to **Slack**, **Email**, and **Notion / Airtable CRM** — all within a **512 MB RAM** footprint.

<br/>

<div align="center">

| 🔬 Scrape | 🧠 Detect | 📊 Analyze & Score | ⚔️ Simulate | 🚨 Alert |
|:---:|:---:|:---:|:---:|:---:|
| Axios + Puppeteer | ONNX Embeddings | Gemini 2.5 Flash / Qwen | War Room + Oracle | Slack + Email + CRM |
| Static & JS pages | Cosine similarity | Impact 1–10 + Battlecards | Game-theory simulation | Real-time webhooks |

</div>

<br/>

### ✨ Why MIRA?

<table>
<tr>
<td>

**🧠 Semantic Understanding**<br/>
No brittle string diffs. Changes are compared by *meaning*, not characters. "Price is $100" ≈ "Current Price: $100" → no false alert.

</td>
<td>

**🔄 Triple-Tier Fallback**<br/>
Cloud LLM → Local GGUF → Rule-based heuristics. MIRA always produces analysis, even fully offline.

</td>
</tr>
<tr>
<td>

**🔮 AI Strategy Co-Pilot**<br/>
Ask MIRA Oracle anything — get instant competitive intelligence, pricing strategy advice, and sales objection scripts powered by your live data.

</td>
<td>

**⚔️ War Room Simulator**<br/>
"What if we drop prices 30%?" — simulate competitive market reactions with risk scores, counter-offensives, and timeline predictions.

</td>
</tr>
<tr>
<td>

**📢 Multi-Channel Alerts**<br/>
Slack (instant, high-impact ≥ 8), Email (periodic digest), Notion/Airtable (every change logged).

</td>
<td>

**🩹 Self-Healing**<br/>
Failed CRM syncs auto-retry via a local SQLite queue. No data loss, ever.

</td>
</tr>
<tr>
<td>

**🧩 Chrome Extension**<br/>
One-click competitor registration from any browser tab. Live badge shows unread intel count.

</td>
<td>

**🃏 Auto-Battlecards**<br/>
LLM-generated competitive battlecards with strengths, weaknesses, killer questions, and sales landmines — ready for your next sales call.

</td>
</tr>
</table>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🆕 What's New — v2.0

<div align="center">

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                    🚀  MIRA v2.0 HIGHLIGHTS                      │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  🔮  AI STRATEGY CO-PILOT (MIRA Oracle)                          │
  │      • Conversational AI with full workspace context             │
  │      • Instant pitch drafts, pricing analysis, SWOT audits       │
  │      • Quick-prompt chips for common strategic queries            │
  │                                                                  │
  │  ⚔️  COMPETITIVE WAR ROOM SIMULATOR                              │
  │      • "What-If" scenario engine with game-theory modeling       │
  │      • Dynamic risk scoring (1-10) with threat levels            │
  │      • Per-competitor predicted reactions & timelines             │
  │      • Step-by-step counter-offensive playbook generation        │
  │      • Pre-built scenario templates for rapid simulation         │
  │                                                                  │
  │  🃏  AUTO-GENERATED BATTLECARDS                                  │
  │      • LLM-powered competitive comparison cards                  │
  │      • Strengths / Weaknesses / Killer Questions / Landmines     │
  │      • One-click refresh from latest intelligence data           │
  │      • CRM sync status tracking (Notion / Airtable)              │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🚀 Live Demo

> The app is deployed on Railway and publicly accessible:

**👉 [https://autonomous-competitor-intelligence-engine-production.up.railway.app/](https://autonomous-competitor-intelligence-engine-production.up.railway.app/)**

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🗺️ System Architecture

```mermaid
graph TD
    subgraph "📡 Input Sources"
        A["🧩 Chrome Extension"] -->|"One-Click API"| B("📋 Sequential Queue")
        C["⏰ Scheduled Runner"] -->|"Configurable Interval"| B
    end

    subgraph "⚙️ Core Pipeline"
        B --> D["🕸️ Double-Engine Scraper"]
        D -->|"Cleaned Text"| E["🧠 ONNX Sentence Embedder"]
        E -->|"Cosine Similarity"| F{"🔍 Semantic Change?"}
        F -->|"similarity >= 0.85"| G["✅ No Action"]
        F -->|"similarity < 0.85"| H["🧠 Gemini / Qwen LLM"]
    end

    subgraph "🃏 Battlecard Engine"
        H -->|"Change Analysis"| BC["🃏 Auto-Battlecard Generator"]
        BC -->|"Strengths / Weaknesses / Landmines"| BD["📋 Battlecard DB"]
    end

    subgraph "🔮 AI Strategy Layer"
        ORACLE["🔮 MIRA Oracle Co-Pilot"]
        WARROOM["⚔️ War Room Simulator"]
        BD --> ORACLE
        BD --> WARROOM
        ORACLE -->|"Conversational AI"| ORACLE_OUT["💬 Strategic Advice"]
        WARROOM -->|"Game Theory"| WAR_OUT["📊 Simulation Report"]
    end

    subgraph "📤 Integrations"
        H --> J["🔄 CRM Adapter"]
        J -->|"Idempotent Write"| K["📓 Notion"]
        J -->|"Idempotent Write"| L["📊 Airtable"]
        J -->|"On Failure"| M["💾 SQLite Retry Queue"]
        H -->|"Impact >= 8"| N["💬 Slack"]
        H -->|"Periodic Digest"| O["📧 Email"]
    end

    style K fill:#000000,stroke:#A78BFA,stroke-width:2px,color:#fff
    style N fill:#4A154B,stroke:#A78BFA,stroke-width:2px,color:#fff
    style O fill:#EA4335,stroke:#A78BFA,stroke-width:2px,color:#fff
    style B fill:#0d1117,stroke:#A78BFA,stroke-width:1px,color:#c9d1d9
    style D fill:#0d1117,stroke:#A78BFA,stroke-width:1px,color:#c9d1d9
    style E fill:#0d1117,stroke:#FFD21E,stroke-width:2px,color:#FFD21E
    style H fill:#0d1117,stroke:#A78BFA,stroke-width:1px,color:#c9d1d9
    style F fill:#161b22,stroke:#A78BFA,stroke-width:2px,color:#c9d1d9
    style ORACLE fill:#1a1040,stroke:#A78BFA,stroke-width:2px,color:#d8b4fe
    style WARROOM fill:#1a1040,stroke:#EC4899,stroke-width:2px,color:#f9a8d4
    style BC fill:#0d1117,stroke:#FFD21E,stroke-width:2px,color:#FFD21E
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🧬 ML Pipeline

<table>
<tr>
<td width="50%">

### 🧠 Stage 1 — Semantic Change Detection

**Runtime:** `@huggingface/transformers` (ONNX, JavaScript)
**Model:** `Xenova/all-MiniLM-L6-v2`

```javascript
const { pipeline } = require('@huggingface/transformers');

const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

const oldEmbed = await embedder("Price is $100",
  { pooling: 'mean', normalize: true });
const newEmbed = await embedder("Current Price: $100",
  { pooling: 'mean', normalize: true });

// Cosine similarity → 0.93
// Same meaning — NO alert triggered ✅
```

> ❌ No string comparison — MIRA understands *meaning*, not characters.

</td>
<td width="50%">

### 📊 Stage 2 — LLM Analysis & Scoring

**Cloud:** Gemini 2.5 Flash API
**Local:** Qwen2.5-0.5B GGUF via llama-cli (CPU)

Detected changes are analyzed in a **single inference pass**. The LLM returns structured output:

| Output | Description |
|:---|:---|
| 📂 **Category** | LLM-classified change type |
| 📝 **Summary** | Plain-English explanation |
| ❓ **Why It Matters** | Business impact analysis |
| 📊 **Impact Score** | 1–10 threat/opportunity rating |
| 📋 **Justification** | Evidence-based reasoning |
| 🎯 **Recommendation** | Action item with timeline |
| 🃏 **Battlecard** | Auto-generated competitive card |

</td>
</tr>
</table>

### 🔄 Fallback Chain

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│  Gemini 2.5 Flash   │────▶│  Qwen2.5-0.5B GGUF       │────▶│  Rule-Based Heuristics  │
│  (Cloud, <1.5s)     │     │  (Local, CPU, 7-15s)      │     │  (Keyword match, <1ms)  │
└─────────────────────┘     └──────────────────────────┘     └─────────────────────────┘
```

> When cloud inference is unavailable (rate limits, missing API key), MIRA falls back to local GGUF, then to keyword-based heuristics. **Analysis always completes.**

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🧩 Chrome Extension

<div align="center">

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3)
[![Service Worker](https://img.shields.io/badge/Background-Service_Worker-FF6D00?style=for-the-badge)](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers)
[![Live Badge](https://img.shields.io/badge/Live-Badge_Counter-38bdf8?style=for-the-badge)](https://developer.chrome.com/docs/extensions/reference/api/action#badge)

</div>

<br/>

The **MIRA Chrome Extension** turns your browser into a competitor registration tool. Browse any competitor's website, click the extension icon, and it's instantly queued for monitoring.

| Feature | Description |
|:---|:---|
| 🖱️ **One-Click Add** | Auto-detects the active tab's URL and infers competitor name from the domain |
| 🔴 **Live Badge** | Service worker polls every 60s — new intel lights up a badge counter on the icon |
| 🔑 **API Key Auth** | All requests secured with `Bearer` token, configured via Options page |
| 🎯 **Scope Selector** | Monitor full website, pricing page, or a specific section |

<details>
<summary><b>📐 Architecture</b></summary>
<br/>

```mermaid
graph LR
    subgraph "Chrome Extension — Manifest V3"
        POPUP["🖱️ popup.html + popup.js"]
        OPTIONS["⚙️ options.html + options.js"]
        BG["🔄 background.js"]
        STORAGE["💾 chrome.storage.sync"]
    end

    subgraph "MIRA Backend"
        API_ADD["/api/extension/add-competitor"]
        API_UNREAD["/api/extension/unread-count"]
    end

    POPUP -->|"POST + Bearer"| API_ADD
    BG -->|"GET every 60s"| API_UNREAD
    API_UNREAD -->|"{ unreadCount: N }"| BG
    BG -->|"setBadgeText(N)"| BADGE["🔴 Badge"]
    POPUP --> STORAGE
    OPTIONS --> STORAGE
    BG --> STORAGE

    style POPUP fill:#0d1117,stroke:#4285F4,stroke-width:2px,color:#c9d1d9
    style BG fill:#0d1117,stroke:#FF6D00,stroke-width:2px,color:#c9d1d9
    style OPTIONS fill:#0d1117,stroke:#4285F4,stroke-width:1px,color:#c9d1d9
    style BADGE fill:#38bdf8,stroke:#fff,stroke-width:1px,color:#000
    style API_ADD fill:#161b22,stroke:#A78BFA,stroke-width:1px,color:#c9d1d9
    style API_UNREAD fill:#161b22,stroke:#A78BFA,stroke-width:1px,color:#c9d1d9
```

</details>

<details>
<summary><b>🔧 Installation</b></summary>
<br/>

1. Navigate to `chrome://extensions/` and enable **Developer mode**
2. Click **Load unpacked** → select the `extension/` directory
3. Click the MIRA extension icon → **Configure Server Settings**
4. Enter your server URL (e.g., `http://localhost:3000`) and Extension API Key (from dashboard Settings)
5. Click **Verify and Save** ✅

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ⚡ Core Features

<details open>
<summary><b>🕸️ Intelligent Double-Engine Scraper</b></summary>
<br/>

| Engine | Library | Use Case |
|:---|:---|:---|
| ⚡ Fast Fetch | `axios` + `cheerio` | Static HTML — fast and lightweight |
| 🌐 JS Render | `puppeteer` (headless Chromium) | SPAs & dynamic JS content |

**Smart Cleaning Pipeline:**
- 🧹 Strips cookie banners, nav bars, footers, sidebars
- 🔄 Rotates User-Agent strings to avoid bot detection
- 🖼️ Blocks images/CSS in Puppeteer to minimize RAM
- 📸 Captures screenshots for audit trails

</details>

<details>
<summary><b>🔍 Tech Stack & DNS Enrichment</b></summary>
<br/>

- 🌐 **DNS Resolution** — A-records & MX-records for server/email hosting detection
- 🔧 **Header Inspection** — Reads `server`, `x-powered-by` headers
- 📊 **Dashboard Widget** — Enriched tech profiles displayed in competitor sidebar

</details>

<details>
<summary><b>💼 Idempotent CRM Sync</b></summary>
<br/>

- 🔒 **Deduplication** — Queries Notion/Airtable before writes
- 🔄 **SQLite Retry Queue** — Failed syncs queued locally, auto-retried
- 📊 **Dynamic Schema Matching** — Case-insensitive, whitespace-tolerant
- ✅ **Status Tracking** — `synced` / `failed` / `pending` per card

</details>

<details>
<summary><b>📢 Multi-Channel Alerts</b></summary>
<br/>

| Channel | Trigger | Content |
|:---|:---|:---|
| 💬 **Slack** | Impact ≥ 8 | Immediate webhook with full intel card |
| 📧 **Email** | Periodic digest | HTML summary of recent changes |
| 📓 **Notion** | Every change | Structured database row |
| 📊 **Airtable** | Every change | Structured record |

</details>

<details>
<summary><b>🖥️ Rich Dashboard UI</b></summary>
<br/>

Built with **React 18 + Tailwind CSS + Vite**, the dashboard features:

- 🔍 **Command Palette** — `Cmd/Ctrl + K` global search & quick navigation
- 📊 **Intel Feed** — Card-based timeline of all detected changes, filterable by impact
- 🗂️ **Visual Diff Modal** — Side-by-side content diff viewer for every scrape
- 🔔 **Live Badge** — Unread intel count synced with the Chrome Extension badge
- ⚙️ **Settings Panel** — Per-workspace CRM keys, SMTP, Slack webhook, and API key management
- 💀 **Skeleton Loaders** — Smooth loading states throughout the UI

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🔮 AI Strategy Co-Pilot — MIRA Oracle

<div align="center">

[![Gemini Powered](https://img.shields.io/badge/Powered_by-Gemini_2.5_Flash-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Context-Aware](https://img.shields.io/badge/Context-Live_Workspace_Data-00C853?style=for-the-badge)](.)
[![Conversational](https://img.shields.io/badge/Interface-Conversational_AI-FF6D00?style=for-the-badge)](.)

</div>

<br/>

> **MIRA Oracle** is an embedded AI strategy co-pilot that has real-time access to your entire competitive intelligence workspace — business profile, competitor radar, intel signals, and battlecards. Ask it anything and get actionable strategic advice instantly.

<br/>

<table>
<tr>
<td width="50%">

### 💡 What Can You Ask?

- *"How should I position against [Competitor X] in enterprise deals?"*
- *"Draft a 60-second elevator pitch highlighting our advantages"*
- *"What are the top 3 pricing risks if we go freemium?"*
- *"Summarize all high-impact competitor moves this week"*
- *"Write objection-handling scripts for [Competitor]'s latest feature"*

</td>
<td width="50%">

### ⚡ Quick-Prompt Chips

Pre-built strategy prompts for instant access:

| Chip | Action |
|:---|:---|
| 🎯 **Competitor SWOT** | Full SWOT analysis of a tracked competitor |
| 💰 **Pricing Strategy** | Price positioning based on market signals |
| 📝 **Pitch Draft** | 60-second elevator pitch generator |
| 🛡️ **Objection Handling** | Counter-arguments for sales calls |
| 📊 **Weekly Briefing** | Executive summary of all market movements |

</td>
</tr>
</table>

### 🏗️ How It Works

```mermaid
graph LR
    USER["👤 User Query"] --> CTX["📦 Context Assembler"]
    CTX --> |"Profile + Competitors + Intel + Battlecards"| LLM["🧠 Gemini 2.5 Flash"]
    LLM --> RESP["💬 Strategic Response"]
    RESP --> CONV["🔄 Conversation Memory"]
    CONV --> |"Multi-turn context"| CTX

    style USER fill:#0d1117,stroke:#A78BFA,stroke-width:2px,color:#c9d1d9
    style CTX fill:#0d1117,stroke:#FFD21E,stroke-width:2px,color:#FFD21E
    style LLM fill:#1a1040,stroke:#A78BFA,stroke-width:2px,color:#d8b4fe
    style RESP fill:#0d1117,stroke:#00C853,stroke-width:2px,color:#00C853
    style CONV fill:#161b22,stroke:#A78BFA,stroke-width:1px,color:#c9d1d9
```

> **Fallback:** When Gemini is unavailable, Oracle generates intelligent contextual reports using your live workspace data — competitor counts, high-impact signals, and rule-based strategic recommendations.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ⚔️ Competitive War Room Simulator

<div align="center">

[![Game Theory](https://img.shields.io/badge/Engine-Game_Theory_Simulation-EC4899?style=for-the-badge)](.)
[![Risk Scoring](https://img.shields.io/badge/Output-Dynamic_Risk_Scoring-F59E0B?style=for-the-badge)](.)
[![Playbook](https://img.shields.io/badge/Result-Counter--Offensive_Playbook-10B981?style=for-the-badge)](.)

</div>

<br/>

> **"What happens if we drop prices by 30%?"** — The War Room runs a full market simulation powered by Gemini, modeling how each competitor is likely to react, with timelines, risk scores, and a step-by-step counter-offensive playbook.

<br/>

### 📊 Simulation Output Structure

```
┌────────────────────────────────────────────────────────────────┐
│                    ⚔️  WAR ROOM SIMULATION                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📋 SCENARIO:  "Drop pricing 30% across all tiers"             │
│                                                                │
│  🎯 RISK SCORE:     ████████░░  8/10 — HIGH RISK               │
│                                                                │
│  📈 MARKET IMPACT:                                             │
│     "Aggressive pricing will trigger a race-to-bottom in       │
│      the mid-market segment within 2-3 weeks..."               │
│                                                                │
│  👥 COMPETITOR RESPONSES:                                      │
│  ┌────────────┬──────────────────────┬───────┬─────────┐       │
│  │ Competitor  │ Predicted Action      │ Prob  │ When     │      │
│  ├────────────┼──────────────────────┼───────┼─────────┤       │
│  │ Rival A     │ Match pricing +       │ 85%   │ 1-2 wks  │      │
│  │             │  launch ad blitz      │       │          │      │
│  │ Rival B     │ Highlight premium     │ 60%   │ 2-4 wks  │      │
│  │             │  positioning          │       │          │      │
│  └────────────┴──────────────────────┴───────┴─────────┘       │
│                                                                │
│  🛡️ COUNTER-OFFENSIVE PLAYBOOK:                                │
│     Step 1 → Days 1-7:  Distribute battlecards to sales        │
│     Step 2 → Weeks 2-4: Publish customer success stories       │
│     Step 3 → Month 2:   Release differentiation features       │
│                                                                │
│  ⚖️ VERDICT: PROCEED WITH CAUTION                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 🎮 Pre-Built Scenario Templates

| Template | Description |
|:---|:---|
| 💰 **Price Drop** | "Drop prices by 30% across all tiers" |
| 🚀 **AI Feature Launch** | "Launch an AI-powered feature competitor doesn't have" |
| 🆓 **Freemium Pivot** | "Introduce a free tier to capture market share" |
| 🏢 **Enterprise Push** | "Pivot to enterprise-only with premium support" |

> 💡 Or type any custom hypothesis — e.g., *"Acquire competitor X's top engineer and launch a PR campaign"*

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🃏 Auto-Generated Battlecards

> Every tracked competitor gets an **auto-generated battlecard** powered by LLM analysis. Battlecards are living documents that evolve as new intelligence signals are captured.

<br/>

<table>
<tr>
<td width="50%">

### 📋 Card Contents

Each battlecard includes:
- ✅ **Strengths** — What they do well
- ❌ **Weaknesses** — Where they fall short
- 🎯 **Killer Questions** — Ask prospects to expose competitor gaps
- 💣 **Sales Landmines** — Trigger questions that shift the deal in your favor

</td>
<td width="50%">

### 🔄 Lifecycle

| Stage | Mechanism |
|:---|:---|
| **Generation** | Auto-created on first competitor scrape |
| **Refresh** | One-click regenerate from latest intel data |
| **Sync** | Status tracked: `synced` / `pending` / `failed` |
| **CRM Push** | Auto-syncs to Notion / Airtable alongside intel cards |

</td>
</tr>
</table>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🤖 Model Configurations

<div align="center">

| Component | Model | Runtime | Disk | RAM | Latency |
|:---|:---|:---|:---:|:---:|:---:|
| 🔍 **Embeddings** | `Xenova/all-MiniLM-L6-v2` | ONNX (JavaScript) | ~90 MB | ~80 MB | < 0.5s |
| 🧠 **LLM (Cloud)** | `gemini-2.5-flash` | Google API | — | — | < 1.5s |
| 🧠 **LLM (Local)** | `Qwen2.5-0.5B-Instruct` | llama-cli (GGUF Q4_K_M) | ~382 MB | ~350 MB | 7–15s |
| 🔧 **Fallback** | Rule-based heuristic | Node.js keyword matching | — | — | < 1ms |
| 🔮 **Oracle** | `gemini-2.5-flash` | Google API (contextual) | — | — | < 2s |
| ⚔️ **War Room** | `gemini-2.5-flash` | Google API (game-theory) | — | — | < 3s |

</div>

> 💡 Configure your Gemini API key and other integration credentials via the **dashboard Settings tab** — no `.env` changes needed.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🚀 Quick Start

### Prerequisites

```
✅ Node.js    v20+
✅ NPM        v10+
✅ OS         macOS / Linux / Windows (WSL)
```

### 1️⃣ Clone & Install

```bash
git clone https://github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine.git
cd Autonomous-Competitor-Intelligence-Engine

npm install
npm run install:all
```

> 💡 **No Python required.** All ML inference runs natively in Node.js.

### 2️⃣ Configure

```bash
cp .env.example .env
# Only PORT and NODE_ENV are needed — all API keys (Gemini, Slack,
# Notion, Airtable, SMTP) are configured via the dashboard Settings tab.
```

### 3️⃣ Launch

```bash
npm run dev
```

| Service | URL |
|:---|:---|
| 🖥️ Backend API | `http://localhost:3000` |
| 🎨 Dashboard | `http://localhost:5173` |

### 4️⃣ Test

```bash
npm test
```

> Validates: Scraping → Semantic Detection → LLM Inference → Battlecards → CRM Sync

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🔐 Environment Variables

Create a `.env` in the project root (copy from `.env.example`). Only `PORT` is strictly required — all integration credentials are managed via the **dashboard Settings tab** and persisted in SQLite.

| Variable | Required | Default | Description |
|:---|:---:|:---:|:---|
| `PORT` | ✅ | `3000` | Express server port |
| `NODE_ENV` | — | `development` | `production` for optimized builds |
| `PUPPETEER_EXECUTABLE_PATH` | — | bundled | Override Chrome binary (e.g. `/usr/bin/google-chrome-stable`) |

> **Note:** `GEMINI_API_KEY`, `SLACK_WEBHOOK_URL`, Notion, Airtable, and SMTP credentials are all configured through the **dashboard Settings tab** — no `.env` entry needed.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📡 API Reference

Dashboard endpoints use `X-Workspace-Id` header (defaults to `default`).
Extension endpoints require `Authorization: Bearer <api_key>`.

<details>
<summary><b>📋 Dashboard Endpoints</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | Health check |
| `GET` | `/api/profile` | Get business profile |
| `POST` | `/api/profile` | Save business profile |
| `GET` | `/api/competitors` | List competitors |
| `POST` | `/api/competitors` | Add competitor |
| `GET` | `/api/competitors/:id` | Competitor details |
| `PUT` | `/api/competitors/:id` | Update competitor |
| `DELETE` | `/api/competitors/:id` | Remove competitor |
| `POST` | `/api/competitors/:id/check` | Trigger immediate scrape |
| `GET` | `/api/intelligence` | Get intel cards |
| `PUT` | `/api/intelligence/:id` | Update card (read/unread) |
| `POST` | `/api/intelligence/read-all` | Mark all read |
| `POST` | `/api/intelligence/:id/retry` | Retry failed CRM sync |
| `GET` | `/api/settings` | Get settings |
| `POST` | `/api/settings` | Save settings |
| `POST` | `/api/settings/test-email` | Test SMTP |
| `GET` | `/api/debug-status` | Pipeline debug info |

</details>

<details>
<summary><b>🃏 Battlecard Endpoints</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/battlecards` | List all battlecards |
| `GET` | `/api/battlecards/:competitorId` | Get battlecard for competitor |
| `POST` | `/api/battlecards/:competitorId/generate` | Generate / refresh battlecard |
| `DELETE` | `/api/battlecards/:competitorId` | Delete battlecard |

</details>

<details>
<summary><b>🔮 AI Strategy Co-Pilot & War Room Endpoints</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/oracle/chat` | Send message to MIRA Oracle (AI Co-Pilot) |
| `POST` | `/api/warroom/simulate` | Run War Room "What-If" simulation |

**Oracle Request Body:**
```json
{
  "message": "How should we counter Competitor X's new AI feature?",
  "history": [
    { "role": "user", "text": "Previous question..." },
    { "role": "assistant", "text": "Previous answer..." }
  ]
}
```

**War Room Request Body:**
```json
{
  "move": "Drop pricing by 30% across all tiers"
}
```

**War Room Response Structure:**
```json
{
  "scenario": "Drop pricing by 30% across all tiers",
  "risk_score": 8,
  "risk_level": "HIGH",
  "market_impact_summary": "Aggressive pricing will trigger...",
  "competitor_responses": [
    {
      "competitor_name": "Rival A",
      "predicted_action": "Match pricing + launch ad blitz",
      "likelihood_pct": 85,
      "timeframe": "1-2 Weeks",
      "threat_severity": "High"
    }
  ],
  "counter_offensive_playbook": [
    {
      "step": 1,
      "phase": "Immediate (Days 1-7)",
      "action": "Distribute battlecards to SDRs",
      "details": "Equip sales team before competitors adjust messaging"
    }
  ],
  "strategic_verdict": "PROCEED WITH CAUTION"
}
```

</details>

<details>
<summary><b>🧩 Extension Endpoints</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/extension/status` | Connection check |
| `GET` | `/api/extension/unread-count` | Unread card count (badge) |
| `POST` | `/api/extension/add-competitor` | Register competitor from browser |

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🔌 Integration Guides

<details>
<summary><b>📓 Notion CRM</b></summary>
<br/>

1. Create an integration at [**Notion My Integrations**](https://www.notion.so/my-integrations)
2. Create a database with these properties:

| Property | Type |
|:---|:---|
| Title | `Title` |
| Competitor Name | `Select` |
| URL | `URL` |
| Category | `Select` |
| Impact Score | `Number` |
| Recommended Action | `Text` |
| Summary | `Text` |
| Justification | `Text` |
| Screenshot URL | `URL` |

3. Connect integration to database → `...` → **Connect to**
4. Copy **Database ID** from page URL
5. Enter credentials in dashboard **Settings**

</details>

<details>
<summary><b>📊 Airtable CRM</b></summary>
<br/>

1. Generate a PAT with `data.records:write` at [**Airtable Tokens**](https://airtable.com/create/tokens)
2. Create a Base → Table named **Competitor Intel**
3. Enter Base ID, Table name, and Token in dashboard Settings

</details>

<details>
<summary><b>💬 Slack</b></summary>
<br/>

1. Create an [**Incoming Webhook**](https://api.slack.com/messaging/webhooks) in your workspace
2. Paste the webhook URL in dashboard Settings
3. Impact Score **≥ 8** → instant Slack alert ⚡

</details>

<details>
<summary><b>📧 Email (SMTP)</b></summary>
<br/>

1. For Gmail: generate an **App Password** at [security.google.com](https://security.google.com)
2. Configure in Settings: `smtp.gmail.com` / Port `587`
3. Click **Test SMTP Connection** to verify
4. Periodic digests arrive automatically 📬

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🛠️ Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=nodejs,react,vite,tailwind,sqlite,docker,html,css,js&theme=dark" alt="Tech Stack" />

</div>

<br/>

| Layer | Technologies |
|:---|:---|
| 🖥️ **Backend** | Node.js 20, Express 4, SQLite (`sqlite3`), UUID |
| 🎨 **Frontend** | React 18, Vite 5, Tailwind CSS 3, Lucide React |
| 🕸️ **Scraping** | Axios, Cheerio, Puppeteer (headless Chromium) |
| 🧠 **AI / ML** | HuggingFace Transformers (ONNX), Gemini 2.5 Flash, Qwen GGUF |
| 🔮 **Strategy AI** | MIRA Oracle (Co-Pilot), War Room Simulator (Game Theory) |
| 🃏 **Battlecards** | LLM-powered auto-generation with CRM sync |
| 🔌 **Integrations** | Notion SDK, Airtable REST, Slack Webhooks, Nodemailer |
| 🧩 **Extension** | Chrome Manifest V3, Service Workers |
| 🔧 **Tooling** | Concurrently, Nodemon, Docker |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📁 Project Structure

```
📦 MIRA — Autonomous Competitor Intelligence Engine
│
├── 📂 client/                     # React + Vite + Tailwind CSS dashboard
│   ├── src/
│   │   ├── App.jsx                # Root dashboard application (all views)
│   │   ├── index.css              # Global + Tailwind styles
│   │   ├── main.jsx               # React entry point
│   │   └── components/
│   │       ├── BattlecardsView.jsx   # 🃏 Auto-generated battlecards UI
│   │       ├── CommandPalette.jsx    # 🔍 Cmd+K global search & quick actions
│   │       ├── Sidebar.jsx           # 📱 Navigation sidebar
│   │       ├── SkeletonLoader.jsx    # 💀 Loading state placeholders
│   │       ├── StrategyCopilotModal.jsx # 🔮 MIRA Oracle AI chat modal
│   │       ├── TopBar.jsx            # 🔝 Top navigation bar
│   │       ├── VisualDiffModal.jsx   # 🗂️ Side-by-side content diff viewer
│   │       └── WarRoomView.jsx       # ⚔️ War Room scenario simulator
│   ├── index.html
│   ├── tailwind.config.js         # Tailwind theme configuration
│   └── vite.config.js             # Vite config with API proxy to :3000
│
├── 📂 server/                     # Node.js + Express backend
│   └── src/
│       ├── index.js               # Express server, routes, scheduler
│       ├── scraper.js             # Double-engine scraper (Axios + Puppeteer)
│       ├── detector.js            # Semantic change detection (ONNX)
│       ├── llm.js                 # LLM inference + Oracle + War Room + Battlecards
│       ├── crm.js                 # Notion & Airtable CRM adapter
│       ├── queue.js               # Sequential processing queue
│       ├── slack.js               # Slack webhook alerts
│       ├── mailer.js              # SMTP email digest
│       ├── enrichment.js          # DNS & header enrichment
│       ├── db.js                  # SQLite database layer
│       └── verify-test.js         # Integration tests
│
├── 📂 extension/                  # Chrome Extension (MV3)
│   ├── manifest.json
│   ├── popup.html / popup.js      # One-click competitor registration
│   ├── options.html / options.js  # Server URL & API key config
│   ├── background.js              # Badge polling service worker
│   └── icon*.png                  # Icons (16, 48, 128)
│
├── 📂 docs/                       # Documentation & screenshots
│   ├── images/
│   ├── railway_deployment_guide.md
│   └── walkthrough.md
├── data_exporter.py               # CSV/Markdown export utility
├── Dockerfile                     # Production container (Node 20 + Chrome)
├── package.json                   # Workspace orchestrator
└── .env.example                   # Environment template
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🐳 Deployment

### Railway (Recommended)

The `Dockerfile` installs Google Chrome Stable, downloads ONNX models, builds the Vite client, and starts Express — all automatically.

1. Create a project on [**Railway**](https://railway.app)
2. Link your GitHub repo
3. Set env vars: `PORT=3000`, `NODE_ENV=production`
4. Deploy 🚀

> All integration credentials (Gemini, Slack, Notion, etc.) are configured via the dashboard Settings after deploy — no extra env vars needed.

### Docker (Manual)

```bash
docker build -t mira .
docker run -p 3000:3000 --env-file .env mira
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ⚠️ Known Limitations

| Issue | Details |
|:---|:---|
| ⏳ **Cold Start** | First run downloads models (~90 MB ONNX + ~382 MB GGUF). Cached after. |
| 🤖 **Anti-Bot** | Some sites block headless scrapers → graceful Axios fallback. |
| 📋 **Sequential Queue** | One-at-a-time processing to stay under 512 MB RAM. |
| 🔄 **Rate Limits** | Gemini may throttle → auto-fallback to GGUF → heuristics. |
| 🔮 **Oracle Fallback** | Without Gemini key, Oracle provides data-driven reports (not conversational AI). |
| ⚔️ **War Room Fallback** | Without Gemini key, simulations use deterministic rule-based modeling. |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🤝 Contributing

1. **Fork** the repository
2. **Branch** → `git checkout -b feature/your-feature`
3. **Commit** → `git commit -m 'Add your feature'`
4. **Push** → `git push origin feature/your-feature`
5. **PR** → Open a Pull Request

Please ensure `npm test` passes before submitting.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📜 License

Licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

<br/>

<!-- Animated Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,50:7C3AED,100:EC4899&height=120&section=footer&animation=twinkling" width="100%" />

<div align="center">

**Built with ❤️ and 🧠 by [Nithesh K](https://github.com/NitheshK4)**

<br/>

[![MIT](https://img.shields.io/badge/License-MIT-A78BFA?style=for-the-badge&labelColor=0d1117)](LICENSE)
[![Stars](https://img.shields.io/github/stars/NitheshK4/Autonomous-Competitor-Intelligence-Engine?style=for-the-badge&logo=github&color=FFD21E&labelColor=0d1117)](https://github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/stargazers)
[![Issues](https://img.shields.io/github/issues/NitheshK4/Autonomous-Competitor-Intelligence-Engine?style=for-the-badge&logo=github&color=F87171&labelColor=0d1117)](https://github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/issues)

<br/>

<sub>🔮 MIRA Oracle • ⚔️ War Room Simulator • 🃏 Auto-Battlecards • 🧠 Semantic Intelligence • 🕸️ Smart Scraping</sub>

</div>
