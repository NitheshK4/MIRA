import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Settings as SettingsIcon,
  Plus,
  Globe,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Clock,
  TrendingUp,
  Sparkles,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  Eye,
  EyeOff,
  Image,
  FileText,
  SlidersHorizontal,
  Layers,
  Copy,
  Check,
  Send,
  Key,
  Share2,
  Building2,
  Target,
  DollarSign,
  X,
  ChevronRight,
  Filter,
  ArrowUpRight,
  BarChart3,
  Database,
  Inbox,
  AlertOctagon,
  Brain,
  ShieldCheck,
  Zap,
  Server,
  Mail,
  Sliders
} from 'lucide-react';

import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import VisualDiffModal from './components/VisualDiffModal.jsx';
import BattlecardsView from './components/BattlecardsView.jsx';
import WarRoomView from './components/WarRoomView.jsx';
import KillCardCopilot from './components/KillCardCopilot.jsx';
import StrategyCopilotModal from './components/StrategyCopilotModal.jsx';
import { CardSkeleton, FeedSkeleton } from './components/SkeletonLoader.jsx';

// Extract Workspace ID from URL, LocalStorage, or auto-generate a persistent unique ID per user/browser
const getWorkspaceId = () => {
  const params = new URLSearchParams(window.location.search);
  const urlWs = params.get('w') || params.get('workspace');

  // 1. Explicit URL workspace parameter takes priority & updates localStorage
  if (urlWs) {
    localStorage.setItem('mira_workspace_id', urlWs);
    return urlWs;
  }

  // 2. Retrieve user's existing private workspace ID from localStorage
  let savedWs = localStorage.getItem('mira_workspace_id');

  // 3. If no workspace ID exists yet or if it was set to global 'default', generate a unique private ID
  if (!savedWs || savedWs === 'default') {
    savedWs = 'ws-' + Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
    localStorage.setItem('mira_workspace_id', savedWs);
  }

  // 4. Update browser URL query parameter without page reload
  if (!window.location.search.includes('w=')) {
    const newUrl = `${window.location.pathname}?w=${savedWs}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl);
  }

  return savedWs;
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Drawers State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDiffText, setActiveDiffText] = useState(null);
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState(null);
  const [activeVisualDiffCardId, setActiveVisualDiffCardId] = useState(null);

  // Real-Time Claymorphism Toast State
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, ...toast };
    setToasts(prev => [newToast, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-Time Server-Sent Events (SSE) Listener
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/stream/events');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'intel-card-created' && data.card) {
            setFeedCards(prev => [data.card, ...prev]);
            addToast({
              type: 'rose',
              title: `Alert: ${data.card.competitor_name || 'Competitor'} Update`,
              desc: data.card.summary || 'Meaningful market update detected.'
            });
          } else if (data.type === 'competitor-added') {
            refreshCompetitors();
            addToast({
              type: 'cyan',
              title: 'Competitor Monitored',
              desc: `Now tracking ${data.competitor?.name || 'new target'}.`
            });
          } else if (data.type === 'scan-triggered') {
            addToast({
              type: 'violet',
              title: 'Scrape Enqueued',
              desc: `Scanning page for ${data.name || 'competitor'}...`
            });
          } else if (data.type === 'scan-completed') {
            refreshCompetitors();
            refreshFeed();
            addToast({
              type: 'emerald',
              title: 'Scan Finished',
              desc: `Scrape finished for ${data.name || 'competitor'}.`
            });
          }
        } catch (e) {
          console.warn('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = () => {
        // Soft error handler for browser reconnection retry
      };
    } catch (e) {
      console.error('Failed to initialize SSE EventSource:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Listen to custom command palette open event
  useEffect(() => {
    const handleOpenCmd = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpenCmd);
    return () => window.removeEventListener('open-command-palette', handleOpenCmd);
  }, []);

  // Fetch all initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await fetch('/api/profile');
      if (!profileRes.ok) {
        throw new Error('Failed to load profile from server');
      }
      const profileData = await profileRes.json();

      if (profileData && profileData.error) {
        throw new Error(profileData.error);
      }

      setProfile(profileData);
      const urlParams = new URLSearchParams(window.location.search);
      const forceOnboarding = urlParams.get('onboarding') === 'true' || urlParams.get('register') === 'true';

      if (!profileData || !profileData.business_name || forceOnboarding) {
        setOnboarded(false);
        setActiveTab('onboarding');
      } else {
        setOnboarded(true);
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
      }
    } catch (e) {
      console.error('Failed to reload intelligence feed:', e);
    }
  };

  const handleFullRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshCompetitors(),
        refreshFeed(),
        fetchInitialData()
      ]);
      addToast({
        title: 'System Synchronized 🔄',
        message: 'Live competitor radar, stream feeds, and battlecard telemetry updated.',
        type: 'success'
      });
    } catch (err) {
      console.error('Full refresh error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
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

  const handleClearAllCompetitors = async () => {
    if (!confirm('Are you sure you want to remove ALL competitor targets from this workspace?')) return;
    try {
      for (const comp of competitors) {
        await fetch(`/api/competitors/${comp.id}`, { method: 'DELETE' });
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

      alert('A scrape job has been added to the background queue. It will complete in 15-30 seconds.');

      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));

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
      // Immediately reflect saved values in UI so fields don't clear during refetch
      setSettings(prev => ({ ...prev, ...formSettings }));
      alert('Settings saved successfully.');
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

  const unreadCount = feedCards.filter(c => c.is_read === 0).length;

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      {onboarded && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          workspaceId={workspaceId}
          profile={profile}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          unreadCount={unreadCount}
          onOpenOracle={() => setIsOracleOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <div className="app-main-content">
        {onboarded && (
          <TopBar
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onAddClick={() => setIsAddModalOpen(true)}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            unreadCount={unreadCount}
            onRefresh={handleFullRefresh}
            isRefreshing={isRefreshing}
            activeTab={activeTab}
          />
        )}

        <main className="app-container">
          {loading && activeTab !== 'onboarding' ? (
            <div className="space-y-6">
              <div className="h-8 w-64 mira-skeleton rounded-lg"></div>
              <div className="bento-grid">
                <div className="bento-span-8"><CardSkeleton /></div>
                <div className="bento-span-4"><CardSkeleton /></div>
                <div className="bento-span-6"><CardSkeleton /></div>
                <div className="bento-span-6"><CardSkeleton /></div>
              </div>
            </div>
          ) : error ? (
            <div className="mira-glass p-8 border-l-4 border-rose-500 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertOctagon className="w-6 h-6" />
                <h3 className="text-lg font-bold">System Connection Failure</h3>
              </div>
              <p className="text-slate-300 text-sm">{error}</p>
              <button className="mira-btn mira-btn-secondary text-xs" onClick={fetchInitialData}>
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Server Connection
              </button>
            </div>
          ) : (
            <div>
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
                  onClearAll={handleClearAllCompetitors}
                  onViewDetails={navigateToDetails}
                  onViewFeed={() => setActiveTab('feed')}
                  settings={settings}
                />
              )}

              {activeTab === 'feed' && (
                <FeedPage
                  cards={feedCards}
                  competitors={competitors}
                  onRetryCrm={handleRetryCrm}
                  onViewDiff={(diff) => setActiveDiffText(diff)}
                  onViewScreenshot={(url) => setActiveScreenshotUrl(url)}
                  onViewVisualDiff={(cardId) => setActiveVisualDiffCardId(cardId)}
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

              {activeTab === 'battlecards' && (
                <BattlecardsView
                  workspaceId={workspaceId}
                  competitors={competitors}
                />
              )}

              {activeTab === 'killcards' && (
                <KillCardCopilot
                  competitors={competitors}
                  onOpenOracle={(prompt) => {
                    setIsOracleOpen(true);
                  }}
                />
              )}

              {activeTab === 'warroom' && (
                <WarRoomView
                  competitors={competitors}
                  profile={profile}
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
                  workspaceId={workspaceId}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Competitor Modal */}
      {isAddModalOpen && (
        <AddCompetitorModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddCompetitor}
        />
      )}

      {/* MIRA Oracle Strategy Co-Pilot Modal */}
      <StrategyCopilotModal
        isOpen={isOracleOpen}
        onClose={() => setIsOracleOpen(false)}
        onLaunchWarRoom={() => setActiveTab('warroom')}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        competitors={competitors}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onAddClick={() => setIsAddModalOpen(true)}
        onViewDetails={navigateToDetails}
        onRefresh={() => {
          refreshCompetitors();
          refreshFeed();
        }}
      />

      {/* Diff Text Modal */}
      {activeDiffText !== null && (
        <DiffModal
          diffText={activeDiffText}
          onClose={() => setActiveDiffText(null)}
        />
      )}

      {/* Visual Snapshot & DOM Diff Modal */}
      {activeVisualDiffCardId && (
        <VisualDiffModal
          cardId={activeVisualDiffCardId}
          onClose={() => setActiveVisualDiffCardId(null)}
        />
      )}

      {/* Real-Time Claymorphism Toast Container */}
      <div className="clay-toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`clay-toast clay-toast-${toast.type || 'cyan'}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="toast-live-dot" />
            <div style={{ flex: 1 }}>
              <div className="toast-title">{toast.title}</div>
              <div className="toast-desc">{toast.desc}</div>
            </div>
          </div>
        ))}
      </div>
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
    price_point: initialProfile?.price_point || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="max-w-2xl mx-auto my-12">
      <div className="mira-glass p-8 sm:p-10 space-y-8 relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 p-[1.5px] mx-auto shadow-xl shadow-violet-500/20">
            <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center">
              <Brain className="w-7 h-7 text-violet-400" />
            </div>
          </div>
          <h1 className="text-2.5xl font-black text-white font-['Outfit'] tracking-tight">
            Configure Business Intelligence Context
          </h1>
          <p className="text-slate-300 text-xs max-w-md mx-auto leading-relaxed">
            To compute high-precision <strong>Business Impact Scores (1–10)</strong> on competitor shifts, Mira requires your core business parameters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mira-form-group">
            <label className="mira-form-label flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              Your Business / Product Name
            </label>
            <input
              type="text"
              className="mira-input"
              value={form.business_name}
              onChange={e => setForm({ ...form, business_name: e.target.value })}
              placeholder="e.g. InboxFlow AI"
              required
            />
          </div>

          <div className="mira-form-group">
            <label className="mira-form-label flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-400" />
              What your product does & key features
            </label>
            <textarea
              className="mira-textarea"
              rows="3"
              value={form.product_desc}
              onChange={e => setForm({ ...form, product_desc: e.target.value })}
              placeholder="e.g. Automated AI outbound email platform with personalized sequence optimization and CRM sync."
              required
            ></textarea>
          </div>

          <div className="mira-form-group">
            <label className="mira-form-label flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Target Customer Segments
            </label>
            <input
              type="text"
              className="mira-input"
              value={form.customers}
              onChange={e => setForm({ ...form, customers: e.target.value })}
              placeholder="e.g. Mid-market B2B SaaS sales teams, growth agencies, and outbound SDRs."
              required
            />
          </div>

          <div className="mira-form-group">
            <label className="mira-form-label flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Your Pricing Structure & Price Point
            </label>
            <input
              type="text"
              className="mira-input"
              value={form.price_point}
              onChange={e => setForm({ ...form, price_point: e.target.value })}
              placeholder="e.g. Starter $49/mo, Pro $149/mo, Enterprise $499/mo"
              required
            />
          </div>

          <button type="submit" className="mira-btn mira-btn-primary w-full py-3.5 text-xs font-black shadow-lg">
            <Sparkles className="w-4 h-4" />
            Complete Context & Launch Intelligence Layer
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: ASYMMETRIC OBSIDIAN DASHBOARD
// ----------------------------------------------------
function DashboardPage({
  competitors,
  feedCards,
  onAddClick,
  onCheckNow,
  onPauseResume,
  onDelete,
  onClearAll,
  onViewDetails,
  onViewFeed,
  settings
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="mira-badge-emerald px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'paused':
        return (
          <span className="mira-badge-amber px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1">
            <PauseCircle className="w-3 h-3" /> Paused
          </span>
        );
      case 'error':
        return (
          <span className="mira-badge-rose px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Error
          </span>
        );
      default:
        return <span className="mira-badge-violet px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase">{status}</span>;
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Never checked';
    const date = new Date(isoString);
    const diffMs = new Date() - date;
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const totalMonitored = competitors.length;
  const activeMonitored = competitors.filter(c => c.status === 'active').length;
  const totalChangesThisWeek = competitors.reduce((acc, c) => acc + (c.changes_this_week || 0), 0);
  const urgentAlerts = feedCards.filter(c => c.impact_score >= 7);

  return (
    <div className="space-y-8">
      {/* Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2.5xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            Autonomous Competitor Radar
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.9)] animate-ping"></span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Real-time page diff tracking, local LLM impact scoring, and automated CRM sync
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {competitors.length > 0 && onClearAll && (
            <button className="mira-btn mira-btn-ghost text-xs font-bold text-rose-400 hover:bg-rose-500/15 border border-rose-500/30" onClick={onClearAll} title="Clear all targets from workspace">
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Targets
            </button>
          )}
          <button className="mira-btn mira-btn-primary text-xs font-black shadow-lg" onClick={onAddClick}>
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Add Competitor Target
          </button>
        </div>
      </div>

      {/* ASYMMETRIC OBSIDIAN BENTO GRID */}
      {competitors.length === 0 ? (
        <div className="mira-glass p-12 text-center space-y-4 max-w-xl mx-auto my-8 border-violet-500/20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 p-[1.5px] mx-auto shadow-xl shadow-violet-500/20">
            <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center text-violet-400">
              <Globe className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-lg font-black text-white font-['Outfit']">No Monitored Targets Yet</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
            Register competitor pricing, product feature, or career pages to begin continuous scrape tracking and AI change analysis.
          </p>
          <button className="mira-btn mira-btn-primary text-xs font-bold" onClick={onAddClick}>
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Register First Competitor Target
          </button>
        </div>
      ) : (
        <div className="bento-grid">
          {/* BENTO TILE 1: Executive Intelligence Hero Card (Span 8) */}
          <div className="bento-span-8 mira-glass p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between space-y-6 border-l-2 border-violet-500 shadow-2xl">
            {/* Top Row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="mira-badge-violet px-3 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
                  Executive Intelligence Briefing
                </span>
                <h2 className="text-2xl font-black text-white mt-2 font-['Outfit']">
                  Workspace Competitor Overview
                </h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-violet-500/10 border border-violet-400/25 text-xs text-violet-300 font-bold">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>Ollama / Local LLM Connected</span>
              </div>
            </div>

            {/* Metric Cards with Sparklines */}
            <div className="metrics-row-grid">
              {/* Metric 1 */}
              <div className="metric-stat-box">
                <div className="flex items-center justify-between">
                  <span className="stat-box-label">Monitored</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>
                </div>
                <div className="stat-box-value">
                  {totalMonitored}
                </div>
                <div className="text-[10px] text-slate-400 font-medium font-mono">
                  {activeMonitored} active targets
                </div>
              </div>

              {/* Metric 2 */}
              <div className="metric-stat-box">
                <div className="flex items-center justify-between">
                  <span className="stat-box-label">Weekly Shifts</span>
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="stat-box-value text-violet-300">
                  {totalChangesThisWeek}
                </div>
                <div className="text-[10px] text-violet-400 font-medium font-mono">
                  Detected in 7d
                </div>
              </div>

              {/* Metric 3 */}
              <div className="metric-stat-box">
                <div className="flex items-center justify-between">
                  <span className="stat-box-label">High Impact</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="stat-box-value text-rose-400">
                  {urgentAlerts.length}
                </div>
                <div className="text-[10px] text-rose-400 font-medium font-mono">
                  Score &ge; 7/10
                </div>
              </div>

              {/* Metric 4 */}
              <div className="metric-stat-box">
                <div className="flex items-center justify-between">
                  <span className="stat-box-label">Engine</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-xs font-black text-sky-300 pt-1 flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>
                  Optimal
                </div>
                <div className="text-[10px] text-slate-400 font-medium font-mono">
                  Scrapes Active
                </div>
              </div>
            </div>

            {/* Quick Intelligence Banner */}
            {urgentAlerts.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/30 flex items-start gap-3 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-300">
                    High Impact Shift Detected ({urgentAlerts[0].competitor_name})
                  </div>
                  <p className="text-slate-300 line-clamp-1 font-medium">
                    {urgentAlerts[0].summary}
                  </p>
                  <button
                    onClick={onViewFeed}
                    className="text-sky-400 hover:text-sky-300 font-bold text-[11px] inline-flex items-center gap-1 pt-0.5"
                  >
                    View in Stream &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  All targets scanned cleanly. No high-impact threats flagged this week.
                </span>
                <button onClick={onViewFeed} className="text-violet-400 font-bold hover:underline text-[11px]">
                  Explore Stream &rarr;
                </button>
              </div>
            )}
          </div>

          {/* BENTO TILE 2: Quick Control & Integrations (Span 4) */}
          <div className="bento-span-4 mira-glass p-6 sm:p-7 flex flex-col justify-between space-y-6 border-l-2 border-sky-400">
            <div className="space-y-1.5">
              <span className="mira-badge-cyan px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
                System Status
              </span>
              <h3 className="text-xl font-black text-white font-['Outfit']">
                Control & Integrations
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="integration-status-row">
                <span className="text-xs font-semibold text-slate-300">Chrome Extension API</span>
                <span className="text-xs font-mono font-bold text-emerald-400">Active</span>
              </div>

              <div className="integration-status-row">
                <span className="text-xs font-semibold text-slate-300">Active CRM Target</span>
                <span className="text-xs font-mono font-bold text-violet-300 uppercase">
                  {settings?.crm_config?.active_crm || 'None'}
                </span>
              </div>
            </div>

            <button
              onClick={onAddClick}
              className="mira-btn mira-btn-secondary w-full py-2.5 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              Register New URL Target
            </button>
          </div>

          {/* BENTO TILE 3: Monitored Competitors Grid (Span 12) */}
          <div className="bento-span-12 space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-violet-400" />
                Monitored Competitor Cards ({competitors.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono font-medium">
                Scrapes auto-queued per target interval
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitors.map(comp => (
                <div
                  key={comp.id}
                  className="mira-glass mira-glass-hover p-5.5 flex flex-col justify-between space-y-4 relative overflow-hidden group border border-white/10"
                >
                  {/* Subtle Top Violet Highlight Line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-sky-400 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-extrabold text-white truncate font-['Outfit'] group-hover:text-violet-300 transition-colors">
                          {comp.name}
                        </h4>
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 font-mono truncate flex items-center gap-1 mt-0.5 font-semibold"
                        >
                          <span className="truncate">{comp.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      {getStatusBadge(comp.status)}
                    </div>

                    {/* Competitor Card Stats */}
                    <div className="competitor-card-stats">
                      <div className="stat-pill-item">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400">Last Checked</span>
                        <span className="font-bold text-slate-200 font-mono text-xs">
                          {getRelativeTime(comp.last_checked)}
                        </span>
                      </div>
                      <div className="stat-pill-item">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400">Weekly Shifts</span>
                        <span className={`font-extrabold font-mono text-xs ${comp.changes_this_week > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {comp.changes_this_week}
                        </span>
                      </div>
                      <div className="stat-pill-item pt-2 border-t border-white/10">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400">Interval</span>
                        <span className="font-semibold text-violet-300 text-xs">
                          {comp.interval_hours}h
                        </span>
                      </div>
                      <div className="stat-pill-item pt-2 border-t border-white/10">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400">Scope</span>
                        <span className="font-semibold text-sky-300 text-xs capitalize">
                          {comp.scope}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10" style={{ position: 'relative', zIndex: 5 }}>
                    <button
                      type="button"
                      className="mira-btn mira-btn-secondary flex-1 py-1.5 text-xs font-bold"
                      onClick={(e) => { e.stopPropagation(); onViewDetails(comp.id); }}
                    >
                      <Eye className="w-3.5 h-3.5 text-violet-400" />
                      History
                    </button>
                    <button
                      type="button"
                      className="mira-btn mira-btn-emerald py-1.5 px-2.5 text-xs"
                      onClick={(e) => { e.stopPropagation(); onCheckNow(comp.id); }}
                      title="Trigger Immediate Scrape"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="mira-btn mira-btn-secondary py-1.5 px-2.5 text-xs"
                      onClick={(e) => { e.stopPropagation(); onPauseResume(comp.id, comp.status); }}
                      title={comp.status === 'paused' ? 'Resume Monitor' : 'Pause Monitor'}
                    >
                      {comp.status === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      className="mira-btn mira-btn-danger py-1.5 px-2.5 text-xs"
                      onClick={(e) => { e.stopPropagation(); onDelete(comp.id); }}
                      title="Delete Competitor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// PAGE COMPONENT: INTELLIGENCE STREAM FEED
// ----------------------------------------------------
function FeedPage({ cards, competitors, onRetryCrm, onViewDiff, onViewScreenshot, onViewVisualDiff, onRefreshFeed }) {
  const [selectedComp, setSelectedComp] = useState('all');
  const [selectedCat, setSelectedCat] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 8) return 'border-rose-500 bg-rose-950/15 text-rose-300';
    if (score >= 5) return 'border-amber-500 bg-amber-950/15 text-amber-300';
    return 'border-violet-500 bg-violet-950/15 text-violet-300';
  };

  const getScoreBadgeBg = (score) => {
    if (score >= 8) return 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/30';
    if (score >= 5) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/30';
    return 'bg-gradient-to-r from-violet-500 to-sky-400 text-white shadow-violet-500/30';
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
    } catch (e) { }
  };

  const filteredCards = cards.filter(card => {
    if (selectedComp !== 'all' && card.competitor_id !== parseInt(selectedComp, 10)) return false;
    if (selectedCat !== 'all' && card.category !== selectedCat) return false;
    if (unreadOnly && card.is_read === 1) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2.5xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-violet-400" />
            Real-time Intelligence Stream
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Scraped page diffs, automated LLM impact evaluations, and action recommendations
          </p>
        </div>

        <button className="mira-btn mira-btn-secondary text-xs font-bold" onClick={handleMarkAllRead}>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Mark All As Read
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters Sidebar (Span 3) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="mira-glass p-5 space-y-4 sticky top-24 border-violet-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-300 uppercase tracking-wider pb-2.5 border-b border-white/10">
              <Filter className="w-3.5 h-3.5 text-violet-400" />
              Stream Filters
            </div>

            <div className="mira-form-group">
              <label className="mira-form-label">Competitor Target</label>
              <select className="mira-select text-xs font-semibold" value={selectedComp} onChange={e => setSelectedComp(e.target.value)}>
                <option value="all">All Monitored Targets</option>
                {competitors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="mira-form-group">
              <label className="mira-form-label">Event Category</label>
              <select className="mira-select text-xs font-semibold" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                <option value="all">All Event Categories</option>
                <option value="pricing change">Pricing Change</option>
                <option value="product or feature update">Product Update</option>
                <option value="hiring signal">Hiring Signal</option>
                <option value="content or messaging shift">Content Shift</option>
                <option value="leadership or company change">Company Change</option>
                <option value="other">Other</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-200 pt-2 border-t border-white/10">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={e => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-violet-500 bg-black/60"
              />
              Unread Alerts Only
            </label>
          </div>
        </aside>

        {/* Intelligence Stream Feed Cards (Span 9) */}
        <section className="lg:col-span-9 space-y-5">
          {filteredCards.length === 0 ? (
            <div className="mira-glass p-12 text-center space-y-3 border-violet-500/20">
              <Inbox className="w-10 h-10 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white font-['Outfit']">No Matching Intelligence Alerts</h3>
              <p className="text-slate-400 text-xs">
                Adjust your filters or trigger a check to discover competitor shifts.
              </p>
            </div>
          ) : (
            filteredCards.map(card => (
              <article
                key={card.id}
                className={`mira-glass p-6 space-y-5 border-l-2 ${getScoreColor(card.impact_score)} ${card.is_read ? 'opacity-70' : 'opacity-100'} shadow-2xl`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-base text-white font-['Outfit']">
                        {card.competitor_name}
                      </span>
                      {card.is_read === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-violet-500/15 text-violet-300 border border-violet-400/30 font-mono shadow-md animate-pulse">
                          New Alert
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(card.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="mira-badge-cyan font-mono font-semibold text-[10.5px] px-2.5 py-0.5 rounded-full">
                      {card.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400">Impact</span>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-sm shadow-md ${getScoreBadgeBg(card.impact_score)}`}>
                        {card.impact_score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-slate-100 text-xs leading-relaxed whitespace-pre-line font-medium">
                  {card.summary}
                </p>

                {/* Justification & Recommendation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#070912] border border-white/10 shadow-inner">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-sky-400 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-sky-400" />
                      Impact Justification
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {card.justification}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Recommended Action
                    </div>
                    <p className="text-xs text-emerald-300 font-bold leading-relaxed">
                      {card.recommendation}
                    </p>
                  </div>
                </div>

                {/* CRM Error */}
                {card.crm_sync_status === 'failed' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3 text-xs">
                    <span className="text-rose-300 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      CRM sync failed: <strong>{card.crm_error}</strong>
                    </span>
                    <button className="mira-btn mira-btn-danger py-1 px-2.5 text-[10.5px] font-bold" onClick={() => onRetryCrm(card.id)}>
                      Retry Sync
                    </button>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button className="mira-btn mira-btn-secondary text-xs font-bold" onClick={() => handleToggleRead(card)}>
                    {card.is_read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-violet-400" />}
                    {card.is_read ? 'Mark Unread' : 'Mark Read'}
                  </button>

                  {card.screenshot_path && (
                    <button className="mira-btn mira-btn-secondary text-xs font-bold" onClick={() => onViewScreenshot(card.screenshot_path)}>
                      <Image className="w-3.5 h-3.5 text-sky-400" />
                      Page Capture
                    </button>
                  )}

                  <button
                    className="mira-btn mira-btn-cyan text-xs font-extrabold"
                    onClick={() => onViewVisualDiff && onViewVisualDiff(card.id)}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Visual Snapshot Diff
                  </button>

                  <button
                    className="mira-btn mira-btn-primary text-xs font-extrabold"
                    onClick={() => {
                      onViewDiff(card.summary + "\n\nRECOMMENDED ACTION:\n" + card.recommendation);
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Analysis Log
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
      <div className="space-y-6">
        <div className="h-8 w-48 mira-skeleton rounded-lg"></div>
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mira-glass p-8 border-l-4 border-rose-500 space-y-4">
        <h3 className="text-lg font-bold text-rose-400">Error Loading Competitor Details</h3>
        <p className="text-slate-300 text-sm">{error || 'No competitor data found.'}</p>
        <button className="mira-btn mira-btn-secondary text-xs" onClick={onBack}>
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  const { competitor, history, latestScrape } = data;

  const renderTrendChart = () => {
    const scoredHistory = [...history]
      .filter(c => c.impact_score)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (scoredHistory.length < 2) {
      return (
        <div className="p-8 text-center rounded-xl bg-[#070912] border border-white/10 text-slate-400 text-xs font-medium">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-violet-400" />
          Trend Chart requires at least 2 historical changes to display score progression.
        </div>
      );
    }

    const width = 600;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = scoredHistory.map((item, idx) => {
      const x = paddingLeft + (idx / (scoredHistory.length - 1)) * chartWidth;
      const scoreFraction = (item.impact_score - 1) / 9;
      const y = paddingTop + chartHeight - scoreFraction * chartHeight;
      return { x, y, score: item.impact_score, date: new Date(item.timestamp).toLocaleDateString() };
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="mira-glass p-5 space-y-3 border-violet-500/20">
        <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Historical Impact Score Trend (1–10)
        </h4>
        <div className="h-44 w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="miraObsidianChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[1, 5, 10].map(score => {
              const scoreFraction = (score - 1) / 9;
              const y = paddingTop + chartHeight - scoreFraction * chartHeight;
              return (
                <g key={score}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={y + 3} fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{score}</text>
                </g>
              );
            })}

            {points.length > 0 && (
              <path
                d={`${pathData} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`}
                fill="url(#miraObsidianChartGradient)"
              />
            )}

            <path d={pathData} fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="#090A0F" stroke="#38BDF8" strokeWidth="2.5" />
                <title>{`Score: ${p.score} (${p.date})`}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button className="mira-btn mira-btn-secondary text-xs font-bold" onClick={onBack}>
        &larr; Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2.5xl font-black text-white font-['Outfit']">{competitor.name}</h1>
            <span className="mira-badge-emerald px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase">{competitor.status}</span>
          </div>
          <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 font-mono flex items-center gap-1 mt-1 hover:underline font-semibold">
            {competitor.url} <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="mira-btn mira-btn-emerald text-xs font-bold"
            onClick={async () => {
              await onCheckNow(competitor.id);
              setTimeout(() => fetchCompetitorData(), 15000);
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Scrape Now
          </button>
          <button className="mira-btn mira-btn-danger text-xs font-bold" onClick={() => onDelete(competitor.id)}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete Target
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: History & Trends (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {renderTrendChart()}

          {/* Change History Timeline */}
          <div className="mira-glass p-5 space-y-4 border-violet-500/20">
            <h3 className="text-base font-bold text-white font-['Outfit']">Change History Log</h3>
            {history.length === 0 ? (
              <p className="text-slate-400 text-xs">No intelligence events recorded yet for this competitor.</p>
            ) : (
              <div className="space-y-2.5">
                {history.map(card => (
                  <div key={card.id} className="p-4 rounded-xl bg-[#070912] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="mira-badge-cyan font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">{card.category}</span>
                      <span className="text-xs font-bold font-mono text-violet-300">
                        Impact: {card.impact_score}/10
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                      {card.summary ? card.summary.split('\n')[0] : ''}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Checked: {new Date(card.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw Scrape Logs */}
          <div className="mira-glass p-5 space-y-4">
            <h3 className="text-base font-bold text-white font-['Outfit']">Latest Raw Scrape Snapshot</h3>
            {latestScrape ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Scrape Timestamp: <strong className="font-mono text-violet-300">{new Date(latestScrape.timestamp).toLocaleString()}</strong>
                </p>
                {latestScrape.screenshot_path && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase">Page Visual Archive</span>
                    <img
                      src={latestScrape.screenshot_path}
                      className="rounded-xl border border-white/15 hover:border-violet-500/40 transition-all cursor-pointer max-w-sm shadow-xl"
                      alt="Capture Preview"
                      onClick={() => window.open(latestScrape.screenshot_path, '_blank')}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">No raw scrapes recorded yet. Click "Check Scrape Now" above.</p>
            )}
          </div>
        </div>

        {/* Right Column: Configs & Data Enrichment (Span 4) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Configuration Form */}
          <div className="mira-glass p-5 space-y-4 border-violet-500/20">
            <h3 className="text-base font-bold text-white font-['Outfit'] pb-2.5 border-b border-white/10">
              Monitoring Configuration
            </h3>
            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Competitor Label Name</label>
                <input
                  type="text"
                  className="mira-input text-xs font-semibold"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Scrape Frequency (Hours)</label>
                <select
                  className="mira-select text-xs font-semibold"
                  value={form.interval_hours}
                  onChange={e => setForm({ ...form, interval_hours: parseInt(e.target.value, 10) })}
                >
                  <option value={6}>6 hours (Recommended)</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours (Daily)</option>
                  <option value={168}>168 hours (Weekly)</option>
                </select>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Extraction Scope</label>
                <select
                  className="mira-select text-xs font-semibold"
                  value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value })}
                >
                  <option value="full">Full Page Content</option>
                  <option value="pricing">Pricing Section Only</option>
                  <option value="careers">Careers & Jobs Section</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={form.js_enabled}
                  onChange={e => setForm({ ...form, js_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 text-violet-500 bg-black/60"
                />
                Execute JS (Headless Chromium)
              </label>

              <button type="submit" className="mira-btn mira-btn-primary w-full text-xs font-black py-2.5">
                Save Configurations
              </button>
            </form>
          </div>

          {/* Tech Stack Data Enrichment */}
          {(() => {
            let enrichment = null;
            if (competitor.enrichment_data) {
              try {
                enrichment = JSON.parse(competitor.enrichment_data);
              } catch (e) { }
            }
            if (!enrichment) return null;
            return (
              <div className="mira-glass p-5 space-y-3 border-sky-500/20">
                <h4 className="text-xs font-bold uppercase text-sky-400 tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
                  <Server className="w-3.5 h-3.5 text-sky-400" />
                  Tech Stack Data Enrichment
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold">Server Header:</span>
                    <div className="font-mono text-violet-300 text-xs font-bold mt-1 bg-[#070912] px-2.5 py-1 rounded border border-white/10">{enrichment.serverHeader || 'Unknown'}</div>
                  </div>
                  {enrichment.xPoweredBy && (
                    <div>
                      <span className="text-slate-400 font-semibold">Powered By:</span>
                      <div className="font-mono text-sky-300 text-xs font-bold mt-1 bg-[#070912] px-2.5 py-1 rounded border border-white/10">{enrichment.xPoweredBy}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 font-semibold">DNS A Records (IPs):</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {enrichment.ipAddresses && enrichment.ipAddresses.length > 0 ? (
                        enrichment.ipAddresses.map((ip, i) => (
                          <span key={i} className="mira-badge-cyan font-mono text-[10px] px-2 py-0.5 rounded">{ip}</span>
                        ))
                      ) : (
                        <span className="text-slate-500">None resolved</span>
                      )}
                    </div>
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
// PAGE COMPONENT: SETTINGS & CONFIGURATIONS
// ----------------------------------------------------
function SettingsPage({
  settings,
  profile,
  feedCards,
  onSaveSettings,
  onTestEmail,
  onRetryCrm,
  onRegenerateKey,
  onUpdateProfile,
  workspaceId
}) {
  const [profileForm, setProfileForm] = useState({
    business_name: profile?.business_name || '',
    product_desc: profile?.product_desc || '',
    customers: profile?.customers || '',
    price_point: profile?.price_point || ''
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
  const [outboundWebhookUrl, setOutboundWebhookUrl] = useState(settings?.outbound_webhook_url || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        business_name: profile.business_name || '',
        product_desc: profile.product_desc || '',
        customers: profile.customers || '',
        price_point: profile.price_point || ''
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
      setOutboundWebhookUrl(settings.outbound_webhook_url || '');
    }
  }, [settings]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    alert('Business Profile context updated successfully!');
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      digest_schedule: schedule,
      semantic_threshold: threshold,
      email_config: emailForm,
      crm_config: crmForm,
      slack_webhook_url: slackWebhookUrl,
      outbound_webhook_url: outboundWebhookUrl
    });
  };

  const failedCards = feedCards.filter(c => c.crm_sync_status === 'failed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2.5xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-violet-400" />
          Configurations & Integrations
        </h1>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          Manage extension API keys, CRMs, email digest SMTP settings, and business profile parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Extensions & Business Context */}
        <div className="space-y-6">
          {/* Shareable Workspace Link */}
          <div className="mira-glass p-5 space-y-3 border-violet-500/20">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-violet-400" />
              Isolated Workspace Session URL
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Bookmark or share this unique session URL to access this specific workspace context.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#070912] border border-white/10 font-mono text-xs text-violet-300">
              <span className="truncate max-w-xs">{window.location.origin + window.location.pathname + "?w=" + workspaceId}</span>
              <button
                className="mira-btn mira-btn-secondary text-xs py-1 px-2.5 font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + window.location.pathname + "?w=" + workspaceId);
                  alert('Workspace URL copied!');
                }}
              >
                <Copy className="w-3.5 h-3.5 text-violet-400" />
                Copy
              </button>
            </div>
          </div>

          {/* Chrome Extension Key */}
          <div className="mira-glass p-5 space-y-3.5 border-sky-500/20">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              Chrome Extension API Key
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Paste this key into your Chrome Extension popup to authorize instant page tracking.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#070912] border border-white/10 font-mono text-xs text-sky-300 font-bold">
              <span>{settings?.api_key || 'No Key Configured'}</span>
              <button
                className="mira-btn mira-btn-secondary text-xs py-1 px-2.5 font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(settings.api_key);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                {copiedKey ? 'Copied' : 'Copy Key'}
              </button>
            </div>
            <button className="mira-btn mira-btn-danger text-xs py-1.5 font-bold" onClick={onRegenerateKey}>
              Regenerate API Key
            </button>
          </div>

          {/* Business Profile Context */}
          <div className="mira-glass p-5 space-y-4 border-emerald-500/20">
            <h3 className="text-base font-bold text-white font-['Outfit'] pb-2.5 border-b border-white/10">
              Business Profile Context
            </h3>
            <form onSubmit={handleProfileSubmit} className="space-y-3.5">
              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Business Name</label>
                <input
                  type="text"
                  className="mira-input text-xs font-semibold"
                  value={profileForm.business_name}
                  onChange={e => setProfileForm({ ...profileForm, business_name: e.target.value })}
                  required
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Product Description</label>
                <textarea
                  className="mira-textarea text-xs font-semibold"
                  rows="3"
                  value={profileForm.product_desc}
                  onChange={e => setProfileForm({ ...profileForm, product_desc: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Target Customers</label>
                <input
                  type="text"
                  className="mira-input text-xs font-semibold"
                  value={profileForm.customers}
                  onChange={e => setProfileForm({ ...profileForm, customers: e.target.value })}
                  required
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Pricing Structure</label>
                <input
                  type="text"
                  className="mira-input text-xs font-semibold"
                  value={profileForm.price_point}
                  onChange={e => setProfileForm({ ...profileForm, price_point: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="mira-btn mira-btn-emerald w-full text-xs font-black py-2.5">
                Update Business Profile Context
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: General Parameters & Integrations */}
        <div className="space-y-6">
          <form onSubmit={handleGeneralSubmit} className="space-y-6">
            {/* General Alert Parameters */}
            <div className="mira-glass p-5 space-y-4 border-violet-500/20">
              <h3 className="text-base font-bold text-white font-['Outfit'] pb-2.5 border-b border-white/10">
                General Scrapes & Alert Parameters
              </h3>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Semantic Change Threshold (0.0 – 1.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="mira-input text-xs font-semibold"
                  value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  required
                />
                <div className="text-[10.5px] text-slate-400 mt-1 font-medium">
                  Default 0.85. Higher values require larger content differences to trigger alerts.
                </div>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Digest Email Frequency</label>
                <select
                  className="mira-select text-xs font-semibold"
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                >
                  <option value="daily">Daily Email Summary</option>
                  <option value="weekly">Weekly Email Summary</option>
                </select>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Slack / Discord Webhook URL</label>
                <input
                  type="url"
                  className="mira-input text-xs font-semibold"
                  value={slackWebhookUrl}
                  onChange={e => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Outbound Webhook URL</label>
                <p className="text-slate-500 text-[10px] mb-1.5">Fires on every detected change · Compatible with Zapier, Make, n8n, Discord, and any HTTP endpoint</p>
                <input
                  type="url"
                  className="mira-input text-xs font-semibold"
                  value={outboundWebhookUrl}
                  onChange={e => setOutboundWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </div>
            </div>

            {/* Email SMTP Config */}
            <div className="mira-glass p-5 space-y-4 border-sky-500/20">
              <h3 className="text-base font-bold text-white font-['Outfit'] pb-2.5 border-b border-white/10">
                Digest SMTP Email Configuration
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="mira-form-group">
                  <label className="mira-form-label text-xs">SMTP Host</label>
                  <input
                    type="text"
                    className="mira-input text-xs font-semibold"
                    value={emailForm.smtp_host}
                    onChange={e => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="mira-form-group">
                  <label className="mira-form-label text-xs">SMTP Port</label>
                  <input
                    type="number"
                    className="mira-input text-xs font-semibold"
                    value={emailForm.smtp_port}
                    onChange={e => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value, 10) })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Password / Resend Key</label>
                <input
                  type="password"
                  className="mira-input text-xs font-semibold"
                  value={emailForm.smtp_pass}
                  onChange={e => setEmailForm({ ...emailForm, smtp_pass: e.target.value })}
                  placeholder="••••••••••••••••"
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Digest Recipient Email</label>
                <input
                  type="email"
                  className="mira-input text-xs font-semibold"
                  value={emailForm.recipient_email}
                  onChange={e => setEmailForm({ ...emailForm, recipient_email: e.target.value })}
                  placeholder="manager@mycompany.com"
                />
              </div>

              <button
                type="button"
                className="mira-btn mira-btn-secondary text-xs font-bold"
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
                <Send className="w-3.5 h-3.5 text-sky-400" />
                {isSendingEmail ? 'Sending Test Email...' : 'Send Test Digest Now'}
              </button>
            </div>

            {/* CRM Config */}
            <div className="mira-glass p-5 space-y-4 border-violet-500/20">
              <h3 className="text-base font-bold text-white font-['Outfit'] pb-2.5 border-b border-white/10">
                Automated CRM Synchronization
              </h3>

              <div className="mira-form-group">
                <label className="mira-form-label text-xs">Active CRM Target</label>
                <select
                  className="mira-select text-xs font-semibold"
                  value={crmForm.active_crm}
                  onChange={e => setCrmForm({ ...crmForm, active_crm: e.target.value })}
                >
                  <option value="none">Disabled (Local DB Only)</option>
                  <option value="notion">Notion Database</option>
                  <option value="airtable">Airtable Base</option>
                </select>
              </div>

              {crmForm.active_crm === 'notion' && (
                <div className="space-y-3 pt-1">
                  <div className="mira-form-group">
                    <label className="mira-form-label text-xs">Notion Token</label>
                    <input
                      type="password"
                      className="mira-input text-xs font-semibold"
                      value={crmForm.notion_token}
                      onChange={e => setCrmForm({ ...crmForm, notion_token: e.target.value })}
                      placeholder="secret_••••••••••••••••"
                    />
                  </div>
                  <div className="mira-form-group">
                    <label className="mira-form-label text-xs">Notion Database ID</label>
                    <input
                      type="text"
                      className="mira-input text-xs font-semibold"
                      value={crmForm.notion_db_id}
                      onChange={e => setCrmForm({ ...crmForm, notion_db_id: e.target.value })}
                      placeholder="5d5a7d77b8b..."
                    />
                  </div>
                </div>
              )}

              {crmForm.active_crm === 'airtable' && (
                <div className="space-y-3 pt-1">
                  <div className="mira-form-group">
                    <label className="mira-form-label text-xs">Airtable PAT Token</label>
                    <input
                      type="password"
                      className="mira-input text-xs font-semibold"
                      value={crmForm.airtable_key}
                      onChange={e => setCrmForm({ ...crmForm, airtable_key: e.target.value })}
                      placeholder="pat.••••••••••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="mira-form-group">
                      <label className="mira-form-label text-xs">Base ID</label>
                      <input
                        type="text"
                        className="mira-input text-xs font-semibold"
                        value={crmForm.airtable_base_id}
                        onChange={e => setCrmForm({ ...crmForm, airtable_base_id: e.target.value })}
                        placeholder="app••••••••••••"
                      />
                    </div>
                    <div className="mira-form-group">
                      <label className="mira-form-label text-xs">Table Name</label>
                      <input
                        type="text"
                        className="mira-input text-xs font-semibold"
                        value={crmForm.airtable_table_name}
                        onChange={e => setCrmForm({ ...crmForm, airtable_table_name: e.target.value })}
                        placeholder="Competitor Intel"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="mira-btn mira-btn-primary w-full text-xs font-black py-3 shadow-lg">
              Save All General Configurations
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL COMPONENT: ADD COMPETITOR TARGET
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
    <div className="mira-modal-backdrop" onClick={onClose}>
      <div className="mira-glass mira-modal-card border-2 border-violet-500/50 shadow-2xl p-8 max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
          <h2 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
            <Plus className="w-6 h-6 text-violet-400" />
            Register Competitor Target URL
          </h2>
          <button className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mira-form-group">
            <label className="mira-form-label text-sm font-extrabold text-slate-300">Competitor Label Name</label>
            <input
              type="text"
              className="mira-input text-base font-semibold py-3 px-4"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme SaaS"
              required
            />
          </div>

          <div className="mira-form-group">
            <label className="mira-form-label text-sm font-extrabold text-slate-300">Target Page URL</label>
            <input
              type="url"
              className="mira-input text-base font-semibold py-3 px-4"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://acme.com/pricing"
              required
            />
          </div>

          <div className="mira-form-group">
            <label className="mira-form-label text-sm font-extrabold text-slate-300">Scrape Frequency (Interval)</label>
            <select
              className="mira-select text-base font-semibold py-3 px-4"
              value={form.interval_hours}
              onChange={e => setForm({ ...form, interval_hours: parseInt(e.target.value, 10) })}
            >
              <option value={6}>Every 6 Hours (Recommended)</option>
              <option value={12}>Every 12 Hours</option>
              <option value={24}>Every 24 Hours (Daily)</option>
              <option value={168}>Every Week</option>
            </select>
          </div>

          <div className="mira-form-group">
            <label className="mira-form-label text-sm font-extrabold text-slate-300">Extraction Scope</label>
            <select
              className="mira-select text-base font-semibold py-3 px-4"
              value={form.scope}
              onChange={e => setForm({ ...form, scope: e.target.value })}
            >
              <option value="full">Full Page Content</option>
              <option value="pricing">Pricing Section Only</option>
              <option value="careers">Careers & Jobs Section</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-200 py-1">
            <input
              type="checkbox"
              checked={form.js_enabled}
              onChange={e => setForm({ ...form, js_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 text-violet-500 bg-black/60"
            />
            Render Dynamic Javascript (Headless Chromium)
          </label>

          <div className="flex gap-4 pt-3">
            <button type="button" className="mira-btn mira-btn-secondary flex-1 text-base font-bold py-3.5" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="mira-btn mira-btn-primary flex-1 text-base font-black py-3.5">
              Add & Scan Target
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL COMPONENT: DIFF ANALYSIS DRAWER
// ----------------------------------------------------
function DiffModal({ diffText, onClose }) {
  const lines = diffText.split('\n');

  return (
    <div className="mira-modal-backdrop" onClick={onClose}>
      <div className="mira-glass mira-modal-card max-w-2xl border-violet-500/30" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <h2 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-violet-400" />
            Detailed Analysis Log
          </h2>
          <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#070912] border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 shadow-inner">
          {lines.map((line, idx) => {
            if (line.startsWith('+ ')) {
              return <div key={idx} className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">{line}</div>;
            } else if (line.startsWith('- ')) {
              return <div key={idx} className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-semibold">{line}</div>;
            } else {
              return <div key={idx} className="text-slate-300 px-2 py-0.5">{line}</div>;
            }
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button className="mira-btn mira-btn-primary text-xs font-bold" onClick={onClose}>
            Close Analysis Log
          </button>
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
    <div className="mira-modal-backdrop" onClick={onClose}>
      <div className="relative flex flex-col items-center max-w-4xl" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-slate-300 hover:text-white text-3xl font-bold"
        >
          &times;
        </button>
        <img
          src={url}
          className="max-w-full max-h-[80vh] rounded-xl border border-white/20 shadow-2xl"
          alt="Visual Archive Capture"
        />
        <div className="mt-3 text-slate-200 bg-black/80 px-4 py-1.5 rounded-full text-xs font-mono border border-white/15 font-bold shadow-xl">
          Visual Page Capture — Timestamped Snapshot
        </div>
      </div>
    </div>
  );
}
