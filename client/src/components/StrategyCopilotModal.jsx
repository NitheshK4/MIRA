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
  FileText,
  Download,
  Share2
} from 'lucide-react';

const QUICK_PROMPTS = [
  "Summarize competitor pricing shifts",
  "Where are competitors most vulnerable?",
  "Draft a winning sales counter-pitch",
  "What new product features launched recently?"
];

// Simple helper to format basic markdown text cleanly
function renderFormattedMessage(text) {
  if (!text) return null;

  // Split lines and format headers / bullet points
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
      text: '### 🔮 Welcome to MIRA Oracle Strategy Co-Pilot\n\nI am your live competitive intelligence co-pilot. Ask me anything about your competitors, pricing moves, market vulnerabilities, or sales battlecard scripts.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [memoCopied, setMemoCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/oracle/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || data.response || 'No response returned.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: '⚠️ Connection error. Please ensure server is running.' }]);
    } finally {
      setLoading(false);
    }
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
    const fullText = `# MIRA Oracle Strategy Briefing\n\n` + messages.map((m) => `## ${m.role === 'user' ? 'User' : 'MIRA Oracle'}\n${m.text}`).join('\n\n');
    const blob = new Blob([fullText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MIRA-Strategy-Brief-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="oracle-modal-backdrop animate-fade-in">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="oracle-modal-panel overflow-hidden">
        {/* Header */}
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
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black tracking-wider border border-cyan-500/40">
                  AI CO-PILOT
                </span>
              </div>
              <p className="text-slate-300 text-xs md:text-sm font-semibold mt-0.5">Real-time market context & competitive strategy co-pilot</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={handleCopyMemoSlack}
              className="px-3.5 py-2 rounded-xl bg-violet-600/25 border border-violet-500/50 text-violet-200 hover:bg-violet-600/40 text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap"
              title="Copy formatted 1-Page Executive Briefing for Slack or Email"
            >
              {memoCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{memoCopied ? 'Copied Brief' : 'Copy Slack Memo'}</span>
            </button>

            <button 
              type="button"
              onClick={handleExportMemo}
              className="px-3.5 py-2 rounded-xl bg-sky-600/25 border border-sky-500/50 text-sky-200 hover:bg-sky-600/40 text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap"
              title="Download Executive Strategy Brief as Markdown (.md)"
            >
              <Download className="w-4 h-4" />
              <span>Export Memo (.md)</span>
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-colors ml-1 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="p-3.5 border-b border-slate-800/60 bg-[#080A12] flex gap-2.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {QUICK_PROMPTS.map((prompt, idx) => (
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
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#0B0D17]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
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

                <div className={`max-w-[88%] rounded-2xl p-5 text-sm md:text-base relative group ${
                  isUser 
                    ? 'bg-violet-600/35 text-white border border-violet-500/50 rounded-tr-none' 
                    : 'bg-[#111628] text-slate-100 border border-slate-800/90 rounded-tl-none shadow-lg'
                }`}>
                  <div className="text-sm md:text-base space-y-1.5 leading-relaxed">
                    {renderFormattedMessage(msg.text)}
                  </div>

                  {!isUser && (
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-slate-400">MIRA Telemetry</span>
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
                          className="hover:text-white font-extrabold flex items-center gap-1.5 transition-colors text-xs"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
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
                <span>Analyzing market context & competitor moves...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
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
              placeholder="Ask MIRA Oracle a strategic question..."
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
