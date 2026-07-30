import React from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Menu, 
  RefreshCw,
  Zap
} from 'lucide-react';

export default function TopBar({ 
  onOpenCommandPalette, 
  onAddClick, 
  onMobileMenuToggle, 
  unreadCount,
  onRefresh,
  isRefreshing,
  activeTab 
}) {
  const pageLabels = {
    dashboard: '⚡ Competitor Radar',
    feed:      '📡 Intelligence Stream',
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
        <Search size={14} color="#3D6B78" />
        <span className="top-bar-search-placeholder">
          Search competitors, alerts…
        </span>
        <kbd className="top-bar-search-kbd">⌘K</kbd>
      </button>

      {/* Right: Actions */}
      <div className="top-bar-right">
        {/* Refresh */}
        <button
          type="button"
          onClick={(e) => {
            if (e.shiftKey) {
              window.location.reload();
            } else {
              onRefresh && onRefresh();
            }
          }}
          onDoubleClick={() => window.location.reload()}
          className="top-bar-icon-btn group relative"
          title="Click to Refresh Data (Double-click or Shift-click for Full Page Reload)"
          disabled={isRefreshing}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-violet-400' : 'group-hover:rotate-180 transition-transform duration-500'} />
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
