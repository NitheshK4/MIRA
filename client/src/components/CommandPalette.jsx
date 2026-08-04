import React, { useState, useEffect } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Activity, 
  Settings, 
  Plus, 
  RefreshCw, 
  Globe, 
  X, 
  ArrowRight,
  Sparkles,
  Terminal,
  Code2
} from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  competitors = [], 
  onNavigateTab, 
  onAddClick, 
  onViewDetails,
  onRefresh
}) {
  const [query, setQuery] = useState('');

  // Keyboard shortcut binding (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open command palette
          onClose(); // reset state if needed
          window.dispatchEvent(new CustomEvent('open-command-palette'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCompetitors = competitors.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.url.toLowerCase().includes(query.toLowerCase())
  );

  const quickActions = [
    {
      id: 'add-comp',
      title: 'Add New Competitor URL',
      subtitle: 'Track a new competitor page or pricing section',
      icon: Plus,
      action: () => { onClose(); onAddClick(); }
    },
    {
      id: 'nav-dash',
      title: 'Go to Monitored Competitors Dashboard',
      subtitle: 'View all active scans and competitor grid',
      icon: LayoutDashboard,
      action: () => { onClose(); onNavigateTab('dashboard'); }
    },
    {
      id: 'nav-feed',
      title: 'Open Intelligence Stream Feed',
      subtitle: 'Explore recent alerts and business impact scores',
      icon: Activity,
      action: () => { onClose(); onNavigateTab('feed'); }
    },
    {
      id: 'nav-warroom',
      title: 'Open Competitive War Room ⚔️',
      subtitle: 'Simulate market moves and predicted competitor reactions',
      icon: LayoutDashboard,
      action: () => { onClose(); onNavigateTab('warroom'); }
    },
    {
      id: 'nav-integrations',
      title: 'Open Developer SDKs & Integrations 💻',
      subtitle: 'Access Node.js, Python, Go, and PHP code examples & API keys',
      icon: Terminal,
      action: () => { onClose(); onNavigateTab('integrations'); }
    },
    {
      id: 'nav-[#07090E]',
      title: 'Open System Settings',
      subtitle: 'Manage Chrome Extension API Key, SMTP, and CRM integration',
      icon: Settings,
      action: () => { onClose(); onNavigateTab('settings'); }
    },
    {
      id: 'action-refresh',
      title: 'Refresh Workspace Data',
      subtitle: 'Reload latest scrapes and feed updates',
      icon: RefreshCw,
      action: () => { onClose(); onRefresh(); }
    }
  ].filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.subtitle.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mira-modal-backdrop" onClick={onClose}>
      <div 
        className="modal-panel animate-in fade-in zoom-in-95 duration-200 max-w-3xl border-2 border-violet-500/50 shadow-[0_0_60px_rgba(139,92,246,0.3)] rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-6 py-5 border-b border-black/30 gap-4 bg-[var(--surface-recessed)] shadow-[var(--clay-inset-shadow)]">
          <Search className="w-7 h-7 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-lg sm:text-xl focus:outline-none font-semibold py-2"
            placeholder="Type a command or search competitor name/url..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button 
            onClick={onClose}
            className="crossmark-btn p-2 text-slate-400 hover:text-white rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[460px] overflow-y-auto p-4 space-y-5">
          {/* Competitor Search Results */}
          {filteredCompetitors.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Competitors ({filteredCompetitors.length})
              </div>
              <div className="space-y-2 mt-2">
                {filteredCompetitors.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onClose();
                      onViewDetails(comp.id);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-cyan-500/15 hover:border-cyan-500/30 border border-transparent text-left group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-100 group-hover:text-cyan-300">
                          {comp.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-sm font-mono mt-0.5">
                          {comp.url}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map(act => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={act.action}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {act.subtitle}
                          </div>
                        </div>
                      </div>
                      <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-500 bg-white/5 rounded border border-white/10">
                        ↵
                      </kbd>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredCompetitors.length === 0 && quickActions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              No matching commands or competitors found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with 🡡 🡣</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
