import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingUp, 
  Award, 
  Target, 
  Sparkles, 
  Check, 
  Copy,
  Download,
  AlertTriangle,
  Building,
  Zap,
  Users
} from 'lucide-react';

export default function ExecutivePdfModal({ 
  isOpen, 
  onClose, 
  profile, 
  competitors = [], 
  battlecards = {}, 
  intelCards = [], 
  settings = {} 
}) {
  const [copiedText, setCopiedText] = useState(false);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState('all');

  if (!isOpen) return null;

  const activeModel = settings?.gemini_model || 'gemini-3.6-flash';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const parseJson = (field, fallback) => {
    if (!field) return fallback;
    if (typeof field === 'object') return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return fallback;
    }
  };

  // Filter competitors if specific one is selected
  const filteredCompetitors = selectedCompetitorId === 'all'
    ? competitors
    : competitors.filter(c => String(c.id) === String(selectedCompetitorId));

  // Compute aggregate metrics
  const totalCards = intelCards.length;
  const highImpactCards = intelCards.filter(c => c.impact_score >= 7);
  const avgImpact = totalCards > 0 
    ? (intelCards.reduce((sum, c) => sum + (c.impact_score || 0), 0) / totalCards).toFixed(1)
    : 0;

  // Calculate Average Defense Score across tracked battlecards
  const cardList = Object.values(battlecards);
  let totalScore = 0;
  let scoreCount = 0;
  cardList.forEach(card => {
    const bg = parseJson(card.battleguard, null);
    if (bg && typeof bg.defense_score === 'number') {
      totalScore += bg.defense_score;
      scoreCount++;
    }
  });
  const avgDefenseScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 84;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `MIRA EXECUTIVE COMPETITOR INTELLIGENCE BRIEFING
Generated: ${currentDate} | Model: ${activeModel}
Workspace Profile: ${profile?.business_name || 'Our Company'}

SUMMARY METRICS:
- Monitored Competitors: ${competitors.length}
- Average Defense Index: ${avgDefenseScore}/100
- Total Detected Signals: ${totalCards}
- High-Impact Signals (>=7/10): ${highImpactCards.length}

COMPETITOR BREAKDOWN:
${competitors.map(c => {
  const card = battlecards[c.id];
  const bg = card ? parseJson(card.battleguard, {}) : {};
  return `- ${c.name} (${c.url}): Defense Score ${bg.defense_score || 84}/100 | Threat Level: ${bg.threat_level || 'MODERATE'}`;
}).join('\n')}

Visit Dashboard for full interactive War Room & BattleGuard analytics.`;

    navigator.clipboard.writeText(summaryText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black print:my-0 print:w-full print:max-w-none">
        
        {/* Modal Toolbar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Executive Intelligence PDF Briefing
              </h2>
              <p className="text-xs text-slate-400">
                Print-ready executive summary for leadership & sales enablement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Competitor Dropdown */}
            <select
              value={selectedCompetitorId}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-xs text-slate-200 font-semibold focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Competitors ({competitors.length})</option>
              {competitors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
            >
              {copiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedText ? 'Copied Briefing' : 'Copy Text'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Executive Report Content Container */}
        <div className="p-8 space-y-8 bg-slate-900 text-slate-100 print:bg-white print:text-slate-900 print:p-6 print:space-y-6">
          
          {/* Executive Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 border border-violet-500/30 print:border-b-2 print:border-slate-800 print:bg-none print:p-0 print:pb-4">
            <div>
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider mb-1 print:text-violet-700">
                <Sparkles size={14} /> MIRA Executive Intelligence Briefing
              </div>
              <h1 className="text-2xl font-black text-white font-['Outfit'] print:text-slate-900">
                {profile?.business_name || 'Our Company'} Competitor Radar
              </h1>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                {profile?.product_desc || 'B2B Software & Digital Services'} • Pricing Tier: <span className="text-slate-200 font-semibold print:text-slate-800">{profile?.price_point || 'Standard Tiers'}</span>
              </p>
            </div>

            <div className="mt-4 md:mt-0 text-right print:text-left print:mt-2">
              <div className="text-xs font-bold text-slate-300 print:text-slate-700">
                Generated: {currentDate}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 print:text-slate-500">
                AI Engine: <span className="text-violet-300 font-mono font-semibold print:text-violet-800">{activeModel}</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 print:text-emerald-700">
                🛡️ BattleGuard Protection Active
              </div>
            </div>
          </div>

          {/* Key Executive Metrics Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider print:text-slate-600">Monitored Rivals</span>
                <Building size={16} className="text-violet-400 print:text-violet-700" />
              </div>
              <div className="text-2xl font-black text-white font-['Outfit'] print:text-slate-900">
                {competitors.length}
              </div>
              <div className="text-[10.5px] text-slate-400 mt-0.5 print:text-slate-600">Active competitor radars</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 print:border-emerald-300 print:bg-emerald-50/50">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider print:text-slate-600">Avg Defense Index</span>
                <ShieldCheck size={16} className="text-emerald-400 print:text-emerald-700" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-['Outfit'] print:text-emerald-800">
                {avgDefenseScore}<span className="text-sm text-slate-500 font-normal">/100</span>
              </div>
              <div className="text-[10.5px] text-slate-400 mt-0.5 print:text-slate-600">Market posture strength</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 print:border-amber-300 print:bg-amber-50/50">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider print:text-slate-600">Detected Signals</span>
                <Zap size={16} className="text-amber-400 print:text-amber-700" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-['Outfit'] print:text-amber-800">
                {totalCards}
              </div>
              <div className="text-[10.5px] text-slate-400 mt-0.5 print:text-slate-600">Semantic webpage changes</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-500/30 print:border-rose-300 print:bg-rose-50/50">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider print:text-slate-600">High Threat Moves</span>
                <ShieldAlert size={16} className="text-rose-400 print:text-rose-700" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-['Outfit'] print:text-rose-800">
                {highImpactCards.length}
              </div>
              <div className="text-[10.5px] text-slate-400 mt-0.5 print:text-slate-600">Impact score ≥ 7/10</div>
            </div>
          </div>

          {/* Section 1: Monitored Competitors BattleGuard Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10 print:border-slate-400">
              <ShieldCheck size={18} className="text-violet-400 print:text-violet-700" />
              <h2 className="text-lg font-bold text-white font-['Outfit'] print:text-slate-900">
                1. Competitor Radars & BattleGuard Defense Posture
              </h2>
            </div>

            {filteredCompetitors.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No competitors registered in radar yet.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCompetitors.map(comp => {
                  const card = battlecards[comp.id];
                  const bg = card ? parseJson(card.battleguard, {}) : {};
                  const defenseScore = bg.defense_score || 84;
                  const threatLevel = bg.threat_level || 'MODERATE';
                  const tactics = Array.isArray(bg.defensive_tactics) ? bg.defensive_tactics : [];
                  const threatVectors = Array.isArray(bg.threat_vectors) ? bg.threat_vectors : [];

                  const strengths = card ? parseJson(card.strengths, []) : [];
                  const weaknesses = card ? parseJson(card.weaknesses, []) : [];
                  const whyWeWin = card ? parseJson(card.why_we_win, []) : [];
                  const objectionHandling = card ? parseJson(card.objection_handling, []) : [];
                  const landmines = card ? parseJson(card.landmines, []) : [];

                  return (
                    <div key={comp.id} className="p-5 rounded-xl bg-slate-950/80 border border-violet-500/20 space-y-4 print:border-slate-300 print:bg-white print:p-4 print:space-y-3 print:page-break-inside-avoid">
                      
                      {/* Competitor Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 print:border-slate-200">
                        <div>
                          <h3 className="text-base font-bold text-white font-['Outfit'] print:text-slate-900">
                            {comp.name}
                          </h3>
                          <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 font-mono hover:underline print:text-sky-700">
                            {comp.url}
                          </a>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase print:text-slate-600">Defense Index</div>
                            <div className="text-lg font-black text-emerald-400 font-['Outfit'] print:text-emerald-800">
                              {defenseScore}<span className="text-xs text-slate-500 font-normal">/100</span>
                            </div>
                          </div>

                          <div className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            threatLevel === 'CRITICAL' || threatLevel === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 print:bg-rose-100 print:text-rose-800 print:border-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-300'
                          }`}>
                            Threat: {threatLevel}
                          </div>
                        </div>
                      </div>

                      {/* Positioning & Target ICP */}
                      {card && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-900/90 border border-white/5 print:bg-slate-50 print:border-slate-200">
                            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10.5px] mb-1 print:text-slate-700">
                              📌 Positioning & Overview
                            </div>
                            <p className="text-slate-300 leading-relaxed print:text-slate-800">
                              {card.overview || 'Standard competitive player offering rival solutions.'}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-900/90 border border-white/5 print:bg-slate-50 print:border-slate-200">
                            <div className="font-bold text-sky-400 uppercase tracking-wider text-[10.5px] mb-1 print:text-sky-800">
                              🎯 Target Persona & ICP Fit
                            </div>
                            <p className="text-slate-300 leading-relaxed print:text-slate-800">
                              {card.target_icp || `${comp.name} targets general market buyers, whereas our product is optimized for agile teams seeking rapid ROI.`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Defensive Tactics & Win Angles */}
                      {tactics.length > 0 && (
                        <div className="p-3.5 rounded-lg bg-violet-950/30 border border-violet-500/30 text-xs space-y-2 print:bg-violet-50 print:border-violet-200">
                          <div className="font-bold text-violet-300 uppercase tracking-wider text-[10.5px] print:text-violet-800">
                            🛡️ Tactical Counter-Defenses
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {tactics.map((t, idx) => (
                              <div key={idx} className="p-2 rounded bg-slate-900/80 border border-white/5 print:bg-white print:border-slate-200">
                                <div className="font-bold text-slate-200 text-[11px] print:text-slate-900">{t.vector}</div>
                                <div className="text-slate-400 text-[10.5px] mt-0.5 leading-snug print:text-slate-600">{t.strategy}</div>
                              </div>
                            ))}
                          </div>
                          {bg.recommended_win_angle && (
                            <div className="text-[11px] text-emerald-300 font-semibold pt-1 border-t border-violet-500/20 print:text-emerald-800">
                              ✨ <span className="uppercase text-[10px] text-slate-400 print:text-slate-600">Winning Position:</span> {bg.recommended_win_angle}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SWOT Comparison Grid */}
                      {card && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:grid-cols-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-900/60 border border-emerald-500/20 print:bg-slate-50 print:border-slate-200">
                            <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10.5px] mb-1.5 print:text-emerald-800">
                              🏆 Why We Win
                            </div>
                            <ul className="space-y-1 text-slate-300 list-disc list-inside print:text-slate-800">
                              {whyWeWin.slice(0, 3).map((w, idx) => (
                                <li key={idx} className="leading-tight">{w}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700 print:bg-slate-50 print:border-slate-200">
                            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10.5px] mb-1.5 print:text-slate-700">
                              ✅ Their Strengths
                            </div>
                            <ul className="space-y-1 text-slate-400 list-disc list-inside print:text-slate-600">
                              {strengths.slice(0, 3).map((s, idx) => (
                                <li key={idx} className="leading-tight">{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-900/60 border border-rose-500/20 print:bg-slate-50 print:border-slate-200">
                            <div className="font-bold text-rose-400 uppercase tracking-wider text-[10.5px] mb-1.5 print:text-rose-800">
                              ❌ Their Vulnerabilities
                            </div>
                            <ul className="space-y-1 text-slate-300 list-disc list-inside print:text-slate-800">
                              {weaknesses.slice(0, 3).map((w, idx) => (
                                <li key={idx} className="leading-tight">{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Objection Counter-Script Excerpt */}
                      {objectionHandling.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-white/10 text-xs space-y-1.5 print:bg-slate-50 print:border-slate-200">
                          <div className="font-bold text-amber-400 uppercase tracking-wider text-[10.5px] print:text-amber-800">
                            🗣️ Key Objection Counter-Script Script
                          </div>
                          <div className="text-slate-200 font-semibold print:text-slate-900">
                            Prospect Claim: {objectionHandling[0].objection}
                          </div>
                          <div className="text-slate-300 italic bg-black/30 p-2 rounded border border-white/5 print:bg-white print:border-slate-300 print:text-slate-800">
                            "{objectionHandling[0].response}"
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Recent High-Impact Intelligence Signals */}
          {intelCards.length > 0 && (
            <div className="space-y-4 print:page-break-before-always">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10 print:border-slate-400">
                <Zap size={18} className="text-amber-400 print:text-amber-700" />
                <h2 className="text-lg font-bold text-white font-['Outfit'] print:text-slate-900">
                  2. Recent High-Impact Competitor Signals
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 print:border-slate-300 print:text-slate-700">
                      <th className="py-2 px-3 font-bold uppercase tracking-wider">Date</th>
                      <th className="py-2 px-3 font-bold uppercase tracking-wider">Competitor</th>
                      <th className="py-2 px-3 font-bold uppercase tracking-wider">Category</th>
                      <th className="py-2 px-3 font-bold uppercase tracking-wider text-center">Impact</th>
                      <th className="py-2 px-3 font-bold uppercase tracking-wider">Summary & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-slate-200">
                    {intelCards.slice(0, 8).map((card, idx) => (
                      <tr key={idx} className="hover:bg-white/5 print:hover:bg-transparent">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap print:text-slate-600">
                          {card.created_at ? new Date(card.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white print:text-slate-900">
                          {card.competitor_name || 'Competitor'}
                        </td>
                        <td className="py-2.5 px-3 text-violet-300 font-semibold uppercase text-[10px] print:text-violet-800">
                          {card.category}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                            card.impact_score >= 8
                              ? 'bg-rose-500/20 text-rose-400 print:bg-rose-100 print:text-rose-800'
                              : card.impact_score >= 5
                              ? 'bg-amber-500/20 text-amber-400 print:bg-amber-100 print:text-amber-800'
                              : 'bg-slate-800 text-slate-300 print:bg-slate-100 print:text-slate-700'
                          }`}>
                            {card.impact_score}/10
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 leading-relaxed print:text-slate-800">
                          {card.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Executive Footer */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
            <div>
              MIRA Autonomous Competitor Intelligence Engine • Confidential Executive Report
            </div>
            <div className="mt-1 sm:mt-0 font-mono text-[11px]">
              Page 1 of 1 • System Active
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
