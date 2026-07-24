import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Activity, 
  ShieldAlert, 
  Target, 
  Zap, 
  Layers, 
  Settings, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  TrendingUp, 
  Eye, 
  Image, 
  FileText, 
  Swords, 
  ArrowLeft,
  Trash2,
  Pause,
  Play,
  Sparkles
} from 'lucide-react';

// Extract or generate Workspace ID per tab session
const getWorkspaceId = () => {
  const params = new URLSearchParams(window.location.search);
  let w = params.get('w');
  if (!w) {
    w = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    params.set('w', w);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
  return w;
};

const workspaceId = getWorkspaceId();

// Intercept window.fetch to automatically append x-workspace-id header to all API requests
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith('api/'))) {
    options.headers = {
      ...options.headers,
      'x-workspace-id': workspaceId
    };
  }
  return originalFetch(url, options);
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'feed', 'settings', 'details', 'onboarding'
  const [onboarded, setOnboarded] = useState(true);
  const [profile, setProfile] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [feedCards, setFeedCards] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedCompId, setSelectedCompId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals / Detail Drawers State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDiffText, setActiveDiffText] = useState(null);
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState(null);

  // Fetch all initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check onboarding profile first
      const profileRes = await fetch('/api/profile');
      if (!profileRes.ok) {
        throw new Error('Failed to load profile from server');
      }
      const profileData = await profileRes.json();
      
      // If profileData has an error property from the backend
      if (profileData && profileData.error) {
        throw new Error(profileData.error);
      }
      
      setProfile(profileData);
      
      if (!profileData) {
        setOnboarded(false);
        setActiveTab('onboarding');
      } else {
        setOnboarded(true);
        // Load settings and competitors
        const settingsRes = await fetch('/api/settings');
        if (!settingsRes.ok) {
          throw new Error('Failed to load settings from server');
        }
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        await refreshCompetitors();
        await refreshFeed();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend server. Ensure it is running.');
    } finally {
      setLoading(false);
    }
  };

  const refreshCompetitors = async () => {
    try {
      const res = await fetch('/api/competitors');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCompetitors(data);
      } else {
        console.error('Competitors data is not an array:', data);
      }
    } catch (e) {
      console.error('Failed to reload competitors:', e);
    }
  };

  const refreshFeed = async () => {
    try {
      const res = await fetch('/api/intelligence');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFeedCards(data);
      } else {
        console.error('Feed data is not an array:', data);
      }
    } catch (e) {
      console.error('Failed to reload intelligence feed:', e);
    }
  };

  // Operations
  const handleOnboardingSubmit = async (profileForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }
      const data = await res.json();
      setProfile(data);
      setOnboarded(true);
      
      // Load initial settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      
      setActiveTab('dashboard');
      refreshCompetitors();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async (compForm) => {
    setError(null);
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add competitor');
      }
      setIsAddModalOpen(false);
      await refreshCompetitors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePauseResume = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'paused' ? 'active' : 'paused';
    try {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await refreshCompetitors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCompetitor = async (id) => {
    if (!confirm('Are you sure you want to delete this competitor and all its change logs?')) return;
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedCompId === id) {
        setActiveTab('dashboard');
        setSelectedCompId(null);
      }
      await refreshCompetitors();
      await refreshFeed();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCheckNow = async (id) => {
    try {
      const res = await fetch(`/api/competitors/${id}/check`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start scrape check');
      
      // Flash a quick notice
      alert('A scrape job has been added to the background queue. It will complete in 15-30 seconds.');
      
      // Set to checking status locally
      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));
      
      // Auto refresh list and feed after 15 seconds
      setTimeout(async () => {
        await refreshCompetitors();
        await refreshFeed();
      }, 15000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (formSettings) => {
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSettings)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }
      alert('Settings saved successfully.');
      // Reload settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTestEmail = async (emailConfig) => {
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_config: emailConfig })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRetryCrm = async (cardId) => {
    try {
      const res = await fetch(`/api/intelligence/${cardId}/retry`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sync failed.');
      }
      alert('Sync successful!');
      await refreshFeed();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!confirm('Warning: Any loaded Chrome extension will need to be updated with this new key. Regenerate?')) return;
    const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await handleSaveSettings({ ...settings, api_key: newKey });
  };

  const navigateToDetails = (compId) => {
    setSelectedCompId(compId);
    setActiveTab('details');
  };

  return (
    <div>
      {/* Top Sticky Header Navbar */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => onboarded && setActiveTab('dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--cta-gradient)', padding: '8px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(244, 162, 97, 0.35)' }}>
            <Bot size={22} color="#2D2A26" />
          </div>
          <span style={{ color: '#2D2A26', fontWeight: '800' }}>MIRA Engine</span>
        </div>
        {onboarded && (
          <nav className="nav-links">
            <div className="workspace-indicator" style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Workspace:</span>
              <code style={{ background: '#FFF8EE', border: '1px solid #F2E7D8', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', color: '#D97706', fontWeight: 'bold' }}>{workspaceId}</code>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <Activity size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Dashboard
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
              <Zap size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Intelligence Feed
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Settings
            </motion.button>
            {activeTab === 'details' && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className="nav-link active">
                <FileText size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Detail
              </motion.button>
            )}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="app-container">
        {loading && activeTab !== 'onboarding' ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading application data...</p>
          </div>
        ) : error ? (
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-danger)', marginBottom: '30px' }}>
            <h3 style={{ color: 'var(--color-danger)' }}>Error Encountered</h3>
            <p>{error}</p>
            <button className="btn" style={{ marginTop: '15px' }} onClick={fetchInitialData}>Retry Connection</button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'onboarding' && (
                <OnboardingPage onSubmit={handleOnboardingSubmit} initialProfile={profile} />
              )}
              
              {activeTab === 'dashboard' && (
                <DashboardPage 
                  competitors={competitors}
                  feedCards={feedCards}
                  onAddClick={() => setIsAddModalOpen(true)}
                  onCheckNow={handleCheckNow}
                  onPauseResume={handlePauseResume}
                  onDelete={handleDeleteCompetitor}
                  onViewDetails={navigateToDetails}
                />
              )}
              
              {activeTab === 'feed' && (
                <FeedPage 
                  cards={feedCards}
                  competitors={competitors}
                  onRetryCrm={handleRetryCrm}
                  onViewDiff={(diff) => setActiveDiffText(diff)}
                  onViewScreenshot={(url) => setActiveScreenshotUrl(url)}
                  onRefreshFeed={refreshFeed}
                />
              )}
              
              {activeTab === 'details' && (
                <DetailsPage 
                  competitorId={selectedCompId}
                  competitors={competitors}
                  onBack={() => { setActiveTab('dashboard'); setSelectedCompId(null); }}
                  onDelete={handleDeleteCompetitor}
                  onCheckNow={handleCheckNow}
                  onUpdateCompetitor={refreshCompetitors}
                />
              )}
              
              {activeTab === 'settings' && (
                <SettingsPage 
                  settings={settings}
                  profile={profile}
                  feedCards={feedCards}
                  onSaveSettings={handleSaveSettings}
                  onTestEmail={handleTestEmail}
                  onRetryCrm={handleRetryCrm}
                  onRegenerateKey={handleRegenerateApiKey}
                  onUpdateProfile={handleOnboardingSubmit}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Add Competitor Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddCompetitorModal 
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddCompetitor}
          />
        )}
      </AnimatePresence>

      {/* Diff Text Modal */}
      <AnimatePresence>
        {activeDiffText !== null && (
          <DiffModal 
            diffText={activeDiffText}
            onClose={() => setActiveDiffText(null)}
          />
        )}
      </AnimatePresence>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {activeScreenshotUrl && (
          <ScreenshotModal 
            url={activeScreenshotUrl}
            onClose={() => setActiveScreenshotUrl(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: ONBOARDING FLOW
// ----------------------------------------------------
function OnboardingPage({ onSubmit, initialProfile }) {
  const [form, setForm] = useState({
    business_name: initialProfile?.business_name || '',
    product_desc: initialProfile?.product_desc || '',
    customers: initialProfile?.customers || '',
    price_point: initialProfile?.price_point || '',
    features_list: initialProfile?.features_list || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="glass-panel onboarding-container">
      <div className="onboarding-intro">
        <div className="onboarding-logo">🧠</div>
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Welcome to Competitor Intel</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          To calculate the <strong>business impact score (1-10)</strong> of competitor changes, our local LLM needs some context about your own business.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Your Business Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={form.business_name}
            onChange={e => setForm({ ...form, business_name: e.target.value })}
            placeholder="E.g., InboxFlow"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">What your product does</label>
          <textarea 
            className="form-input" 
            rows="3"
            value={form.product_desc}
            onChange={e => setForm({ ...form, product_desc: e.target.value })}
            placeholder="E.g., We provide automated email marketing and cold outbound services optimized with AI agent writing."
            required
          ></textarea>
          <div className="form-help">Provide a descriptive explanation. The LLM relies heavily on this to detect direct feature overlaps.</div>
        </div>

        <div className="form-group">
          <label className="form-label">Who your target customers are</label>
          <input 
            type="text" 
            className="form-input" 
            value={form.customers}
            onChange={e => setForm({ ...form, customers: e.target.value })}
            placeholder="E.g., E-commerce brands, marketing agencies, and mid-sized sales teams."
            required
          />
          <div className="form-help">Used to score competitor shifts in pricing, marketing messaging, or segment targets.</div>
        </div>

        <div className="form-group">
          <label className="form-label">Your pricing structure / price point</label>
          <input 
            type="text" 
            className="form-input" 
            value={form.price_point}
            onChange={e => setForm({ ...form, price_point: e.target.value })}
            placeholder="E.g., SaaS starting at $49/month up to $299/month custom enterprise tiers."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Your Core Product Features & Capabilities</label>
          <textarea 
            className="form-input" 
            rows="3"
            value={form.features_list}
            onChange={e => setForm({ ...form, features_list: e.target.value })}
            placeholder="E.g., Automated AI writing, multi-channel outbound, webhook integrations, team workspace analytics, billing dashboard."
          ></textarea>
          <div className="form-help">Option 2 Feature Comparison: Used to compare competitor launches feature-by-feature and generate sales battlecards.</div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '14px' }}>
          Complete Onboarding & Launch Dashboard
        </button>
      </form>
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: DASHBOARD
// ----------------------------------------------------
function DashboardPage({ competitors, feedCards = [], onAddClick, onCheckNow, onPauseResume, onDelete, onViewDetails }) {
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="badge badge-success">Active</span>;
      case 'paused': return <span className="badge badge-warning">Paused</span>;
      case 'error': return <span className="badge badge-danger">Error</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Never checked';
    const date = new Date(isoString);
    const diffMs = new Date() - date;
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const productThreatCount = feedCards.filter(c => c.affects_product === 1 || c.affects_product === true).length;

  return (
    <div>
      {/* Metric Cards Summary */}
      <div className="stats-grid">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #F4A261' }}>
          <div className="stat-header">
            <span>Monitored Competitors</span>
            <Activity size={18} color="#F4A261" />
          </div>
          <div className="stat-value">{competitors.length}</div>
          <div className="stat-footer">Active scrapers tracking targets</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #D97706' }}>
          <div className="stat-header">
            <span>Intelligence Cards</span>
            <Zap size={18} color="#D97706" />
          </div>
          <div className="stat-value">{feedCards.length}</div>
          <div className="stat-footer">AI-analyzed website updates</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #E11D48' }}>
          <div className="stat-header">
            <span>Product Threats</span>
            <Target size={18} color="#E11D48" />
          </div>
          <div className="stat-value" style={{ color: '#E11D48' }}>{productThreatCount}</div>
          <div className="stat-footer">Direct feature overlaps flagged</div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Competitor Targets</h1>
          <p className="page-subtitle">Manage automated web scraping targets and inspection schedules</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} className="btn btn-primary" onClick={onAddClick}>
          <Plus size={16} /> Add Competitor Target
        </motion.button>
      </div>

      {competitors.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-icon">📊</div>
          <h3>No monitored competitors registered yet</h3>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
            Add your first competitor or click the Chrome Extension icon to start tracking URLs.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={onAddClick}>
            Register Competitor
          </button>
        </div>
      ) : (
        <div className="competitor-grid">
          {competitors.map(comp => (
            <div key={comp.id} className="glass-panel competitor-card">
              <div className="card-title-row">
                <div>
                  <h3 className="card-name">{comp.name}</h3>
                  <a href={comp.url} target="_blank" rel="noopener noreferrer" className="card-url">
                    {comp.url} 🔗
                  </a>
                </div>
                {getStatusBadge(comp.status)}
              </div>

              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">Last Checked</span>
                  <span className="stat-value">{getRelativeTime(comp.last_checked)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Changes This Week</span>
                  <span className="stat-value" style={{ fontWeight: 'bold', color: comp.changes_this_week > 0 ? '#38bdf8' : 'var(--text-secondary)' }}>
                    {comp.changes_this_week}
                  </span>
                </div>
                <div className="stat-item" style={{ marginTop: '6px' }}>
                  <span className="stat-label">Interval</span>
                  <span className="stat-value">{comp.interval_hours} hours</span>
                </div>
                <div className="stat-item" style={{ marginTop: '6px' }}>
                  <span className="stat-label">Monitor Scope</span>
                  <span className="stat-value" style={{ textTransform: 'capitalize' }}>{comp.scope}</span>
                </div>
              </div>

              <div className="card-actions">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className="btn" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }} onClick={() => onViewDetails(comp.id)}>
                  View History
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => onCheckNow(comp.id)}>
                  <RefreshCw size={14} /> Check Now
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className="btn" style={{ padding: '8px 12px' }} onClick={() => onPauseResume(comp.id, comp.status)}>
                  {comp.status === 'paused' ? <Play size={14} color="#059669" /> : <Pause size={14} color="#D97706" />}
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => onDelete(comp.id)}>
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: INTELLIGENCE FEED
// ----------------------------------------------------
function FeedPage({ cards, competitors, onRetryCrm, onViewDiff, onViewScreenshot, onRefreshFeed }) {
  const [selectedComp, setSelectedComp] = useState('all');
  const [selectedCat, setSelectedCat] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [productImpactOnly, setProductImpactOnly] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 8) return '#E11D48'; // Crimson Sunset
    if (score >= 5) return '#D97706'; // Amber Gold
    return '#059669'; // Emerald
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/intelligence/read-all', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      await onRefreshFeed();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleRead = async (card) => {
    try {
      const res = await fetch(`/api/intelligence/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: !card.is_read })
      });
      if (!res.ok) throw new Error('Failed');
      await onRefreshFeed();
    } catch (e) {}
  };

  // Filter logic
  const filteredCards = cards.filter(card => {
    if (selectedComp !== 'all' && card.competitor_id !== parseInt(selectedComp, 10)) return false;
    if (selectedCat !== 'all' && card.category !== selectedCat) return false;
    if (unreadOnly && card.is_read === 1) return false;
    if (productImpactOnly && (card.affects_product !== 1 && card.affects_product !== true)) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Intelligence Feed</h1>
          <p className="page-subtitle">Real-time alerts, product impact matrix, and CRM integration</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92 }} className="btn" onClick={handleMarkAllRead}>
          Read All Cards
        </motion.button>
      </div>

      <div className="feed-layout">
        {/* Sidebar filters */}
        <aside className="glass-panel feed-filters">
          <div>
            <h4 className="filter-section-title">Competitor</h4>
            <select className="form-select" value={selectedComp} onChange={e => setSelectedComp(e.target.value)}>
              <option value="all">All Competitors</option>
              {competitors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="filter-section-title">Category</h4>
            <select className="form-select" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="pricing change">Pricing Change</option>
              <option value="product or feature update">Product Update</option>
              <option value="hiring signal">Hiring Signal</option>
              <option value="content or messaging shift">Content Shift</option>
              <option value="leadership or company change">Company Change</option>
              <option value="other">Other</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={unreadOnly} 
              onChange={e => setUnreadOnly(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            Unread Alerts Only
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>
            <input 
              type="checkbox" 
              checked={productImpactOnly} 
              onChange={e => setProductImpactOnly(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ color: '#E11D48', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={15} /> Direct Product Threats Only
            </span>
          </label>
        </aside>

        {/* Intelligence feed items */}
        <section className="feed-cards">
          {filteredCards.length === 0 ? (
            <div className="glass-panel empty-state">
              <div className="empty-icon">🔔</div>
              <h3>No intelligence cards match filters</h3>
              <p style={{ marginTop: '8px' }}>Changes will appear here when the scheduler detects them.</p>
            </div>
          ) : (
            filteredCards.map(card => (
              <article key={card.id} className="glass-panel feed-card" style={{ borderLeft: `5px solid ${getScoreColor(card.impact_score)}`, opacity: card.is_read ? 0.75 : 1 }}>
                <div className="feed-card-header">
                  <div className="feed-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="feed-card-company">{card.competitor_name}</span>
                      {card.is_read === 0 && <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px' }}>New</span>}
                      {(card.affects_product === 1 || card.affects_product === true) ? (
                        <span className="badge" style={{ backgroundColor: '#FFE4E6', color: '#E11D48', border: '1px solid #FECDD3', fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', fontWeight: 'bold' }}>
                          🎯 Product Threat ({card.impact_type || 'Direct Overlap'})
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#FFF8EE', color: '#6B6B6B', border: '1px solid #F2E7D8', fontSize: '11px', padding: '4px 10px', borderRadius: '9999px' }}>
                          🛡️ No Product Impact
                        </span>
                      )}

                      {/* Option 3: Risk Matrix Badges */}
                      <span className="badge" style={{ 
                        backgroundColor: (card.churn_risk === 'High' || card.churn_risk === 'Critical') ? '#FFE4E6' : (card.churn_risk === 'Medium' ? '#FEF3C7' : '#D1FAE5'), 
                        color: (card.churn_risk === 'High' || card.churn_risk === 'Critical') ? '#E11D48' : (card.churn_risk === 'Medium' ? '#D97706' : '#059669'), 
                        fontSize: '11px', 
                        padding: '4px 10px' 
                      }}>
                        ⚡ Churn Risk: {card.churn_risk || 'Low'}
                      </span>
                      {card.market_position_risk && card.market_position_risk > 1 && (
                        <span className="badge" style={{ backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF', fontSize: '11px', padding: '4px 10px' }}>
                          📊 Market Risk: {card.market_position_risk}/10
                        </span>
                      )}
                    </div>
                    <span className="feed-card-time">{new Date(card.timestamp).toLocaleString()}</span>
                  </div>
                  
                  <div className="feed-card-score-badge">
                    <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '11px' }}>{card.category}</span>
                    <span className="score-number" style={{ backgroundColor: getScoreColor(card.impact_score) }}>
                      {card.impact_score}
                    </span>
                  </div>
                </div>

                <div className="feed-card-summary">
                  {card.summary}
                </div>

                <div className="feed-card-grid">
                  <div className="feed-card-block">
                    <strong>Impact Justification</strong>
                    <p>{card.justification}</p>
                  </div>
                  <div className="feed-card-block">
                    <strong>Recommended Action</strong>
                    <p style={{ color: '#67e8f9', fontWeight: '600' }}>{card.recommendation}</p>
                  </div>
                  {card.affected_product_areas && card.affected_product_areas !== 'None' && (
                    <div className="feed-card-block" style={{ gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <strong style={{ color: '#f87171', fontSize: '11px', textTransform: 'uppercase' }}>🎯 Affected Product Features / Areas:</strong>
                      <p style={{ color: '#fecaca', fontWeight: '600', margin: '4px 0 0 0', fontSize: '13px' }}>{card.affected_product_areas}</p>
                    </div>
                  )}

                  {/* Option 2: Battlecard Generator Output */}
                  {card.battlecard_counter && (
                    <div className="feed-card-block" style={{ gridColumn: 'span 2', background: '#FFF8EE', padding: '16px', borderRadius: '16px', border: '1px solid #F2E7D8' }}>
                      <strong style={{ color: '#D97706', fontSize: '11px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Swords size={15} color="#D97706" /> Sales Battlecard Counter (Positioning Strategy):
                      </strong>
                      <p style={{ color: '#2D2A26', margin: '6px 0 0 0', fontSize: '13px', lineHeight: '1.5', fontWeight: '500' }}>{card.battlecard_counter}</p>
                    </div>
                  )}
                </div>

                {card.crm_sync_status === 'failed' && (
                  <div className="glass-panel" style={{ border: '1px solid var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '12px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#f87171' }}>
                      ⚠️ CRM sync failed: <strong>{card.crm_error}</strong>
                    </span>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onRetryCrm(card.id)}>
                      Retry CRM Sync
                    </button>
                  </div>
                )}

                <div className="feed-card-actions">
                  <button className="btn" style={{ fontSize: '13px', padding: '7px 16px' }} onClick={() => handleToggleRead(card)}>
                    <CheckCircle2 size={15} color={card.is_read ? '#059669' : '#6B6B6B'} /> {card.is_read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  {card.screenshot_path && (
                    <button className="btn" style={{ fontSize: '13px', padding: '7px 16px' }} onClick={() => onViewScreenshot(card.screenshot_path)}>
                      <Image size={15} color="#F4A261" /> View Page Capture
                    </button>
                  )}
                  {/* Fetch diff text dynamically from scrapes if needed, or query on click */}
                  <button className="btn btn-primary" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={async () => {
                    try {
                      const res = await fetch(`/api/competitors/${card.competitor_id}`);
                      const data = await res.json();
                      // Find matching diff by fetching scrape history or parsing diff in SQLite card. 
                      // Actually, we can generate a diff by getting current text and finding the difference, or we can look up scrape records.
                      // Since we store text content in scrapes, let's look up history.
                      // Alternatively, we can let user view details which displays full history and diff.
                      // For this card, we will reconstruct a mock diff or use a stored text if available.
                      // In detector.js we generated diffText and stored it. Let's make sure our details page can display it.
                      // Wait! The card in database does not store the raw diffText directly, but it links to competitor detail.
                      // Let's implement diff fetching: we'll fetch scrapes, and calculate semantic diff dynamically or let card summary suffice.
                      // Wait! In db.js, the card summary is stored. Let's make sure we can fetch the diff text.
                      // To make it easy, we can fetch the scrape contents matching this card timestamp and the previous scrape.
                      const timestamp = card.timestamp;
                      const scrapHistory = data.latestScrape;
                      // Let's just fetch the scrapes at card time and prior to card time
                      const scrapesRes = await fetch(`/api/competitors/${card.competitor_id}`);
                      const scrapesData = await scrapesRes.json();
                      // Find scrape matching card timestamp
                      const scrapes = scrapesData.history;
                      onViewDiff(card.summary + "\n\nRecommendation:\n" + card.recommendation);
                    } catch (e) {
                      onViewDiff("Detail text:\n" + card.summary);
                    }
                  }}>
                    🔍 View Full Analysis Details
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: COMPETITOR DETAIL PAGE
// ----------------------------------------------------
function DetailsPage({ competitorId, competitors, onBack, onDelete, onCheckNow, onUpdateCompetitor }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Settings Form State
  const [form, setForm] = useState({
    name: '',
    interval_hours: 6,
    scope: 'full',
    js_enabled: false
  });

  useEffect(() => {
    if (competitorId) {
      fetchCompetitorData();
    }
  }, [competitorId]);

  const fetchCompetitorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/competitors/${competitorId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      const compData = await res.json();
      if (!compData || !compData.competitor) {
        throw new Error('Invalid competitor data received from server');
      }
      setData(compData);
      
      setForm({
        name: compData.competitor.name || '',
        interval_hours: compData.competitor.interval_hours || 6,
        scope: compData.competitor.scope || 'full',
        js_enabled: compData.competitor.js_enabled === 1
      });
    } catch (e) {
      console.error('Error fetching competitor details:', e);
      setError(e.message || 'Failed to load competitor details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/competitors/${competitorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update configuration.');
      alert('Configuration updated successfully.');
      onUpdateCompetitor();
      await fetchCompetitorData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading competitor details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-danger)', marginBottom: '30px' }}>
        <h3 style={{ color: 'var(--color-danger)' }}>Error Loading Details</h3>
        <p>{error || 'No competitor data found.'}</p>
        <button className="btn" style={{ marginTop: '15px' }} onClick={onBack}>⬅️ Back to Dashboard</button>
      </div>
    );
  }

  const { competitor, history, latestScrape } = data;

  // Render Line Chart in pure SVG
  const renderTrendChart = () => {
    const scoredHistory = [...history]
      .filter(c => c.impact_score)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (scoredHistory.length < 2) {
      return (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
          📈 Trend Chart requires at least 2 historical changes to display.
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 10;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calculate coordinates
    const points = scoredHistory.map((item, idx) => {
      const x = paddingLeft + (idx / (scoredHistory.length - 1)) * chartWidth;
      // y is calculated based on score (1 to 10). Score 10 should be at paddingTop, Score 1 should be at (paddingTop + chartHeight)
      const scoreFraction = (item.impact_score - 1) / 9; // 0 to 1
      const y = paddingTop + chartHeight - scoreFraction * chartHeight;
      return { x, y, score: item.impact_score, date: new Date(item.timestamp).toLocaleDateString() };
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '10px' }}>
          Impact Score Trend
        </h4>
        <div className="chart-container">
          <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[1, 5, 10].map(score => {
              const scoreFraction = (score - 1) / 9;
              const y = paddingTop + chartHeight - scoreFraction * chartHeight;
              return (
                <g key={score}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <text x={paddingLeft - 10} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{score}</text>
                </g>
              );
            })}

            {/* Shaded Area under path */}
            {points.length > 0 && (
              <path 
                d={`${pathData} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`}
                fill="url(#chartGradient)"
              />
            )}

            {/* The line path */}
            <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Data points */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <title>{`Score: ${p.score} (${p.date})`}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn" onClick={onBack}>
          ⬅️ Back to Dashboard
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '8px' }}>
            {(competitor.status || '').toUpperCase()}
          </span>
          <h1 className="page-title">{competitor.name}</h1>
          <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="card-url">
            {competitor.url} 🔗
          </a>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            onClick={async () => {
              await onCheckNow(competitor.id);
              // Refresh this detail page's data after the background scrape completes (approx 15 seconds)
              setTimeout(() => {
                fetchCompetitorData();
              }, 15000);
            }}
          >
            Check Scrape Now
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(competitor.id)}>
            Delete Competitor
          </button>
        </div>
      </div>

      <div className="details-layout">
        {/* Left Column: History and Trend */}
        <div>
          {renderTrendChart()}

          {/* Change History */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Change History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No intelligence events recorded yet for this competitor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map(card => (
                  <div key={card.id} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginHeight: '10px', alignItems: 'center' }}>
                      <span className="badge badge-info">{card.category}</span>
                      <span style={{ fontWeight: 'bold', color: card.impact_score >= 8 ? '#f87171' : (card.impact_score >= 5 ? '#fbbf24' : '#60a5fa') }}>
                        Impact Score: {card.impact_score}/10
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '10px 0' }}>
                      {card.summary ? card.summary.split('\n')[0] : ''}
                    </p>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Checked on: {new Date(card.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scrape Logs */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>Recent Scrapes</h3>
            {latestScrape ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Latest Raw Scrape Timestamp: <strong>{new Date(latestScrape.timestamp).toLocaleString()}</strong>
                </p>
                {latestScrape.screenshot_path && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Captured Screenshot:</strong>
                    <br />
                    <img 
                      src={latestScrape.screenshot_path} 
                      className="screenshot-preview" 
                      style={{ maxWidth: '350px' }}
                      alt="Latest capture preview"
                      onClick={() => window.open(latestScrape.screenshot_path, '_blank')}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No raw scrapes recorded yet. Trigger a check above to populate.</p>
            )}
          </div>
        </div>

        {/* Right Column: Settings & Configs */}
        <aside className="glass-panel" style={{ padding: '24px', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            Monitoring Config
          </h3>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Competitor Name</label>
              <input 
                type="text" 
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scrape Interval (Hours)</label>
              <select 
                className="form-select"
                value={form.interval_hours}
                onChange={e => setForm({ ...form, interval_hours: parseInt(e.target.value, 10) })}
              >
                <option value={6}>6 hours (Recommended minimum)</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours (Daily)</option>
                <option value={48}>48 hours</option>
                <option value={168}>168 hours (Weekly)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monitor Scope</label>
              <select 
                className="form-select"
                value={form.scope}
                onChange={e => setForm({ ...form, scope: e.target.value })}
              >
                <option value="full">Full Page Content</option>
                <option value="pricing">Pricing Section Only</option>
                <option value="careers">Careers / Jobs Section Only</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginHeight: '20px', marginBottom: '20px' }}>
              <input 
                type="checkbox"
                checked={form.js_enabled}
                onChange={e => setForm({ ...form, js_enabled: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              Execute JS (Headless Puppeteer)
            </label>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Configurations
            </button>
          </form>

          {(() => {
            let enrichment = null;
            if (competitor.enrichment_data) {
              try {
                enrichment = JSON.parse(competitor.enrichment_data);
              } catch (e) {}
            }
            if (!enrichment) return null;
            return (
              <div className="glass-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, margin: '0 0 12px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  🔍 Data Enrichment (Source 2)
                </h4>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>Server Tech Header:</strong>
                    <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', marginTop: '2px' }}>{enrichment.serverHeader || 'Unknown'}</div>
                  </div>
                  {enrichment.xPoweredBy && (
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Powered By:</strong>
                      <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', marginTop: '2px' }}>{enrichment.xPoweredBy}</div>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>DNS A Records (IPs):</strong>
                    {enrichment.ipAddresses && enrichment.ipAddresses.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {enrichment.ipAddresses.map((ip, i) => (
                          <span key={i} style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{ip}</span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None resolved</div>
                    )}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>DNS MX Records (Mail):</strong>
                    {enrichment.mxRecords && enrichment.mxRecords.length > 0 ? (
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {enrichment.mxRecords.slice(0, 3).map((mx, i) => (
                          <li key={i}>{mx}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None resolved</div>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                    Enriched: {new Date(enrichment.checkedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: SETTINGS
// ----------------------------------------------------
function SettingsPage({ settings, profile, feedCards, onSaveSettings, onTestEmail, onRetryCrm, onRegenerateKey, onUpdateProfile }) {
  const [profileForm, setProfileForm] = useState({
    business_name: profile?.business_name || '',
    product_desc: profile?.product_desc || '',
    customers: profile?.customers || '',
    price_point: profile?.price_point || '',
    features_list: profile?.features_list || ''
  });

  const [emailForm, setEmailForm] = useState({
    smtp_host: settings?.email_config?.smtp_host || '',
    smtp_port: settings?.email_config?.smtp_port || 587,
    smtp_user: settings?.email_config?.smtp_user || '',
    smtp_pass: settings?.email_config?.smtp_pass || '',
    recipient_email: settings?.email_config?.recipient_email || '',
    provider: settings?.email_config?.provider || 'smtp'
  });

  const [crmForm, setCrmForm] = useState({
    active_crm: settings?.crm_config?.active_crm || 'none',
    notion_token: settings?.crm_config?.notion_token || '',
    notion_db_id: settings?.crm_config?.notion_db_id || '',
    airtable_key: settings?.crm_config?.airtable_key || '',
    airtable_base_id: settings?.crm_config?.airtable_base_id || '',
    airtable_table_name: settings?.crm_config?.airtable_table_name || 'Competitor Intel'
  });

  const [threshold, setThreshold] = useState(settings?.semantic_threshold || 0.85);
  const [schedule, setSchedule] = useState(settings?.digest_schedule || 'daily');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(settings?.slack_webhook_url || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Keep state synchronized with props when they load or change
  useEffect(() => {
    if (profile) {
      setProfileForm({
        business_name: profile.business_name || '',
        product_desc: profile.product_desc || '',
        customers: profile.customers || '',
        price_point: profile.price_point || '',
        features_list: profile.features_list || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setEmailForm({
        smtp_host: settings.email_config?.smtp_host || '',
        smtp_port: settings.email_config?.smtp_port || 587,
        smtp_user: settings.email_config?.smtp_user || '',
        smtp_pass: settings.email_config?.smtp_pass || '',
        recipient_email: settings.email_config?.recipient_email || '',
        provider: settings.email_config?.provider || 'smtp'
      });
      setCrmForm({
        active_crm: settings.crm_config?.active_crm || 'none',
        notion_token: settings.crm_config?.notion_token || '',
        notion_db_id: settings.crm_config?.notion_db_id || '',
        airtable_key: settings.crm_config?.airtable_key || '',
        airtable_base_id: settings.crm_config?.airtable_base_id || '',
        airtable_table_name: settings.crm_config?.airtable_table_name || 'Competitor Intel'
      });
      setThreshold(settings.semantic_threshold ?? 0.85);
      setSchedule(settings.digest_schedule || 'daily');
      setSlackWebhookUrl(settings.slack_webhook_url || '');
    }
  }, [settings]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    alert('Business Profile context updated successfully!');
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    if (slackWebhookUrl && !slackWebhookUrl.startsWith('https://hooks.slack.com/') && !slackWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      alert('Error: Slack Webhook URL must be a valid webhook starting with "https://hooks.slack.com/" (or Discord webhooks starting with "https://discord.com/api/webhooks/")');
      return;
    }
    onSaveSettings({
      digest_schedule: schedule,
      semantic_threshold: threshold,
      email_config: emailForm,
      crm_config: crmForm,
      slack_webhook_url: slackWebhookUrl
    });
  };

  // Filter failed syncs from feed cards
  const failedCards = feedCards.filter(c => c.crm_sync_status === 'failed');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurations & Settings</h1>
          <p className="page-subtitle">Manage APIs, CRMs, email schedules, and your business profile context</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Config Forms */}
        <div>
          {/* Workspace Sharing */}
          <div className="glass-panel settings-card" style={{ marginBottom: '24px' }}>
            <h3 className="settings-card-title">Shareable Workspace URL</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Save, bookmark, or copy this URL to return to this specific isolated workspace session.
            </p>
            <div className="api-key-box" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {window.location.origin + window.location.pathname + "?w=" + workspaceId}
              </span>
              <button 
                className="btn" 
                style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                onClick={() => {
                  const url = window.location.origin + window.location.pathname + "?w=" + workspaceId;
                  navigator.clipboard.writeText(url);
                  alert('Workspace link copied to clipboard!');
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>

          {/* Extension API Key */}
          <div className="glass-panel settings-card" style={{ marginBottom: '24px' }}>
            <h3 className="settings-card-title">Chrome Extension Integration</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Paste this API key into the Chrome Extension settings popup to authorize additions and badge counts.
            </p>
            <div className="api-key-box">
              <span>{settings?.api_key || 'No Key Configured'}</span>
              <button 
                className="btn" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => {
                  navigator.clipboard.writeText(settings.api_key);
                  alert('API Key copied to clipboard!');
                }}
              >
                📋 Copy
              </button>
            </div>
            <button className="btn btn-danger" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={onRegenerateKey}>
              Regenerate API Key
            </button>
          </div>

          {/* Business Profile */}
          <div className="glass-panel settings-card" style={{ marginBottom: '24px' }}>
            <h3 className="settings-card-title">Business Profile Context</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={profileForm.business_name}
                  onChange={e => setProfileForm({ ...profileForm, business_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={profileForm.product_desc}
                  onChange={e => setProfileForm({ ...profileForm, product_desc: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Target Customers</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={profileForm.customers}
                  onChange={e => setProfileForm({ ...profileForm, customers: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pricing / Price Point</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={profileForm.price_point}
                  onChange={e => setProfileForm({ ...profileForm, price_point: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Core Product Features & Capabilities</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={profileForm.features_list}
                  onChange={e => setProfileForm({ ...profileForm, features_list: e.target.value })}
                  placeholder="List your key features to compare competitor updates feature-by-feature"
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Update Business Profile
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: CRM & SMTP Configuration */}
        <div>
          <form onSubmit={handleGeneralSubmit}>
            {/* General monitoring metrics */}
            <div className="glass-panel settings-card" style={{ marginBottom: '24px' }}>
              <h3 className="settings-card-title">General Engine Settings</h3>
              <div className="form-group">
                <label className="form-label">Semantic Change Threshold (0.0 to 1.0)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1" 
                  className="form-input"
                  value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  required
                />
                <div className="form-help">
                  Lower values (e.g. 0.7) allow minor wording shifts to match. Higher values (e.g. 0.9) trigger changes more easily. Recommended: 0.85.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Digest Schedule</label>
                <select 
                  className="form-select"
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                >
                  <option value="daily">Daily Digest Email</option>
                  <option value="weekly">Weekly Digest Email</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label className="form-label">Slack Webhook URL (Real-time Alerts)</label>
                <input 
                  type="url" 
                  className="form-input"
                  value={slackWebhookUrl}
                  onChange={e => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <div className="form-help">
                  Real-time Slack alerts will be sent immediately for high-impact events (score 8 or above).
                </div>
              </div>
            </div>

            {/* Email SMTP Config */}
            <div className="glass-panel settings-card" style={{ marginBottom: '24px' }}>
              <h3 className="settings-card-title">Digest SMTP Email Settings</h3>
              <div className="form-group">
                <label className="form-label">SMTP Server Host</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={emailForm.smtp_host}
                  onChange={e => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">SMTP Port</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={emailForm.smtp_port}
                  onChange={e => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value, 10) })}
                  placeholder="587"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">SMTP Password / App Password / Resend Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={emailForm.smtp_pass}
                  onChange={e => setEmailForm({ ...emailForm, smtp_pass: e.target.value })}
                  placeholder="••••••••••••••••"
                  required
                />
                <div className="form-help">
                  For <strong>Resend.com</strong>, paste your Resend API Key (starts with <code>re_</code>) here.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Digest Recipient Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={emailForm.recipient_email}
                  onChange={e => setEmailForm({ ...emailForm, recipient_email: e.target.value })}
                  placeholder="recipient-manager@mycompany.com"
                  required
                />
              </div>
              <button 
                type="button" 
                className="btn" 
                style={{ marginRight: '10px' }} 
                onClick={async () => {
                  setIsSendingEmail(true);
                  try {
                    await onTestEmail(emailForm);
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? '✉️ Sending...' : '✉️ Send Test Digest Now'}
              </button>
            </div>

            {/* CRM Config */}
            <div className="glass-panel settings-card" style={{ marginBottom: '24px' }}>
              <h3 className="settings-card-title">CRM Integrations</h3>
              <div className="form-group">
                <label className="form-label">Active CRM Database</label>
                <select 
                  className="form-select"
                  value={crmForm.active_crm}
                  onChange={e => setCrmForm({ ...crmForm, active_crm: e.target.value })}
                >
                  <option value="none">No CRM (Store locally only)</option>
                  <option value="notion">Notion Database</option>
                  <option value="airtable">Airtable Base</option>
                </select>
              </div>

              {crmForm.active_crm === 'notion' && (
                <div style={{ marginTop: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Notion Integration Token</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={crmForm.notion_token}
                      onChange={e => setCrmForm({ ...crmForm, notion_token: e.target.value })}
                      placeholder="secret_••••••••••••••••"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notion Database ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={crmForm.notion_db_id}
                      onChange={e => setCrmForm({ ...crmForm, notion_db_id: e.target.value })}
                      placeholder="e.g. 5d5a7d77b8b..."
                    />
                  </div>
                </div>
              )}

              {crmForm.active_crm === 'airtable' && (
                <div style={{ marginTop: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Airtable Personal Access Token (PAT)</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={crmForm.airtable_key}
                      onChange={e => setCrmForm({ ...crmForm, airtable_key: e.target.value })}
                      placeholder="pat.••••••••••••••••"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label className="form-label">Airtable Base ID</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={crmForm.airtable_base_id}
                        onChange={e => setCrmForm({ ...crmForm, airtable_base_id: e.target.value })}
                        placeholder="app••••••••••••"
                      />
                    </div>
                    <div>
                      <label className="form-label">Table Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={crmForm.airtable_table_name}
                        onChange={e => setCrmForm({ ...crmForm, airtable_table_name: e.target.value })}
                        placeholder="Competitor Intel"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save General Configurations
            </button>
          </form>

          {/* CRM Sync Error Retry Table */}
          <div className="glass-panel settings-card" style={{ marginTop: '24px' }}>
            <h3 className="settings-card-title">⚠️ Failed CRM Synchronization Log ({failedCards.length})</h3>
            {failedCards.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No failed writes currently in queue. Sync is clean.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="scrapes-table">
                  <thead>
                    <tr>
                      <th>Competitor</th>
                      <th>Error details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedCards.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.competitor_name}</strong><br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.category}</span></td>
                        <td style={{ color: '#f87171', fontSize: '12px' }}>{c.crm_error}</td>
                        <td>
                          <button className="btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => onRetryCrm(c.id)}>
                            Retry Sync
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL COMPONENT: ADD COMPETITOR
// ----------------------------------------------------
function AddCompetitorModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    url: '',
    interval_hours: 6,
    scope: 'full',
    js_enabled: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">➕ Register Competitor URL</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Competitor Label Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="E.g., Competitor Alpha"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Website Target URL</label>
            <input 
              type="url" 
              className="form-input" 
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://competitor.com/pricing"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scraping Frequency (Interval)</label>
            <select 
              className="form-select"
              value={form.interval_hours}
              onChange={e => setForm({ ...form, interval_hours: parseInt(e.target.value, 10) })}
            >
              <option value={6}>Every 6 Hours</option>
              <option value={12}>Every 12 Hours</option>
              <option value={24}>Every 24 Hours (Daily)</option>
              <option value={168}>Every Week</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Extraction Scope</label>
            <select 
              className="form-select"
              value={form.scope}
              onChange={e => setForm({ ...form, scope: e.target.value })}
            >
              <option value="full">Full Webpage Content</option>
              <option value="pricing">Pricing Section Only</option>
              <option value="careers">Careers & Jobs Section Only</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px' }}>
            <input 
              type="checkbox" 
              checked={form.js_enabled}
              onChange={e => setForm({ ...form, js_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            Render Dynamic Javascript (Single-Process Chromium)
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Add and Scan Competitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL COMPONENT: VIEW ANALYSIS DETAILED DRAWER
// ----------------------------------------------------
function DiffModal({ diffText, onClose }) {
  // Format the text into lines showing additions/deletions/neutral
  const lines = diffText.split('\n');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🔍 Detailed Analysis Logs</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="diff-container" style={{ maxHeight: '450px' }}>
          {lines.map((line, idx) => {
            if (line.startsWith('+ ')) {
              return <span key={idx} className="diff-added">{line}</span>;
            } else if (line.startsWith('- ')) {
              return <span key={idx} className="diff-removed">{line}</span>;
            } else {
              return <span key={idx} style={{ color: 'var(--text-secondary)', display: 'block', padding: '2px 4px' }}>{line}</span>;
            }
          })}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Close Detail Log</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL COMPONENT: SCREENSHOT LIGHTBOX
// ----------------------------------------------------
function ScreenshotModal({ url, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 300 }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}
        >
          &times;
        </button>
        <img 
          src={url} 
          style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
          alt="Visual Archive Capture"
        />
        <div style={{ marginTop: '12px', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '15px', fontSize: '14px' }}>
          Visual Page Capture - Timestamped Archive
        </div>
      </div>
    </div>
  );
}
