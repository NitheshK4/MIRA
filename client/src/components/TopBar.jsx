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
          onClick={onMobileMenuToggle}
          className="mobile-only-btn"
          style={{
            padding:'7px',
            border:'2px solid #fff',
            borderRadius:'6px',
            background:'rgba(255,255,255,0.15)',
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
        onClick={onOpenCommandPalette}
        className="top-bar-search"
        style={{ maxWidth: 380 }}
      >
        <Search size={14} color="#888" />
        <span className="top-bar-search-placeholder">
          Search competitors, alerts…
        </span>
        <kbd className="top-bar-search-kbd">⌘K</kbd>
      </button>

      {/* Right: Actions */}
      <div className="top-bar-right">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="top-bar-icon-btn"
          title="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>

        {/* Alerts */}
        <button
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
