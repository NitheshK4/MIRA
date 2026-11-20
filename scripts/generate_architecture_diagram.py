import os
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

def draw_system_architecture(output_path):
    # Set high resolution figure
    fig = plt.figure(figsize=(22, 12), dpi=300)
    ax = fig.add_subplot(111)
    
    # Monochrome palette
    bg_color = "#FFFFFF"
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Font setup
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Helvetica', 'Arial']

    # Column X coordinates
    col_w = 16.5
    spacing = 3.2
    
    c1_x = 2.0
    c2_x = c1_x + col_w + spacing  # 21.7
    c3_x = c2_x + col_w + spacing  # 41.4
    c4_x = c3_x + col_w + spacing  # 61.1
    c5_x = c4_x + col_w + spacing  # 80.8

    # Helper function: Draw Section Container
    def draw_stage_container(x, y, w, h, title, stage_num):
        # Outer dashed container
        rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5,rounding_size=0.8",
                              facecolor="#F8F9FA", edgecolor="#4A5568", linewidth=1.4, linestyle="--", zorder=1)
        ax.add_patch(rect)
        
        # Header Badge
        badge_w = w * 0.94
        badge_h = 3.4
        badge_x = x + (w - badge_w) / 2
        badge_y = y + h - badge_h - 0.8
        
        b_patch = FancyBboxPatch((badge_x, badge_y), badge_w, badge_h,
                                boxstyle="round,pad=0.2,rounding_size=0.4",
                                facecolor="#2D3748", edgecolor="#1A202C", linewidth=1.2, zorder=2)
        ax.add_patch(b_patch)
        
        ax.text(badge_x + badge_w/2, badge_y + badge_h/2, f"STAGE {stage_num}: {title.upper()}",
                ha='center', va='center', fontsize=9.5, fontweight='bold', color="#FFFFFF", zorder=3)

    # Helper function: Draw Component Card
    def draw_card(x, y, w, h, title, subtitle="", items=None, border_style="-", fill_color="#FFFFFF"):
        card = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.3,rounding_size=0.5",
                              facecolor=fill_color, edgecolor="#2D3748", linewidth=1.2, linestyle=border_style, zorder=3)
        ax.add_patch(card)

        # Title
        title_y = y + h - 1.8
        ax.text(x + w/2, title_y, title, ha='center', va='center', fontsize=9.0, fontweight='bold', color="#0F172A", zorder=4)

        # Subtitle
        if subtitle:
            ax.text(x + w/2, title_y - 1.4, subtitle, ha='center', va='center', fontsize=7.5, fontstyle='italic', color="#4A5568", zorder=4)

        # Bullet items
        if items:
            item_start_y = title_y - (2.4 if subtitle else 1.6)
            for i, it in enumerate(items):
                ax.text(x + 0.8, item_start_y - (i * 1.3), f"• {it}", ha='left', va='center', fontsize=7.2, color="#1A202C", zorder=4)

    # Helper function: Draw Connector Arrow
    def draw_arrow(x1, y1, x2, y2, label="", label_pos=(0.5, 0.5), style="->", rad=0.0):
        arrow = FancyArrowPatch((x1, y1), (x2, y2),
                                connectionstyle=f"arc3,rad={rad}",
                                arrowstyle=style,
                                mutation_scale=12,
                                linewidth=1.3,
                                color="#2D3748",
                                zorder=5)
        ax.add_patch(arrow)
        if label:
            lx = x1 + (x2 - x1) * label_pos[0]
            ly = y1 + (y2 - y1) * label_pos[1]
            ax.text(lx, ly, label, ha='center', va='center', fontsize=7.0, fontweight='bold', color="#1A202C",
                    bbox=dict(boxstyle='square,pad=0.2', facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=0.8), zorder=6)

    # Main Diagram Title
    ax.text(50, 97.5, "FIGURE 4.1: END-TO-END SYSTEM ARCHITECTURE OF MIRA",
            ha='center', va='center', fontsize=14, fontweight='bold', color="#0F172A")
    ax.text(50, 95.2, "Autonomous Competitive Intelligence, Semantic Change Detection & Game-Theoretic Simulation Pipeline (Input to Output)",
            ha='center', va='center', fontsize=9.5, fontstyle='italic', color="#4A5568")

    # -------------------------------------------------------------------------
    # STAGE 1: INPUT SOURCES
    # -------------------------------------------------------------------------
    draw_stage_container(c1_x, 4.0, col_w, 88.5, "Input Sources", 1)
    
    c1_card_w = col_w - 2.0
    c1_card_x = c1_x + 1.0

    draw_card(c1_card_x, 70.0, c1_card_w, 14.5, "1. Scheduled Job Runner",
              subtitle="Automated Periodic Execution",
              items=["Configurable CRON interval", "Domain rate limit throttler", "Multi-tenant workspace isolator"])

    draw_card(c1_card_x, 49.0, c1_card_w, 17.0, "2. ACIE Chrome Extension",
              subtitle="Live User-Initiated Capture",
              items=["Manifest V3 background worker", "Active tab DOM extractor", "One-click ingest REST client", "Configurable backend host URL"])

    draw_card(c1_card_x, 28.0, c1_card_w, 17.0, "3. Multi-Language SDKs",
              subtitle="Programmatic External Inputs",
              items=["Node.js / TypeScript SDK", "Python 3 Client (mira_sdk)", "Go Client & PHP 8.x SDK", "REST API (`/api/competitors`)"])

    draw_card(c1_card_x, 7.5, c1_card_w, 16.5, "4. Competitor Seed Registry",
              subtitle="Target Web Metadata Store",
              items=["Target seed URLs & domains", "Monitoring scope (pricing/all)", "Baseline snapshot timestamp", "Historical diff catalog"])

    # -------------------------------------------------------------------------
    # STAGE 2: INGESTION & DATA EXTRACTION
    # -------------------------------------------------------------------------
    draw_stage_container(c2_x, 4.0, col_w, 88.5, "Ingestion & Extraction", 2)
    
    c2_card_w = col_w - 2.0
    c2_card_x = c2_x + 1.0

    draw_card(c2_card_x, 70.0, c2_card_w, 14.5, "Sequential Task Queue",
              subtitle="Serialized Pipeline Buffer",
              items=["In-memory sequential runner", "Per-domain politeness delay", "Anti-concurrency race guard"])

    draw_card(c2_card_x, 39.0, c2_card_w, 27.0, "Dual-Engine Web Scraper",
              subtitle="Static & Dynamic Ingestion",
              items=["Tier 1: Fast HTTP Engine",
                     "  • Axios + Cheerio parser",
                     "  • Ultra-lightweight SSR fetch",
                     "Tier 2: Headless SPA Engine",
                     "  • Puppeteer Chromium sandbox",
                     "  • Full client JS rendering",
                     "  • Network idle waiting (2s)",
                     "  • Anti-bot user-agent rotation"])

    draw_card(c2_card_x, 10.0, c2_card_w, 25.0, "DOM Cleaner & Extractor",
              subtitle="Noise Reduction Layer",
              items=["Strips `<script>`, `<style>` tags",
                     "Removes `<iframe>`, `<svg>`, `<nav>`",
                     "Eliminates ads, banners, cookies",
                     "Readability text extraction",
                     "Whitespace normalization",
                     "Produces clean Markdown text"])

    # -------------------------------------------------------------------------
    # STAGE 3: SEMANTIC CHANGE DETECTION
    # -------------------------------------------------------------------------
    draw_stage_container(c3_x, 4.0, col_w, 88.5, "Semantic Detection", 3)
    
    c3_card_w = col_w - 2.0
    c3_card_x = c3_x + 1.0

    draw_card(c3_card_x, 70.0, c3_card_w, 14.5, "Syntactic Diff Engine",
              subtitle="Lexical Change Filter",
              items=["Unified diff computation", "Levenshtein edit distance", "Quick-exit if diff is empty"])

    draw_card(c3_card_x, 45.0, c3_card_w, 21.0, "ONNX Sentence Embedder",
              subtitle="Lightweight Edge Inference",
              items=["Model: `all-MiniLM-L6-v2`",
                     "Architecture: 6-layer MiniLM",
                     "Embedding dim: 384 dimensions",
                     "ONNX Runtime on CPU (≤512MB RAM)",
                     "Tokenized text representation",
                     "Sub-50ms inference latency"])

    draw_card(c3_card_x, 10.0, c3_card_w, 31.0, "Cosine Distance Evaluator",
              subtitle="Similarity Threshold Decision",
              items=["Formula: CosSim = (A·B)/(||A|| ||B||)",
                     "Distance = 1 - CosSim",
                     "Configurable threshold: θ = 0.85",
                     "--------------------------------",
                     "Decision Logic:",
                     "• If CosSim ≥ 0.85:",
                     "  → Cosmetic/Timestamp noise",
                     "  → Discard & suppress alert",
                     "• If CosSim < 0.85:",
                     "  → True semantic change",
                     "  → Forward to AI Reasoning"])

    # -------------------------------------------------------------------------
    # STAGE 4: AI REASONING & SIMULATION
    # -------------------------------------------------------------------------
    draw_stage_container(c4_x, 4.0, col_w, 88.5, "AI & Reasoning", 4)
    
    c4_card_w = col_w - 2.0
    c4_card_x = c4_x + 1.0

    draw_card(c4_card_x, 67.0, c4_card_w, 17.5, "Tri-Tier LLM Orchestrator",
              subtitle="Fault-Tolerant Intelligence",
              items=["Tier 1: Gemini 3.6 Flash (Primary)",
                     "Tier 2: Claude 3.5 / OpenAI (Fallback)",
                     "Tier 3: Local Qwen GGUF (CPU Edge)",
                     "Automatic circuit-breaker retry"])

    draw_card(c4_card_x, 45.0, c4_card_w, 18.0, "Threat Impact Scoring",
              subtitle="Strategic Impact Engine",
              items=["Quantitative Score: 1 to 10 scale",
                     "Categories: Pricing, Features, SLA",
                     "Executive summary generation",
                     "Contextual business justification",
                     "Recommended strategic actions"])

    draw_card(c4_card_x, 27.5, c4_card_w, 14.5, "Auto-Battlecard Generator",
              subtitle="Sales Enablement Synthesis",
              items=["Identifies competitor weaknesses",
                     "Synthesizes pitch landmines",
                     "Generates counter-arguments"])

    draw_card(c4_card_x, 8.0, c4_card_w, 16.5, "War Room & Oracle Co-Pilot",
              subtitle="Game-Theoretic Simulation",
              items=["Multi-turn agent war games",
                     "Pricing response simulation",
                     "Nash equilibrium assessment",
                     "Interactive strategic chat assistant"])

    # -------------------------------------------------------------------------
    # STAGE 5: PERSISTENCE & OUTPUT DELIVERY
    # -------------------------------------------------------------------------
    draw_stage_container(c5_x, 4.0, col_w, 88.5, "Outputs & Delivery", 5)
    
    c5_card_w = col_w - 2.0
    c5_card_x = c5_x + 1.0

    draw_card(c5_card_x, 72.0, c5_card_w, 12.5, "SQLite Persistence",
              subtitle="Core Embedded Storage",
              items=["WAL mode transactional DB",
                     "Snapshots, diffs & battlecards",
                     "Offline CRM replay queue"])

    draw_card(c5_card_x, 53.0, c5_card_w, 16.0, "Real-Time Alert Dispatcher",
              subtitle="Multi-Channel Notifications",
              items=["Slack Webhook (Score ≥ 8 urgent)",
                     "Outbound Webhook (Zapier/Make)",
                     "Automated SMTP Email Digest",
                     "Executive markdown briefing"])

    draw_card(c5_card_x, 32.0, c5_card_w, 18.0, "Two-Way CRM Adapter",
              subtitle="Enterprise Synchronization",
              items=["Notion Database integration",
                     "Airtable Base integration",
                     "Idempotent external ID matching",
                     "Offline exponential backoff queue",
                     "Auto-recovery on network return"])

    draw_card(c5_card_x, 9.0, c5_card_w, 20.0, "Client Applications & UI",
              subtitle="Presentation & User Actions",
              items=["React 18 SPA Dashboard",
                     "Side-by-side Visual Diff Modal",
                     "Interactive Oracle Chat Pane",
                     "War Room Simulator Console",
                     "CSV / Markdown Export Engine",
                     "REST API endpoints"])

    # -------------------------------------------------------------------------
    # INTER-STAGE ARROWS & PIPELINE FLOW
    # -------------------------------------------------------------------------
    # Inputs -> Ingestion Queue
    draw_arrow(c1_x + col_w - 1.0, 77.0, c2_x + 1.0, 77.0, label="Cron Job")
    draw_arrow(c1_x + col_w - 1.0, 57.0, c2_x + 1.0, 73.0, label="DOM Payload", rad=-0.1)
    draw_arrow(c1_x + col_w - 1.0, 36.0, c2_x + 1.0, 71.0, label="API Request", rad=-0.2)

    # Ingestion Queue -> Scraper
    draw_arrow(c2_card_x + c2_card_w/2, 70.0, c2_card_x + c2_card_w/2, 66.0, label="Job Dispatch")

    # Scraper -> DOM Cleaner
    draw_arrow(c2_card_x + c2_card_w/2, 39.0, c2_card_x + c2_card_w/2, 35.0, label="Raw HTML")

    # DOM Cleaner -> Syntactic Diff
    draw_arrow(c2_x + col_w - 1.0, 22.0, c3_x + 1.0, 77.0, label="Clean Text", rad=-0.25)

    # Syntactic Diff -> Sentence Embedder
    draw_arrow(c3_card_x + c3_card_w/2, 70.0, c3_card_x + c3_card_w/2, 66.0, label="Diff Detected")

    # Embedder -> Cosine Distance Evaluator
    draw_arrow(c3_card_x + c3_card_w/2, 45.0, c3_card_x + c3_card_w/2, 41.0, label="384-d Vectors")

    # Decision from Evaluator -> LLM Engine
    draw_arrow(c3_x + col_w - 1.0, 20.0, c4_x + 1.0, 75.0, label="Sim < θ (Change)", rad=-0.2)

    # Suppressed branch indicator
    ax.annotate("Sim ≥ θ\n(Noise Filtered)", xy=(c3_x + col_w - 1.0, 15.0), xytext=(c3_x + col_w + 1.0, 10.0),
                fontsize=7.0, fontweight='bold', color="#4A5568",
                arrowprops=dict(arrowstyle="->", color="#718096", lw=1.0, linestyle="--"),
                bbox=dict(boxstyle="round,pad=0.2", facecolor="#EDF2F7", edgecolor="#CBD5E1"))

    # LLM Engine -> Scoring & Battlecards & War Room
    draw_arrow(c4_card_x + c4_card_w/2, 67.0, c4_card_x + c4_card_w/2, 63.0, label="Analysis")
    draw_arrow(c4_card_x + c4_card_w/2, 45.0, c4_card_x + c4_card_w/2, 42.0, label="Threat Score")
    draw_arrow(c4_card_x + c4_card_w/2, 27.5, c4_card_x + c4_card_w/2, 24.5, label="Context")

    # AI Layer -> Outputs
    # LLM -> SQLite
    draw_arrow(c4_x + col_w - 1.0, 76.0, c5_x + 1.0, 78.0, label="Persist Card")

    # Threat Scoring -> Alert Dispatcher
    draw_arrow(c4_x + col_w - 1.0, 54.0, c5_x + 1.0, 61.0, label="Alert Stream", rad=0.0)

    # Battlecard & Analysis -> CRM Adapter
    draw_arrow(c4_x + col_w - 1.0, 35.0, c5_x + 1.0, 41.0, label="Sync Records", rad=0.0)

    # SQLite -> UI Dashboard
    draw_arrow(c5_card_x + c5_card_w/2, 72.0, c5_card_x + c5_card_w/2, 69.0)
    draw_arrow(c5_card_x + c5_card_w/2, 53.0, c5_card_x + c5_card_w/2, 50.0)
    draw_arrow(c5_card_x + c5_card_w/2, 32.0, c5_card_x + c5_card_w/2, 29.0)

    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300, facecolor=bg_color, bbox_inches='tight')
    plt.close()
    print(f"Generated monochrome system architecture diagram at: {output_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_png = os.path.join(base_dir, 'docs', 'figures', 'figure_4_1_system_architecture.png')
    draw_system_architecture(output_png)
