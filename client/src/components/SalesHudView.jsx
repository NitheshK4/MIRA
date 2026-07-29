import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Sparkles, 
  MessageSquare, 
  Bomb, 
  ShieldCheck, 
  Copy, 
  Check, 
  Search, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Layers,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';

const QUICK_SCENARIOS = [
  {
    id: 'pricing_drop',
    label: 'Competitor dropped price ($70/mo vs $80/mo)',
    category: 'pricing',
    prompt: 'Competitor reduced starter tier pricing to $70 per month.'
  },
  {
    id: 'ai_copilot',
    label: 'Competitor launched native AI Agents',
    category: 'product',
    prompt: 'Prospect says competitor launched automated AI agents and workflow copilot.'
  },
  {
    id: 'sla_guarantee',
    label: 'Rival claims 99.99% uptime & 24/7 phone support',
    category: 'support',
    prompt: 'Prospect asking why rival offers 99.99% SLA uptime and 24/7 phone support.'
  },
  {
    id: 'free_seats',
    label: 'Rival offers unlimited user seats',
    category: 'pricing',
    prompt: 'Competitor offering unlimited user seats on their starter plan.'
  },
  {
    id: 'compliance',
    label: 'Prospect demands SOC2 & HIPAA proof',
    category: 'compliance',
    prompt: 'Prospect requiring SOC2 Type II and HIPAA security compliance verification.'
  }
];

