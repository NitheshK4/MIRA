import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Settings as SettingsIcon, 
  Layers, 
  Copy, 
  Check, 
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  workspaceId, 
  profile, 
  isOpen, 
  onClose,
  unreadCount 
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyWorkspace = () => {
    const url = `${window.location.origin}${window.location.pathname}?w=${workspaceId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      activeClass: 'active-dashboard',
    },
    { 
      id: 'feed', 
      label: 'Intel Stream', 
      icon: Activity, 
      badge: unreadCount > 0 ? unreadCount : null,
      activeClass: 'active-feed',
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: SettingsIcon,
      activeClass: 'active-settings',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.60)', zIndex:40 }}
          className="mobile-only-btn"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className="sidebar-drawer" style={isOpen ? { display:'flex' } : {}}>
        {/* TOP: Brand + Nav */}
        <div>
          {/* Brand */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div
              onClick={() => setActiveTab('dashboard')}
              className="sidebar-brand"
              style={{ flex:1 }}
            >
              <div>
                <div className="sidebar-brand-name">MIRA</div>
                <div className="sidebar-brand-sub">Intelligence Layer</div>
              </div>
            </div>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onClose}
              className="mobile-only-btn"
              style={{
                padding: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                cursor: 'pointer',
                color: '#fff',
                marginLeft: '8px',
                flexShrink: 0
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="nav-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`nav-item ${isActive ? item.activeClass : ''}`}
                >
                  <div className="nav-item-icon">
                    <Icon size={15} />
                  </div>
                  <span style={{ flex:1 }}>{item.label}</span>

                  {item.badge ? (
                    <span className="nav-item-badge">{item.badge}</span>
                  ) : isActive ? (
                    <ChevronRight size={13} style={{ opacity: 0.6 }} />
                  ) : null}
                </button>
              );
            })}

            {activeTab === 'details' && (
              <div style={{ paddingTop: '8px' }}>
                <button 
                  type="button" 
                  className="nav-item active-settings"
                  onClick={() => setActiveTab('details')}
                >
                  <div className="nav-item-icon">
                    <Layers size={15} />
                  </div>
                  <span style={{ flex:1, color: 'inherit' }}>Competitor Detail</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* BOTTOM: Workspace + Profile */}
        <div className="sidebar-bottom">
          {/* Workspace box */}
          <div className="workspace-box">
            <div className="workspace-box-title">
              <Layers size={11} />
              Session Context
              <button
                onClick={handleCopyWorkspace}
                style={{
                  marginLeft:'auto',
                  display:'flex', alignItems:'center', gap:'4px',
                  background: 'rgba(6,182,212,0.15)',
                  border: '1px solid rgba(6,182,212,0.35)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  color: '#38BDF8',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform:'uppercase',
                  letterSpacing: '0.05em'
                }}
                title="Copy Workspace Session URL"
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="workspace-id">{workspaceId}</div>
          </div>

          {/* Profile */}
          <div className="profile-card">
            <div className="profile-avatar">
              {profile?.business_name ? profile.business_name.substring(0, 2).toUpperCase() : 'MI'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="profile-name truncate">
                {profile?.business_name || 'Mira Workspace'}
              </div>
              <div className="profile-status">
                <div className="status-dot" />
                <ShieldCheck size={11} />
                LLM Active
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
