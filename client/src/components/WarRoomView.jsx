import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Download,
  Share2,
  Check,
  Plus,
  History,
  Layers,
  HelpCircle,
  Briefcase,
  Users,
  Shield,
  FileText,
  Sliders,
  X,
  Trash2,
  Eye
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    icon: '💰',
    title: 'Reduce Enterprise Pricing by 30%',
    description: 'Slash enterprise tier pricing by 30% to aggressively capture mid-market accounts from incumbents.',
    market_segment: 'Enterprise',
    affected_product: 'Pricing Tiers',
    timeframe: 'Short Term (30 Days)'
  },
  {
    icon: '🤖',
    title: 'Competitor X Launches AI Feature',
    description: 'Primary rival releases automated AI agent capability directly undercutting our core product value proposition.',
    market_segment: 'All Segments',
    affected_product: 'AI Feature Suite',
    timeframe: 'Immediate (0-7 Days)'
  },
  {
    icon: '⚡',
    title: 'New Low-Cost Entrant Enters Market',
    description: 'A funded new entrant launches a $29/mo self-serve competitor targeting SMB sales teams.',
    market_segment: 'SMB',
    affected_product: 'Core SaaS',
    timeframe: 'Short Term (30 Days)'
  },
  {
    icon: '🏢',
    title: 'Pivot to Freemium Self-Serve Model',
    description: 'Eliminate demo-booking requirement and offer a free forever tier for up to 2 competitor targets.',
    market_segment: 'Mid-Market',
    affected_product: 'Core SaaS',
    timeframe: 'Quarterly (90 Days)'
  }
];