export default function SalesHudView({ 
  cards = [], 
  competitors = [], 
  battlecards = [], 
  profile = null 
}) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedSection, setCopiedSection] = useState(null);

  const compName = competitors.length > 0 ? (competitors[0].name || competitors[0].url) : 'Primary Competitor';
  const companyName = profile?.business_name || 'WorkflowSync';

  // Client-side dynamic match & objection script generator
  const generatedScript = useMemo(() => {
    const text = (query || '').toLowerCase().trim();
    
    // Find matching intel cards from live dataset
    const matchingCards = cards.filter(c => {
      if (!text) return true;
      const searchBlob = `${c.summary} ${c.category} ${c.justification} ${c.recommendation} ${c.competitor_name}`.toLowerCase();
      return searchBlob.includes(text) || text.split(' ').some(w => w.length > 3 && searchBlob.includes(w));
    }).slice(0, 3);

    // Determine category context
    let category = 'pricing';
    if (text.includes('ai') || text.includes('feature') || text.includes('agent') || text.includes('copilot')) {
      category = 'product';
    } else if (text.includes('sla') || text.includes('support') || text.includes('phone') || text.includes('uptime')) {
      category = 'support';
    } else if (text.includes('security') || text.includes('soc2') || text.includes('hipaa') || text.includes('compliance')) {
      category = 'compliance';
    } else if (text.includes('seat') || text.includes('tier') || text.includes('free') || text.includes('cost')) {
      category = 'pricing';
    }

    // Default or contextually tailored scripts
    let counterScript = `While ${compName} may highlight initial headline pricing, ${companyName} delivers zero hidden seat caps, dedicated SLA support, and verified ROI within 14 days. Their low entry tier often restricts API calls and locks custom integrations behind enterprise contracts.`;
    let landmine1 = `Ask them: "Does your starter rate include unlimited API webhooks and SOC2 audit log retention, or are those billed as add-ons?"`;
    let landmine2 = `Ask them: "What happens to your seat pricing once your team grows beyond 5 active workspace members?"`;
    let differentiator = `We guarantee native bi-directional CRM syncing, automated retry queues, and dedicated onboarding assistance included out of the box.`;

    if (category === 'product') {
      counterScript = `${companyName}'s autonomous intelligence engine goes beyond static rule templates by utilizing ONNX sentence transformers and triple-tier LLM fallbacks. Unlike competitor wrapper tools, our platform operates fully self-healing under cloud memory limits.`;
      landmine1 = `Ask them: "Does your AI engine run on a robust 3-tier fallback architecture, or does it completely crash if the primary LLM API key rate limits?"`;
      landmine2 = `Ask them: "Can your system detect subtle semantic messaging shifts on competitor websites, or does it just flag basic text rewordings?"`;
      differentiator = `Deep ONNX semantic change detection, auto-generated competitive battlecards, and game-theory War Room simulations.`;
    } else if (category === 'support' || category === 'compliance') {
      counterScript = `${companyName} adheres strictly to enterprise-grade security standards with encrypted data pipelines and automated SQLite queue persistence so no intelligence data is ever dropped during transient API outages.`;
      landmine1 = `Ask them: "How does your system handle failed CRM webhooks when Notion or Airtable API endpoints experience network rate limiting?"`;
      landmine2 = `Ask them: "Are audit logs and battlecard exports encrypted in transit and stored with guaranteed idempotency?"`;
      differentiator = `Self-healing SQLite retry queue, zero data loss guarantees, and complete audit logging.`;
    }

    return {
      category,
      counterScript,
      landmines: [landmine1, landmine2],
      differentiator,
      matchingCards
    };
  }, [query, cards, compName, companyName]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 md:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap size={13} className="text-amber-400 animate-pulse" /> Live Sales Assistant HUD
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-['Outfit'] tracking-tight flex items-center gap-3">
              Sales Call Counter-Scripting HUD 🎯
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Real-time intelligence heads-up display for live sales calls. Type prospect objections or competitor claims to generate instant battlecard counter-scripts, killer landmines, and value proof points.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/50 shadow-inner">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-['Outfit']">Intel Telemetry Active</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {cards.length} Live Cards Registered
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-400" />
          Type Prospect Objection or Competitor Claim:
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Prospect says competitor dropped pricing to $70/mo, or rival introduced AI agents..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans shadow-inner"
          />
          <Search size={18} className="absolute left-4 top-4 text-slate-500" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3.5 px-2 py-1 rounded bg-slate-800 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Scenario Chips */}
        <div>
          <div className="text-[11px] font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" /> Quick-Tap Common Sales Scenarios:
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setQuery(sc.prompt)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  query === sc.prompt
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Target size={12} className="text-indigo-400" />
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Sales Counter-Scripts & Landmines */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Instant Counter-Script */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">1. What to Say Right Now (Counter-Script)</h3>
                  <span className="text-[11px] text-slate-400">Direct verbal response for sales reps during call</span>
                </div>
              </div>

              <button
                onClick={() => handleCopy(generatedScript.counterScript, 'script')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition-all"
              >
                {copiedSection === 'script' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedSection === 'script' ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans font-normal border-l-4 border-l-indigo-500">
              "{generatedScript.counterScript}"
            </div>
          </div>

          {/* Card 2: Killer Sales Landmines */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Bomb size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">2. Killer Sales Landmines to Drop</h3>
                  <span className="text-[11px] text-slate-400">Questions to ask the prospect to expose rival vulnerabilities</span>
                </div>
              </div>

              <button
                onClick={() => handleCopy(generatedScript.landmines.join('\n\n'), 'landmines')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-all"
              >
                {copiedSection === 'landmines' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedSection === 'landmines' ? 'Copied!' : 'Copy Questions'}
              </button>
            </div>

            <div className="space-y-3">
              {generatedScript.landmines.map((lm, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {lm}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Key Value Differentiator */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">3. Core Differentiator</h3>
                <span className="text-[11px] text-slate-400">Our unique product advantage</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 font-medium leading-relaxed">
              ⚡ {generatedScript.differentiator}
            </div>
          </div>

        </div>

        {/* Right Col: Live Intel Evidence Feed */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Layers size={16} className="text-sky-400" /> Matched Intel Evidence
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
                {generatedScript.matchingCards.length} Evidence Found
              </span>
            </div>

            {generatedScript.matchingCards.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No matching intel cards found for this query. Try a quick scenario above!
              </div>
            ) : (
              <div className="space-y-3.5">
                {generatedScript.matchingCards.map((card) => (
                  <div 
                    key={card.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                        {card.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        card.impact_score >= 8 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        Score: {card.impact_score}/10
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white font-['Outfit']">
                      {card.competitor_name}
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                      {card.summary}
                    </p>

                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex items-center justify-between">
                      <span>{new Date(card.timestamp).toLocaleDateString()}</span>
                      <span className="text-emerald-400 font-mono">Notion Synced</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
