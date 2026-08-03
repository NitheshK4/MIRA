import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  X, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Swords, 
  Bot,
  User,
  Zap,
  Download,
  Share2,
  Target,
  TrendingUp,
  CheckSquare,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Plus
} from 'lucide-react';

const DEFAULT_QUICK_PROMPTS = [
  "Summarize competitor pricing shifts",
  "Where are competitors most vulnerable?",
  "Draft a winning sales counter-pitch",
  "What new product features launched recently?"
];

// Helper to format basic markdown text cleanly
function renderFormattedMessage(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2"></div>;

    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-base md:text-lg font-black text-[#00F0FF] font-['Outfit'] mt-3 mb-1.5 flex items-center gap-2">
          {trimmed.replace('### ', '')}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-lg md:text-xl font-black text-white font-['Outfit'] mt-4 mb-2">
          {trimmed.replace('## ', '')}
        </h3>
      );
    }
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.replace(/^[\*\-]\s*/, '');
      return (
        <li key={idx} className="ml-4 list-disc text-sm md:text-base text-slate-200 my-1.5 leading-relaxed font-normal">
          {formatInlineBold(content)}
        </li>
      );
    }
    return (
      <p key={idx} className="my-1.5 text-sm md:text-base leading-relaxed text-slate-100 font-normal">
        {formatInlineBold(trimmed)}
      </p>
    );
  });
}

