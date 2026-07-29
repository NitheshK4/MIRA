import React from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Menu, 
  RefreshCw,
  Zap,
  FileText
} from 'lucide-react';

export default function TopBar({ 
  onOpenCommandPalette, 
  onAddClick, 
  onMobileMenuToggle, 
  unreadCount,
  onRefresh,
  activeTab,
  onOpenPdfModal
}) {
  const pageLabels = {
    dashboard: '⚡ Competitor Radar',
    feed:      '📡 Intelligence Stream',
    battlecards:'🛡️ Battlecards & Guard',
    warroom:   '⚔️ War Room Simulator',
    settings:  '⚙️  System Config',
    details:   '🔍 Competitor Detail',
    onboarding:'🚀 Setup Context',
  };

  return (
    <header className="top-bar-header">
      {/* Left: mobile toggle + page label */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <button 
          type="button"
          onClick={onMobileMenuToggle}
          className="mobile-only-btn"
          style={{
            padding:'7px',
            border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:'8px',
            background:'rgba(255,255,255,0.08)',
            cursor:'pointer',
            color:'#fff'
          }}
          aria-label="Toggle Menu"
        >
          <Menu size={17} color="#fff" />
        </button>

        <div className="top-bar-page-title">
          <div className="page-title-dot" />
          {pageLabels[activeTab] || 'Mira'}
        </div>
      </div>

      {/* Center: Search / Command Palette */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="top-bar-search"
        style={{ maxWidth: 380 }}
      >
        <Search size={14} color="#94A3B8" />
        <span className="top-bar-search-placeholder">
          Search competitors, alerts…
        </span>
        <kbd className="top-bar-search-kbd">⌘K</kbd>
      </button>

      {/* Right: Actions */}
      <div className="top-bar-right">
        {/* Export Executive PDF Briefing */}
        <button
          type="button"
          onClick={onOpenPdfModal}
          className="mira-btn border border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
          style={{ 
            padding: '6px 12px',
            fontSize: '12px',
            gap: '6px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(139, 92, 246, 0.12)'
          }}
          title="Export Executive PDF Briefing"
        >
          <FileText size={14} />
          <span className="hidden sm:inline font-bold">Export PDF</span>
        </button>

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          className="top-bar-icon-btn"
          title="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>

        {/* Alerts */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="top-bar-icon-btn"
          title="Alerts"
          style={{ position:'relative' }}
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Add Target */}
        <button
          type="button"
          onClick={onAddClick}
          className="mira-btn mira-btn-primary"
          style={{ 
            padding: '7px 14px',
            fontSize: '12px',
            gap: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Plus size={14} />
          <span>Add Target</span>
        </button>
      </div>
    </header>
  );
}
