import React, { useState } from 'react';
import { 
  Swords, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Target, 
  Zap, 
  ChevronRight, 
  Building2, 
  Clock, 
  BarChart2, 
  ArrowRight 
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    icon: '💰',
    title: 'Drop Pricing by 25%',
    move: 'Reduce our main Pro pricing plan from $149/mo to $99/mo to capture mid-market market share.'
  },
  {
    icon: '🤖',
    title: 'Launch Autonomous AI Agent Feature',
    move: 'Introduce real-time automated competitive analysis & battlecard sync for all paid tiers.'
  },
  {
    icon: '⚡',
    title: 'Pivot to Freemium Self-Serve Model',
    move: 'Eliminate demo-booking requirement and offer a free forever tier for up to 2 competitor targets.'
  },
  {
    icon: '🏢',
    title: 'Enterprise Custom SLA Expansion',
    move: 'Launch dedicated SOC-2 compliant private cloud deployment tier for Fortune 500 prospects.'
  }
];

export default function WarRoomView({ competitors = [], profile }) {
  const [customMove, setCustomMove] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunSimulation = async (moveText) => {
    const query = moveText || customMove;
    if (!query.trim()) return;

    setSimulating(true);
    setError(null);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/warroom/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: query })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Simulation failed to run');
      }

      const result = await res.json();
      setSimulationResult(result);
    } catch (err) {
      console.error('War Room simulation error:', err);
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 4) return 'emerald';
    if (score <= 7) return 'amber';
    return 'rose';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="mira-glass p-8 relative overflow-hidden border-violet-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/15 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5" /> Multi-Agent Market Simulator
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-3">
              Competitive War Room
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Test strategic hypotheses against your monitored competitors. Our game-theory AI predicts counter-moves, calculates threat severity, and synthesizes a step-by-step offensive playbook.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#0D0F17]/80 p-3.5 rounded-2xl border border-slate-800">
            <Building2 className="w-8 h-8 text-sky-400 p-1.5 bg-sky-500/10 rounded-xl" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Radar</div>
              <div className="text-xs font-black text-white">{competitors.length} Monitored Competitors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Scenario Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Select a Strategic Move Hypothesis
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_SCENARIOS.map((scenario, index) => {
            const isSelected = selectedPreset === index;
            return (
              <div 
                key={index}
                onClick={() => {
                  setSelectedPreset(index);
                  setCustomMove(scenario.move);
                }}
                className={`mira-glass p-5 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${
                  isSelected 
                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10 scale-[1.02]' 
                    : 'hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-2xl">{scenario.icon}</div>
                  <h4 className="text-sm font-bold text-white font-['Outfit'] group-hover:text-violet-300 transition-colors">
                    {scenario.title}
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-snug line-clamp-3">
                    {scenario.move}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] font-bold text-violet-400">
                  <span>Simulate Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Form & Action */}
      <div className="mira-glass p-6 space-y-4">
        <div className="mira-form-group">
          <label className="mira-form-label flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Custom Strategic Move Description
            </span>
            <span className="text-slate-500 text-[11px]">Describe any pricing change, product pivot, or marketing campaign</span>
          </label>
          <textarea 
            className="mira-textarea text-xs" 
            rows="3"
            value={customMove}
            onChange={e => {
              setCustomMove(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="e.g., We plan to bundle enterprise CRM sync for free and launch a $49 entry plan targeting SMB sales teams..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-3">
          {simulationResult && (
            <button 
              className="mira-btn mira-btn-secondary text-xs"
              onClick={() => {
                setSimulationResult(null);
                setCustomMove('');
                setSelectedPreset(null);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          <button 
            className="mira-btn mira-btn-primary py-3 px-6 text-xs font-black shadow-xl"
            disabled={simulating || !customMove.trim()}
            onClick={() => handleRunSimulation()}
          >
            {simulating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                Running Multi-Agent Market Simulation...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Market Simulation Engine
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mira-glass p-6 border-l-4 border-rose-500 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Simulation Loading Screen */}
      {simulating && (
        <div className="mira-glass p-12 text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 p-[1.5px] mx-auto animate-pulse">
            <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center text-violet-400">
              <Swords className="w-8 h-8 animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white font-['Outfit']">Simulating Competitor Reactions...</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Evaluating competitive strategy, expected price undercutting, marketing responses, and tactical counter-measures.
            </p>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-400 animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Simulation Results View */}
      {simulationResult && !simulating && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Verdict & Risk Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Gauge Card */}
            <div className="mira-glass p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Market Risk Score</span>
                <ShieldAlert className={`w-5 h-5 text-${getRiskColor(simulationResult.risk_score)}-400`} />
              </div>

              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-black font-['Outfit'] text-${getRiskColor(simulationResult.risk_score)}-400`}>
                  {simulationResult.risk_score}
                </span>
                <span className="text-slate-400 text-xs">/ 10</span>
                <span className={`mira-badge-${getRiskColor(simulationResult.risk_score)} ml-auto px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold`}>
                  {simulationResult.risk_level} RISK
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${
                    simulationResult.risk_score <= 4 ? 'from-emerald-500 to-teal-400' :
                    simulationResult.risk_score <= 7 ? 'from-amber-500 to-yellow-400' :
                    'from-rose-500 to-pink-500'
                  }`}
                  style={{ width: `${simulationResult.risk_score * 10}%` }}
                ></div>
              </div>
            </div>

            {/* Strategic Verdict Card */}
            <div className="mira-glass p-6 md:col-span-2 space-y-3 flex flex-col justify-between border-violet-500/20">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Strategic Recommendation</span>
                <span className="mira-badge-violet px-3 py-1 rounded-full text-xs font-bold">
                  {simulationResult.strategic_verdict}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  "{simulationResult.scenario}"
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {simulationResult.market_impact_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Predicted Competitor Reactions */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              Predicted Competitor Responses ({simulationResult.competitor_responses?.length || 0})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulationResult.competitor_responses?.map((comp, idx) => (
                <div key={idx} className="mira-glass p-5 space-y-3 border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      {comp.competitor_name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      comp.threat_severity === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      comp.threat_severity === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {comp.threat_severity} Threat
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    {comp.predicted_action}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Expected Window: <strong className="text-slate-200">{comp.timeframe}</strong>
                    </span>
                    <span className="text-sky-400 font-bold">
                      {comp.likelihood_pct}% Likelihood
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Counter-Offensive Playbook */}
          <div className="mira-glass p-6 space-y-5 border-emerald-500/20">
            <h3 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Counter-Offensive Action Matrix
            </h3>

            <div className="space-y-4">
              {simulationResult.counter_offensive_playbook?.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 rounded-xl bg-[#0D0F17]/60 border border-slate-800/80">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                    {step.step || idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{step.action}</span>
                      {step.phase && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                          {step.phase}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