function formatInlineBold(text) {
  const parts = text.split(/(\*\*.*?\**)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function StrategyCopilotModal({ isOpen, onClose, onLaunchWarRoom }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '### 🔮 Welcome to MIRA Oracle Strategy Co-Pilot\n\nI am your live decision-support assistant. I analyze competitor signals, corporate goals, and market telemetry to generate real-time action plans and scenario analyses.',
      structured: {
        action_plan: [
          {
            title: "Align Sales Counter-Pitch against Competitor Updates",
            priority: "High",
            impact: 9,
            effort: "Low",
            timeline: "1-2 weeks",
            rationale: "Immediate account retention against prospect objections."
          }
        ],
        scenario_matrix: [],
        missing_context_questions: ["What is your target win-rate threshold for Q3?"],
        suggested_refinements: [
          "Summarize competitor pricing shifts",
          "Where are competitors most vulnerable?",
          "Draft a winning sales counter-pitch"
        ]
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [memoCopied, setMemoCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [checkedTasks, setCheckedTasks] = useState({});

  // Context & Goals state
  const [showConfig, setShowConfig] = useState(false);
  const [oracleContext, setOracleContext] = useState({
    goals: ['Scale market share & win key competitive accounts'],
    kpis: ['Win Rate > 45%', 'CAC Payback < 12 mos'],
    constraints: '',
    target_audience: '',
    strategic_focus: ''
  });
  const [newGoal, setNewGoal] = useState('');
  const [newKpi, setNewKpi] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchOracleContext();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, showConfig]);

  const fetchOracleContext = async () => {
    try {
      const res = await fetch('/api/oracle/context');
      if (res.ok) {
        const data = await res.json();
        const goals = typeof data.goals === 'string' ? JSON.parse(data.goals || '[]') : (data.goals || []);
        const kpis = typeof data.kpis === 'string' ? JSON.parse(data.kpis || '[]') : (data.kpis || []);
        setOracleContext({
          ...data,
          goals: goals.length > 0 ? goals : ['Scale market share & win key competitive accounts'],
          kpis: kpis.length > 0 ? kpis : ['Win Rate > 45%', 'CAC Payback < 12 mos']
        });
      }
    } catch (e) {
      console.warn('Failed to load Oracle context:', e.message);
    }
  };

  const saveOracleContext = async (updatedContext) => {
    try {
      await fetch('/api/oracle/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContext)
      });
      setOracleContext(updatedContext);
    } catch (e) {
      console.error('Failed to save Oracle context:', e.message);
    }
  };

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch('/api/oracle/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history, sessionId })
      });
      const data = await res.json();

      const assistantMsg = {
        role: 'assistant',
        text: data.reply || data.response || 'No response returned.',
        messageId: data.messageId,
        structured: data.structured || {
          action_plan: data.action_plan || [],
          scenario_matrix: data.scenario_matrix || [],
          missing_context_questions: data.missing_context_questions || [],
          suggested_refinements: data.suggested_refinements || []
        }
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        text: '⚠️ Connection error. Please ensure backend server is running.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgIndex, messageId, rating) => {
    if (!messageId) return;
    setFeedbackGiven(prev => ({ ...prev, [msgIndex]: rating }));
    try {
      await fetch('/api/oracle/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating })
      });
    } catch (e) {
      console.warn('Failed to submit feedback:', e.message);
    }
  };

  const toggleTaskCheck = (taskId) => {
    setCheckedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyMemoSlack = () => {
    const fullText = messages.map((m) => `${m.role === 'user' ? 'User' : 'MIRA Oracle'}: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setMemoCopied(true);
    setTimeout(() => setMemoCopied(false), 2000);
  };

  const handleExportMemo = () => {
    let fullText = `# MIRA Executive Strategy Briefing\n\n`;
    fullText += `**Workspace Goals**: ${oracleContext.goals.join(', ')}\n`;
    fullText += `**Target KPIs**: ${oracleContext.kpis.join(', ')}\n\n`;
    fullText += messages.map((m) => `## ${m.role === 'user' ? 'User' : 'MIRA Oracle'}\n${m.text}`).join('\n\n');
    
    const blob = new Blob([fullText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MIRA-Executive-Strategy-Brief-${Date.now()}.md`;
    a.click();
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const updated = { ...oracleContext, goals: [...oracleContext.goals, newGoal.trim()] };
    saveOracleContext(updated);
    setNewGoal('');
  };

  const removeGoal = (idx) => {
    const updated = { ...oracleContext, goals: oracleContext.goals.filter((_, i) => i !== idx) };
    saveOracleContext(updated);
  };

  const addKpi = () => {
    if (!newKpi.trim()) return;
    const updated = { ...oracleContext, kpis: [...oracleContext.kpis, newKpi.trim()] };
    saveOracleContext(updated);
    setNewKpi('');
  };

  const removeKpi = (idx) => {
    const updated = { ...oracleContext, kpis: oracleContext.kpis.filter((_, i) => i !== idx) };
    saveOracleContext(updated);
  };

  return (
    <div className="oracle-modal-backdrop animate-fade-in">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel Container */}
      <div className="oracle-modal-panel overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="p-5 px-6 border-b border-slate-800/80 bg-[#0D101F] flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center text-cyan-400">
                <Brain className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white font-['Outfit'] tracking-tight">MIRA Oracle</h2>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black tracking-wider border border-cyan-500/40 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" /> AI STRATEGIST
                </span>
              </div>
              <p className="text-slate-300 text-xs md:text-sm font-semibold mt-0.5">Proactive Decision-Support Assistant & Action Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`px-3 py-2 rounded-xl border text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm ${
                showConfig 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Configure Active Corporate Goals & KPIs"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Goals & Memory</span>
            </button>

            <button 
              type="button"
              onClick={handleCopyMemoSlack}
              className="px-3 py-2 rounded-xl bg-violet-600/25 border border-violet-500/50 text-violet-200 hover:bg-violet-600/40 text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap"
              title="Copy formatted Executive Strategy Briefing"
            >
              {memoCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{memoCopied ? 'Copied Brief' : 'Copy Slack Brief'}</span>
            </button>

            <button 
              type="button"
              onClick={handleExportMemo}
              className="px-3 py-2 rounded-xl bg-sky-600/25 border border-sky-500/50 text-sky-200 hover:bg-sky-600/40 text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap"
              title="Download Executive Strategy Brief as Markdown (.md)"
            >
              <Download className="w-4 h-4" />
              <span>Export Memo</span>
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="crossmark-btn w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 transition-all ml-1 flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Goals & KPI Context Summary Bar */}
        <div className="p-3 px-6 border-b border-slate-800/60 bg-[#080B15] flex items-center justify-between gap-4 overflow-x-auto text-xs">
          <div className="flex items-center gap-4 min-w-max">
            <div className="flex items-center gap-2 text-cyan-300 font-extrabold">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Goals:</span>
              <span className="text-slate-200 font-medium">{oracleContext.goals[0] || 'Scale market share'}</span>
              {oracleContext.goals.length > 1 && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold">
                  +{oracleContext.goals.length - 1} more
                </span>
              )}
            </div>

            <div className="h-3 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-2 text-violet-300 font-extrabold">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span>Target KPIs:</span>
              <span className="text-slate-200 font-medium">{oracleContext.kpis.join(' • ')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-cyan-400 hover:underline font-bold text-[11px] min-w-max"
          >
            {showConfig ? 'Close Context Config' : 'Edit Context'}
          </button>
        </div>

        {/* Strategic Memory & Goals Configuration Drawer */}
        {showConfig && (
          <div className="p-5 bg-[#0F1426] border-b border-cyan-500/30 text-xs md:text-sm animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base font-['Outfit'] flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Strategic Context Memory & Corporate Goals
              </h3>
              <span className="text-slate-400 text-xs">Persisted per workspace</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Goals Column */}
              <div className="bg-[#090C19] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <label className="font-bold text-cyan-300 block">Corporate Strategic Goals</label>
                <div className="space-y-1.5">
                  {oracleContext.goals.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-200">
                      <span>• {g}</span>
                      <button onClick={() => removeGoal(idx)} className="text-rose-400 hover:text-rose-300 ml-2 font-bold">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add strategic goal..."
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button onClick={addGoal} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold hover:bg-cyan-500/30">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* KPIs Column */}
              <div className="bg-[#090C19] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <label className="font-bold text-violet-300 block">Target KPIs & Metrics</label>
                <div className="space-y-1.5">
                  {oracleContext.kpis.map((k, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-200">
                      <span>• {k}</span>
                      <button onClick={() => removeKpi(idx)} className="text-rose-400 hover:text-rose-300 ml-2 font-bold">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add KPI target..."
                    value={newKpi}
                    onChange={(e) => setNewKpi(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
                  />
                  <button onClick={addKpi} className="px-3 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/40 rounded-lg font-bold hover:bg-violet-500/30">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Chips */}
        <div className="p-3.5 border-b border-slate-800/60 bg-[#080A12] flex gap-2.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {DEFAULT_QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(prompt)}
              className="oracle-chip"
            >
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Stream Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0B0D17]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const struct = msg.structured || {};
            const actionPlan = struct.action_plan || [];
            const scenarioMatrix = struct.scenario_matrix || [];
            const missingQuestions = struct.missing_context_questions || [];
            const refinementActions = struct.suggested_refinements || [];

            return (
              <div 
                key={index} 
                className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                  isUser ? 'bg-violet-600 text-white font-bold' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4.5 h-4.5" />}
                </div>

                <div className={`max-w-[92%] md:max-w-[88%] rounded-2xl p-5 text-sm md:text-base relative group space-y-4 ${
                  isUser 
                    ? 'bg-violet-600/35 text-white border border-violet-500/50 rounded-tr-none' 
                    : 'bg-[#111628] text-slate-100 border border-slate-800/90 rounded-tl-none shadow-lg'
                }`}>
                  {/* Text Content */}
                  <div className="text-sm md:text-base space-y-1.5 leading-relaxed">
                    {renderFormattedMessage(msg.text)}
                  </div>

                  {/* STRUCTURED WIDGET 1: Goal-Based Action Plan Board */}
                  {!isUser && actionPlan.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-cyan-300 tracking-wider uppercase flex items-center gap-1.5 font-['Outfit']">
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                          Recommended Strategic Action Plan
                        </h5>
                        <span className="text-[10px] text-slate-400 font-bold">{actionPlan.length} High-Impact Actions</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {actionPlan.map((action, aIdx) => {
                          const taskId = `task_${index}_${aIdx}`;
                          const isChecked = checkedTasks[taskId];
                          const priorityColor = action.priority === 'High' 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                            : action.priority === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                          return (
                            <div 
                              key={aIdx} 
                              className={`p-3 rounded-xl border transition-all ${
                                isChecked 
                                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                                  : 'bg-[#0A0D1A] border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={!!isChecked}
                                  onChange={() => toggleTaskCheck(taskId)}
                                  className="mt-1 accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className={`font-extrabold text-sm ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                                      {action.title}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${priorityColor}`}>
                                        {action.priority} Priority
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                        Impact: {action.impact}/10
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px]">
                                        {action.timeline}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                    {action.rationale}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STRUCTURED WIDGET 2: Scenario Analysis Matrix */}
                  {!isUser && scenarioMatrix.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-violet-300 tracking-wider uppercase flex items-center gap-1.5 font-['Outfit']">
                          <ShieldAlert className="w-4 h-4 text-violet-400" />
                          Strategic Scenario & Risk Analysis
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scenarioMatrix.map((sc, sIdx) => (
                          <div key={sIdx} className="p-3.5 rounded-xl bg-[#090C19] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sm text-cyan-300 font-['Outfit']">{sc.scenario}</span>
                              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                Risk Score: {sc.risk_score}/10
                              </span>
                            </div>
                            <div className="text-xs space-y-1 text-slate-300">
                              <p><strong className="text-rose-400">Risk:</strong> {sc.risks}</p>
                              <p><strong className="text-emerald-400">Opportunity:</strong> {sc.opportunities}</p>
                              <p><strong className="text-violet-300">Alternative:</strong> {sc.alternatives}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STRUCTURED WIDGET 3: Focused Follow-Up Questions (Missing Context) */}
                  {!isUser && missingQuestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>Focused Follow-Up Questions to Sharpen Rationale:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {missingQuestions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => handleSendMessage(q)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 hover:bg-amber-500/20 text-left transition-colors flex items-center gap-1.5 font-medium"
                          >
                            <span>{q}</span>
                            <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adaptive Refinement Actions */}
                  {!isUser && refinementActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                      {refinementActions.map((refine, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => handleSendMessage(refine)}
                          className="text-xs px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5 font-semibold"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>{refine}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer Telemetry & Actions */}
                  {!isUser && (
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-bold text-slate-400">
                        <span>MIRA Telemetry</span>
                        
                        {/* Rating Feedback */}
                        <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
                          <button
                            type="button"
                            onClick={() => handleFeedback(index, msg.messageId, 1)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              feedbackGiven[index] === 1 ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-emerald-300'
                            }`}
                            title="Helpful strategic recommendation"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(index, msg.messageId, -1)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              feedbackGiven[index] === -1 ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-300'
                            }`}
                            title="Needs improvement"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {onLaunchWarRoom && (
                          <button 
                            type="button"
                            onClick={() => {
                              onClose();
                              onLaunchWarRoom();
                            }}
                            className="hover:text-violet-300 font-extrabold flex items-center gap-1.5 transition-colors text-violet-400 text-xs"
                          >
                            <Swords className="w-3.5 h-3.5" /> War Room
                          </button>
                        )}

                        <button 
                          type="button"
                          onClick={() => handleCopy(msg.text, index)}
                          className="hover:text-white font-extrabold flex items-center gap-1.5 transition-colors text-xs text-slate-300"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Text
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-[#111628] border border-slate-700/80 rounded-2xl rounded-tl-none p-5 text-sm text-slate-200 flex items-center gap-3 font-semibold">
                <Sparkles className="w-4 h-4 text-[#FFD166] animate-spin" />
                <span>Evaluating corporate goals, market signals & strategic action plan...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Bar */}
        <div className="p-4 px-6 border-t border-slate-800/80 bg-[#0A0E1A]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3 bg-[#12182B] border border-slate-700/80 rounded-2xl p-2.5 px-4 focus-within:border-cyan-400 transition-colors shadow-inner"
          >
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none text-sm md:text-base text-white placeholder-slate-400 focus:outline-none py-1 font-semibold"
              placeholder="Ask MIRA Oracle a strategic decision inquiry..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />

            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all flex-shrink-0 shadow-md"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