export default function WarRoomView({ competitors = [], profile }) {
  // Input Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [marketSegment, setMarketSegment] = useState('All Segments');
  const [affectedProduct, setAffectedProduct] = useState('Core Platform');
  const [timeframe, setTimeframe] = useState('Short Term (30 Days)');
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');

  // History & Comparison State
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('immediate'); // 'immediate', 'short_term', 'strategic'
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [checkedActions, setCheckedActions] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/warroom/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.warn('Failed to load War Room history:', e.message);
    }
  };

  const handleSelectPreset = (preset, idx) => {
    setSelectedPreset(idx);
    setTitle(preset.title);
    setDescription(preset.description);
    setMarketSegment(preset.market_segment);
    setAffectedProduct(preset.affected_product);
    setTimeframe(preset.timeframe);
    setValidationError('');
  };

  const toggleCompetitorSelection = (id) => {
    setSelectedCompetitorIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleRunSimulation = async () => {
    if (!title.trim()) {
      setValidationError('Please enter a scenario title or choose a preset.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Please enter a detailed scenario description.');
      return;
    }

    setValidationError('');
    setSimulating(true);
    setError(null);
    setSimulationResult(null);

    const payload = {
      title,
      description,
      market_segment: marketSegment,
      affected_product: affectedProduct,
      timeframe,
      competitor_ids: selectedCompetitorIds
    };

    try {
      const res = await fetch('/api/warroom/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: payload })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Simulation failed to run');
      }

      const result = await res.json();
      setSimulationResult(result);
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error('War Room simulation error:', err);
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/warroom/history/${id}`, { method: 'DELETE' });
      fetchHistory();
      if (simulationResult?.id === id) {
        setSimulationResult(null);
      }
    } catch (e) {
      console.error('Failed to delete history item:', e.message);
    }
  };

  const handleLoadHistoryItem = (item) => {
    setSimulationResult(item.simulation_data);
    if (item.scenario_input) {
      setTitle(item.scenario_input.title || item.title || '');
      setDescription(item.scenario_input.description || '');
      setMarketSegment(item.scenario_input.market_segment || 'All Segments');
      setAffectedProduct(item.scenario_input.affected_product || 'Core Platform');
      setTimeframe(item.scenario_input.timeframe || 'Short Term (30 Days)');
    }
    setShowHistory(false);
  };

  const getRiskScoreColor = (score) => {
    if (score <= 3) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'LOW RISK' };
    if (score <= 6) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'MODERATE RISK' };
    if (score <= 8) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', label: 'HIGH RISK' };
    return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', label: 'CRITICAL THREAT' };
  };

  const toggleActionCheck = (actId) => {
    setCheckedActions(prev => ({ ...prev, [actId]: !prev[actId] }));
  };

  const handleCopySlackMemo = () => {
    if (!simulationResult) return;
    let memo = `*⚔️ MIRA WAR ROOM EXECUTIVE BRIEFING*\n\n`;
    memo += `*Scenario*: ${simulationResult.scenario_title || title}\n`;
    memo += `*Market Segment*: ${simulationResult.market_segment} | *Timeframe*: ${simulationResult.timeframe}\n`;
    memo += `*Risk Score*: ${simulationResult.risk_score}/10 (${simulationResult.risk_level})\n`;
    memo += `*Verdict*: ${simulationResult.strategic_verdict}\n\n`;
    memo += `*Predicted Competitor Responses*:\n`;
    (simulationResult.competitor_responses || []).forEach(c => {
      memo += `• *${c.competitor_name}* (${c.strategy_type}): ${c.predicted_action} [${c.likelihood_pct}% Likelihood]\n`;
    });
    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!simulationResult) return;
    let md = `# MIRA Executive War Room Simulation Report\n\n`;
    md += `**Date**: ${new Date().toLocaleDateString()}\n`;
    md += `**Scenario Title**: ${simulationResult.scenario_title || title}\n`;
    md += `**Description**: ${simulationResult.scenario_description || description}\n`;
    md += `**Market Segment**: ${simulationResult.market_segment}\n`;
    md += `**Affected Product**: ${simulationResult.affected_product}\n`;
    md += `**Timeframe**: ${simulationResult.timeframe}\n\n`;
    
    md += `--- \n## 📊 Executive Risk & Threat Assessment\n`;
    md += `- **Risk Score**: ${simulationResult.risk_score}/10 (${simulationResult.risk_level})\n`;
    md += `- **Threat Level**: ${simulationResult.threat_level}\n`;
    md += `- **Confidence Score**: ${simulationResult.confidence_score}%\n`;
    md += `- **Urgency**: ${simulationResult.urgency}\n`;
    md += `- **Strategic Verdict**: ${simulationResult.strategic_verdict}\n`;
    md += `- **Business Impact**: ${simulationResult.business_impact}\n\n`;

    md += `--- \n## 🎯 Predicted Competitor Responses\n`;
    (simulationResult.competitor_responses || []).forEach(c => {
      md += `### ${c.competitor_name} (${c.strategy_type})\n`;
      md += `- **Predicted Action**: ${c.predicted_action}\n`;
      md += `- **Likelihood**: ${c.likelihood_pct}%\n`;
      md += `- **Expected Timeline**: ${c.timeframe}\n`;
      md += `- **Severity**: ${c.threat_severity}\n\n`;
    });

    md += `--- \n## 🛡️ Counter-Offensive Playbook\n`;
    const playbook = simulationResult.counter_offensive_playbook || {};
    const phases = [
      { name: 'Phase 1: Immediate (0-7 Days)', items: playbook.phase_1_immediate || [] },
      { name: 'Phase 2: Short Term (30 Days)', items: playbook.phase_2_short_term || [] },
      { name: 'Phase 3: Strategic (90 Days)', items: playbook.phase_3_strategic || [] }
    ];

    phases.forEach(p => {
      md += `### ${p.name}\n`;
      p.items.forEach(act => {
        md += `#### ${act.step}. ${act.title || act.action}\n`;
        md += `${act.description || act.details}\n`;
        md += `- **Owner**: ${act.owner} | **Priority**: ${act.priority} | **Impact**: ${act.impact} | **Effort**: ${act.effort}\n`;
        md += `- **Dependencies**: ${act.dependencies} | **Success Metric**: ${act.success_metric}\n\n`;
      });
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WarRoom-Simulation-${Date.now()}.md`;
    a.click();
  };

  const currentRisk = simulationResult ? getRiskScoreColor(simulationResult.risk_score) : null;
  const playbook = simulationResult?.counter_offensive_playbook || {};
  const audit = simulationResult?.strategic_audit || {};
  const alternatives = simulationResult?.alternative_strategies || {};

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Top Banner */}
      <div className="mira-glass p-8 relative overflow-hidden border-orange-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-yellow-400/20 via-orange-400/15 to-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5" /> Game-Theory Scenario Engine
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-3">
              Competitive War Room Simulator
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Model hypothetical market moves against live competitor radar. Predict rival counter-strategies, calculate risk scores, and synthesize multi-phase executive playbooks.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md"
            >
              <History className="w-4 h-4 text-cyan-400" />
              <span>Simulation History ({history.length})</span>
            </button>

            <div className="flex items-center gap-3 bg-[#0A0E1A] p-3 rounded-2xl border border-slate-800">
              <Building2 className="w-7 h-7 text-[#118AB2] p-1 bg-[#118AB2]/10 rounded-xl" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Radar</div>
                <div className="text-xs font-black text-white">{competitors.length} Monitored Rivals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation History Drawer */}
      {showHistory && (
        <div className="mira-glass p-6 space-y-4 border-cyan-500/30 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Saved Simulation History
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No saved simulations yet. Run a scenario to save history.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((item) => {
                const rScore = item.simulation_data?.risk_score || 5;
                const rColor = getRiskScoreColor(rScore);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistoryItem(item)}
                    className="p-3.5 rounded-xl bg-[#090C19] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-sm text-white group-hover:text-cyan-300 font-['Outfit'] line-clamp-1">
                        {item.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete simulation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${rColor.bg} ${rColor.text} ${rColor.border}`}>
                        Risk: {rScore}/10
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Preset Scenario Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Select a Preset Market Scenario or Build Custom Hypothesis
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_SCENARIOS.map((preset, index) => {
            const isSelected = selectedPreset === index;
            return (
              <div 
                key={index}
                onClick={() => handleSelectPreset(preset, index)}
                className={`mira-glass p-5 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 scale-[1.02]' 
                    : 'hover:border-amber-500/40 hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-2xl">{preset.icon}</div>
                  <h4 className="text-sm font-bold text-white font-['Outfit'] group-hover:text-cyan-300 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-slate-300 text-[11px] leading-snug line-clamp-3">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] font-bold text-cyan-400">
                  <span>Load Preset</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Custom Scenario Form */}
      <div className="mira-glass p-6 space-y-5 border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Scenario Configuration Parameters
          </h3>
          <span className="text-slate-400 text-xs">All fields evaluated dynamically</span>
        </div>

        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scenario Title */}
          <div className="mira-form-group">
            <label className="mira-form-label text-xs font-bold text-slate-200">Scenario Title</label>
            <input
              type="text"
              className="mira-input text-xs"
              placeholder="e.g. Reduce Enterprise Pricing by 30%"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setValidationError('');
              }}
            />
          </div>

          {/* Timeframe */}
          <div className="mira-form-group">
            <label className="mira-form-label text-xs font-bold text-slate-200">Expected Timeframe</label>
            <select
              className="mira-select text-xs bg-[#090C19] border border-slate-800 text-white rounded-xl p-2.5"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="Immediate (0-7 Days)">Immediate (0-7 Days)</option>
              <option value="Short Term (30 Days)">Short Term (30 Days)</option>
              <option value="Quarterly (90 Days)">Quarterly (90 Days)</option>
            </select>
          </div>

          {/* Market Segment */}
          <div className="mira-form-group">
            <label className="mira-form-label text-xs font-bold text-slate-200">Market Segment</label>
            <select
              className="mira-select text-xs bg-[#090C19] border border-slate-800 text-white rounded-xl p-2.5"
              value={marketSegment}
              onChange={(e) => setMarketSegment(e.target.value)}
            >
              <option value="All Segments">All Segments</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="SMB">SMB</option>
            </select>
          </div>

          {/* Affected Product */}
          <div className="mira-form-group">
            <label className="mira-form-label text-xs font-bold text-slate-200">Affected Product / Module</label>
            <select
              className="mira-select text-xs bg-[#090C19] border border-slate-800 text-white rounded-xl p-2.5"
              value={affectedProduct}
              onChange={(e) => setAffectedProduct(e.target.value)}
            >
              <option value="Core Platform">Core Platform</option>
              <option value="Pricing Tiers">Pricing Tiers</option>
              <option value="AI Feature Suite">AI Feature Suite</option>
              <option value="Enterprise Tier">Enterprise Tier</option>
            </select>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="mira-form-group">
          <label className="mira-form-label text-xs font-bold text-slate-200">
            Detailed Scenario Description & Context
          </label>
          <textarea 
            className="mira-textarea text-xs bg-[#090C19] border border-slate-800 text-white rounded-xl p-3" 
            rows="3"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setValidationError('');
            }}
            placeholder="Describe the exact strategic move, pricing adjustments, feature additions, or market entry parameters..."
          ></textarea>
        </div>

        {/* Targeted Competitors Selection */}
        {competitors.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 block">Target Competitors to Include in Simulation</label>
            <div className="flex flex-wrap gap-2">
              {competitors.map(c => {
                const isChecked = selectedCompetitorIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCompetitorSelection(c.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                      isChecked 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100 text-cyan-400' : 'opacity-0'}`} />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {simulationResult && (
            <button 
              type="button"
              className="mira-btn mira-btn-secondary text-xs"
              onClick={() => {
                setSimulationResult(null);
                setTitle('');
                setDescription('');
                setSelectedPreset(null);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Result
            </button>
          )}

          <button 
            type="button"
            className="mira-btn mira-btn-primary py-3 px-6 text-xs font-black shadow-xl flex items-center gap-2"
            disabled={simulating}
            onClick={handleRunSimulation}
          >
            {simulating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                Executing Game-Theory Simulation Engine...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-black" />
                Run Game-Theory Simulation Engine
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mira-glass p-6 border-l-4 border-rose-500 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={handleRunSimulation} 
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 font-bold text-xs"
          >
            Retry Simulation
          </button>
        </div>
      )}

      {/* Skeleton Loading Screen */}
      {simulating && (
        <div className="mira-glass p-12 text-center space-y-6 relative overflow-hidden border-amber-500/30">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD166] via-[#FF9F1C] to-[#FF5D5D] p-[1.5px] mx-auto animate-pulse shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-[#090C19] rounded-[14px] flex items-center justify-center text-[#FF9F1C]">
              <Swords className="w-8 h-8 animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white font-['Outfit']">Running Game-Theory Market Simulation...</h3>
            <p className="text-slate-300 text-xs max-w-md mx-auto">
              Evaluating rival pricing reactions, competitor counter-moves, strategic trade-offs, and 3-phase executive playbooks.
            </p>
          </div>
          <div className="w-64 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 animate-pulse"></div>
          </div>
        </div>
      )}

      {/* SIMULATION RESULTS VIEW */}
      {simulationResult && !simulating && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Executive Action Bar & Export Options */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0A0D1B] p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Simulation generated dynamically via Game-Theory AI</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySlackMemo}
                className="px-3.5 py-2 rounded-xl bg-violet-600/25 border border-violet-500/50 text-violet-200 hover:bg-violet-600/40 text-xs font-extrabold flex items-center gap-2 transition-all"
              >
                {copiedMemo ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedMemo ? 'Copied Brief' : 'Copy Slack Memo'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="px-3.5 py-2 rounded-xl bg-sky-600/25 border border-sky-500/50 text-sky-200 hover:bg-sky-600/40 text-xs font-extrabold flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Report (.md)</span>
              </button>
            </div>
          </div>

          {/* Top Risk & Verdict Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Gauge Card */}
            <div className="mira-glass p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Overall Market Risk Score</span>
                <ShieldAlert className={`w-5 h-5 ${currentRisk.text}`} />
              </div>

              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-black font-['Outfit'] ${currentRisk.text}`}>
                  {simulationResult.risk_score}
                </span>
                <span className="text-slate-400 text-xs font-bold">/ 10</span>
                <span className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border uppercase ${currentRisk.bg} ${currentRisk.text} ${currentRisk.border}`}>
                  {currentRisk.label}
                </span>
              </div>

              {/* Progress Gauge Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${
                    simulationResult.risk_score <= 3 ? 'bg-emerald-400' :
                    simulationResult.risk_score <= 6 ? 'bg-amber-400' :
                    simulationResult.risk_score <= 8 ? 'bg-orange-500' :
                    'bg-rose-500'
                  }`}
                  style={{ width: `${simulationResult.risk_score * 10}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Confidence: <strong className="text-white">{simulationResult.confidence_score || 85}%</strong></span>
                <span>Urgency: <strong className="text-cyan-300">{simulationResult.urgency || 'Short Term'}</strong></span>
              </div>
            </div>

            {/* Strategic Verdict Card */}
            <div className="mira-glass p-6 md:col-span-2 space-y-3 flex flex-col justify-between border-amber-500/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Executive Strategic Verdict</span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black">
                  {simulationResult.strategic_verdict}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white font-['Outfit']">
                  "{simulationResult.scenario_title || title}"
                </h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  {simulationResult.business_impact}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                <span>Segment: <strong className="text-slate-200">{simulationResult.market_segment}</strong></span>
                <span>Module: <strong className="text-slate-200">{simulationResult.affected_product}</strong></span>
                <span>Timeframe: <strong className="text-slate-200">{simulationResult.timeframe}</strong></span>
              </div>
            </div>
          </div>

          {/* Predicted Competitor Responses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-cyan-400" />
                Predicted Competitor Reactions ({simulationResult.competitor_responses?.length || 0})
              </h3>
              <span className="text-xs text-slate-400">Game-Theory Counter-Move Predictions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulationResult.competitor_responses?.map((comp, idx) => (
                <div key={idx} className="mira-glass p-5 space-y-3.5 border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-white font-['Outfit'] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      {comp.competitor_name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-extrabold">
                        {comp.strategy_type || 'Reaction'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        comp.threat_severity === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        comp.threat_severity === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {comp.threat_severity} Threat
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-200 text-xs md:text-sm leading-relaxed font-normal">
                    {comp.predicted_action}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Expected: <strong className="text-slate-200">{comp.timeframe}</strong>
                    </span>
                    <span className="text-cyan-400 font-extrabold">
                      {comp.likelihood_pct}% Likelihood
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Audit Matrix (Risks, Opportunities, Assumptions, Unknowns) */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-amber-400" />
              Strategic Risk & Opportunity Audit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Downside Risks */}
              <div className="mira-glass p-4 space-y-2.5 border-rose-500/30">
                <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider block">Downside Risks</span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(audit.risks || []).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upside Opportunities */}
              <div className="mira-glass p-4 space-y-2.5 border-emerald-500/30">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block">Upside Opportunities</span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(audit.opportunities || []).map((o, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Assumptions */}
              <div className="mira-glass p-4 space-y-2.5 border-cyan-500/30">
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider block">Key Assumptions</span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(audit.key_assumptions || []).map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-300 font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unknown Variables */}
              <div className="mira-glass p-4 space-y-2.5 border-violet-500/30">
                <span className="text-xs font-extrabold text-violet-300 uppercase tracking-wider block">Unknown Variables</span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(audit.unknown_variables || []).map((u, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-violet-300 font-bold">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Tactical 3-Phase Counter-Offensive Playbook */}
          <div className="mira-glass p-6 space-y-5 border-emerald-500/30">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  3-Phase Counter-Offensive Executive Playbook
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Actionable roadmap divided into immediate, short-term, and long-term execution steps</p>
              </div>

              {/* Phase Switcher Tabs */}
              <div className="flex gap-2 bg-[#090C19] p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('immediate')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === 'immediate' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Immediate (0-7 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('short_term')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === 'short_term' 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Short Term (30 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('strategic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === 'strategic' 
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Strategic (90 Days)
                </button>
              </div>
            </div>

            {/* Playbook Items for Active Tab */}
            <div className="space-y-3">
              {(() => {
                const currentList = activeTab === 'immediate' 
                  ? (playbook.phase_1_immediate || []) 
                  : activeTab === 'short_term'
                  ? (playbook.phase_2_short_term || [])
                  : (playbook.phase_3_strategic || []);

                if (currentList.length === 0) {
                  return <p className="text-slate-400 text-xs italic py-4">No playbook actions defined for this phase.</p>;
                }

                return currentList.map((item, idx) => {
                  const actId = `playbook_${activeTab}_${idx}`;
                  const isChecked = checkedActions[actId];
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border transition-all ${
                        isChecked 
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                          : 'bg-[#0A0D1A] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!isChecked}
                          onChange={() => toggleActionCheck(actId)}
                          className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className={`font-extrabold text-sm md:text-base font-['Outfit'] ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                              {item.step || idx + 1}. {item.title || item.action}
                            </span>
                            
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold">
                                Owner: {item.owner || 'Team'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                Priority: {item.priority || 'High'}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                            {item.description || item.details}
                          </p>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-3">
                            <span>Impact: <strong className="text-emerald-400">{item.impact || 'High'}</strong></span>
                            <span>Effort: <strong className="text-cyan-300">{item.effort || 'Medium'}</strong></span>
                            <span>Dependencies: <strong className="text-slate-200">{item.dependencies || 'None'}</strong></span>
                            <span>Metric: <strong className="text-amber-300">{item.success_metric || 'N/A'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })();
              })()}
            </div>
          </div>

          {/* Alternative Strategic Pathways */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-cyan-400" />
              Alternative Strategic Response Pathways
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Aggressive */}
              <div className="mira-glass p-5 space-y-3 border-rose-500/30 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-rose-400 font-['Outfit']">
                      {alternatives.aggressive?.name || 'Aggressive Market Capture'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold">Aggressive</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alternatives.aggressive?.description}
                  </p>
                </div>
                <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                  <p><strong className="text-emerald-400">Pros:</strong> {alternatives.aggressive?.pros}</p>
                  <p><strong className="text-rose-400">Cons:</strong> {alternatives.aggressive?.cons}</p>
                </div>
              </div>

              {/* Balanced */}
              <div className="mira-glass p-5 space-y-3 border-cyan-500/30 flex flex-col justify-between bg-cyan-950/10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-cyan-300 font-['Outfit']">
                      {alternatives.balanced?.name || 'Balanced Value-Add Counter'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold">Recommended</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alternatives.balanced?.description}
                  </p>
                </div>
                <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                  <p><strong className="text-emerald-400">Pros:</strong> {alternatives.balanced?.pros}</p>
                  <p><strong className="text-rose-400">Cons:</strong> {alternatives.balanced?.cons}</p>
                </div>
              </div>

              {/* Defensive */}
              <div className="mira-glass p-5 space-y-3 border-slate-800 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-300 font-['Outfit']">
                      {alternatives.defensive?.name || 'Defensive Niche Focus'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">Defensive</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alternatives.defensive?.description}
                  </p>
                </div>
                <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                  <p><strong className="text-emerald-400">Pros:</strong> {alternatives.defensive?.pros}</p>
                  <p><strong className="text-rose-400">Cons:</strong> {alternatives.defensive?.cons}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
