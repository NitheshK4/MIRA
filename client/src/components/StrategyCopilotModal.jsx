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
  Zap
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
        <h4 key={idx} className="text-sm font-black text-violet-300 font-['Outfit'] mt-2 mb-1 flex items-center gap-1.5">
          {trimmed.replace('### ', '')}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-base font-black text-white font-['Outfit'] mt-3 mb-1">
          {trimmed.replace('## ', '')}
        </h3>
      );
    }
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.replace(/^[\*\-]\s*/, '');
      return (
        <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5 leading-relaxed">
          {formatInlineBold(content)}
        </li>
      );
    }
    return (
      <p key={idx} className="my-1 leading-relaxed text-slate-200">
        {formatInlineBold(trimmed)}
      </p>
    );
  });
}

function formatInlineBold(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
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
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/oracle/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newMessages.slice(-6)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get answer');
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', text: `⚠️ Error fetching response: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="oracle-modal-backdrop animate-fade-in">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="oracle-modal-panel overflow-hidden">
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-800/80 bg-[#0D101F] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 p-[1.5px] shadow-lg shadow-violet-500/20">
              <div className="w-full h-full bg-[#090A0F] rounded-[9px] flex items-center justify-center text-violet-400">
                <Brain className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white font-['Outfit']">MIRA Oracle</h2>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] uppercase font-black tracking-wider border border-violet-500/30">
                  AI CO-PILOT
                </span>
              </div>
              <p className="text-slate-400 text-[10px]">Real-time market context & competitive strategy co-pilot</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="p-3 border-b border-slate-800/60 bg-[#080A12] flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(prompt)}
              className="oracle-chip"
            >
              <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Stream Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0B0D17]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index} 
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                  isUser ? 'bg-violet-600 text-white font-bold' : 'bg-slate-800 text-sky-400 border border-slate-700'
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs relative group ${
                  isUser 
                    ? 'bg-violet-600/30 text-white border border-violet-500/40 rounded-tr-none' 
                    : 'bg-[#111628] text-slate-200 border border-slate-800/90 rounded-tl-none shadow-md'
                }`}>
                  <div className="text-xs space-y-1">
                    {renderFormattedMessage(msg.text)}
                  </div>

                  {!isUser && (
                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500">MIRA Telemetry</span>
                      <div className="flex items-center gap-3">
                        {onLaunchWarRoom && (
                          <button 
                            type="button"
                            onClick={() => {
                              onClose();
                              onLaunchWarRoom();
                            }}
                            className="hover:text-violet-300 font-bold flex items-center gap-1 transition-colors text-violet-400"
                          >
                            <Swords className="w-3 h-3" /> War Room
                          </button>
                        )}

                        <button 
                          type="button"
                          onClick={() => handleCopy(msg.text, index)}
                          className="hover:text-white font-bold flex items-center gap-1 transition-colors"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
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
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[#111628] border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span>Analyzing market context & competitor moves...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#0D101F]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-[#080A12] border border-slate-800 rounded-xl p-1.5 px-3 focus-within:border-violet-500/60 transition-colors"
          >
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none py-1.5"
              placeholder="Ask MIRA Oracle a strategic question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />

            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 disabled:opacity-30 transition-colors flex-shrink-0 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
