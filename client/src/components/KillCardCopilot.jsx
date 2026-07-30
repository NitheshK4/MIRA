import React, { useState, useEffect, useMemo } from 'react';
import {
  Swords,
  Zap,
  Clock,
  Target,
  ShieldAlert,
  Search,
  Copy,
  Check,
  MessageSquare,
  Flame,
  Filter,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Lock,
  Layers,
  HelpCircle,
  Share2,
  Brain
} from 'lucide-react';

// Default Curated Objections Database for Live Sales Warfare
const DEFAULT_KILL_CARDS = [
  {
    id: 'kc-1',
    competitor: 'HubSpot',
    category: 'Pricing & ROI',
    severity: 'CRITICAL',
    title: 'Prospect says HubSpot is 40% cheaper on starter tier',
    objection: '"HubSpot gives us CRM + Email Marketing for $45/mo while MIRA is priced higher."',
    winRate: 89,
    verbatimScript: [
      'Acknowledge the entry price: "HubSpot Starter looks low upfront, but their contact tier caps hit at 1,000 leads."',
      'Pivot to total cost of ownership: "Once you cross 5,000 contacts, HubSpot jumps by 300% to $800/month with mandatory onboarding fees."',
      'Highlight MIRA value: "MIRA includes unlimited contacts, automated diff tracking, and AI battlecards with zero contact cap penalties."'
    ],
    landmineQuestions: [
      'Ask them: "How much does HubSpot charge per additional 5,000 contacts once your database grows?"',
      'Ask them: "Is their onboarding fee mandatory ($1,500+) even if you don\'t use their implementation team?"'
    ],
    evidence: [
      'HubSpot Marketing Hub Pro requires mandatory $3,000 onboarding fee.',
      'HubSpot contact escalation tier: 10,000 contacts = $890/mo vs MIRA flat scale.'
    ],
    keyWeakness: 'Hidden tier ramp pricing & mandatory $3K onboarding tax.'
  },
  {
    id: 'kc-2',
    competitor: 'Salesforce',
    category: 'Feature Gap',
    severity: 'HIGH',
    title: 'Prospect claims Salesforce Einstein does competitor tracking automatically',
    objection: '"We already have Salesforce Sales Cloud + Einstein AI, why do we need MIRA?"',
    winRate: 92,
    verbatimScript: [
      'Clarify scope: "Einstein analyzes your existing internal pipeline emails, but it does zero external web scraping or competitor diff tracking."',
      'Expose execution delay: "Einstein won\'t alert you when your competitor changes pricing or drops a feature flag on their site today."',
      'Position MIRA integration: "MIRA acts as the external intelligence radar feeding live competitor battlecards directly into your Salesforce records in real time."'
    ],
    landmineQuestions: [
      'Ask them: "Does Einstein automatically notify your reps when Competitor A removes pricing from their landing page?"',
      'Ask them: "How long does it take your Salesforce admin to build custom competitor battlecards for new reps?"'
    ],
    evidence: [
      'Salesforce Einstein lacks autonomous DOM/visual page diff capabilities.',
      'MIRA syncs live battlecards into Salesforce CRM fields via 1-click webhook.'
    ],
    keyWeakness: 'Zero external competitive web scraping or real-time page diff monitoring.'
  },
  {
    id: 'kc-3',
    competitor: 'Gong.io',
    category: 'Feature Gap',
    severity: 'MEDIUM',
    title: 'Prospect mentions Gong already tracks competitor name mentions in calls',
    objection: '"Gong records our calls and alerts us whenever a competitor is named in a pitch."',
    winRate: 85,
    verbatimScript: [
      'Value addition: "Gong is fantastic for post-call audio transcription, but it\'s reactive—you only find out after the call is over."',
      'Real-time advantage: "MIRA gives your reps live, 15-second Kill Cards DURING the call before the prospect moves on to the next topic."',
      'Synergy: "Use Gong for coaching reviews, use MIRA for real-time live sales call victory."'
    ],
    landmineQuestions: [
      'Ask them: "Can Gong give your sales rep the exact counter-script to say while the prospect is still on the line?"',
      'Ask them: "Does Gong automatically detect when a competitor launches a new product feature overnight?"'
    ],
    evidence: [
      'Gong post-call processing takes 15-30 minutes after call ends.',
      'MIRA Kill Cards render in <200ms for instant real-time response.'
    ],
    keyWeakness: 'Reactive post-call audio analysis vs MIRA live real-time execution.'
  },
  {
    id: 'kc-4',
    competitor: 'Highspot',
    category: 'Security & Compliance',
    severity: 'HIGH',
    title: 'Prospect raises Enterprise Security / SOC2 Compliance requirements',
    objection: '"Is your AI models training on our customer data or pipeline information?"',
    winRate: 95,
    verbatimScript: [
      'Zero-data retention guarantee: "MIRA uses enterprise Gemini API endpoints with zero data retention and strict zero-training compliance."',
      'Local execution option: "All scraping telemetry and battlecards are stored within your private workspace isolated by encrypted tenant IDs."',
      'Audit readiness: "We provide complete SOC2 Type II alignment and complete audit log exportability."'
    ],
    landmineQuestions: [
      'Ask them: "Do your legacy enablement tools allow local LLM deployment behind your private VPC?"',
      'Ask them: "Are your current vendors training public foundation models on your internal sales transcripts?"'
    ],
    evidence: [
      'MIRA uses Google Gemini Enterprise API with zero data training agreement.',
      'Workspace data isolated via AES-256 equivalent workspace scoping.'
    ],
    keyWeakness: 'Legacy CMS vendors lock customer data in shared multi-tenant clouds.'
  },
  {
    id: 'kc-5',
    competitor: 'Seismic',
    category: 'Migration & Onboarding',
    severity: 'CRITICAL',
    title: 'Prospect concerned about 6-month deployment timeline of traditional tools',
    objection: '"We spent 9 months setting up Seismic, we don\'t have bandwidth for another long rollout."',
    winRate: 94,
    verbatimScript: [
      'Instant Time-To-Value: "MIRA deploys in under 5 minutes. You input competitor URLs, and our AI builds the initial battlecards instantly."',
      'Zero admin maintenance: "Traditional tools require a full-time Enablement Manager to update PDF battlecards. MIRA auto-updates battlecards when competitor websites change."',
      'Proof of concept: "We can run a 48-hour live trial with your top 3 competitor targets right now."'
    ],
    landmineQuestions: [
      'Ask them: "How many hours per week does your team spend manually updating outdated PDF battlecards?"',
      'Ask them: "When did your enablement team last update your competitor pricing battlecards?"'
    ],
    evidence: [
      'Average Seismic implementation requires 12-16 weeks of consultancy.',
      'MIRA initial setup time: 3 minutes per competitor target.'
    ],
    keyWeakness: 'High administrative overhead & slow manual content updates.'
  }
];

export default function KillCardCopilot({ competitors = [], onOpenOracle }) {
  // Timer State for Live Call
  const [isCallActive, setIsCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedComp, setSelectedComp] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState('kc-1');

  // Custom Kill Card Modal State
  const [customCards, setCustomCards] = useState(() => {
    try {
      const saved = localStorage.getItem('mira_custom_kill_cards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    competitor: 'HubSpot',
    category: 'Pricing & ROI',
    severity: 'HIGH',
    title: '',
    objection: '',
    scriptText: '',
    questionText: '',
    evidenceText: ''
  });

  // Call Timer Effect
  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Combine Default & Custom Cards
  const allCards = useMemo(() => {
    return [...customCards, ...DEFAULT_KILL_CARDS];
  }, [customCards]);

  // Categories list
  const categories = ['ALL', 'Pricing & ROI', 'Feature Gap', 'Security & Compliance', 'Migration & Onboarding'];

  // Competitors list
  const compOptions = useMemo(() => {
    const set = new Set(allCards.map((c) => c.competitor));
    competitors.forEach((comp) => set.add(comp.name));
    return ['ALL', ...Array.from(set)];
  }, [allCards, competitors]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchesSearch =
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.objection.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.competitor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.verbatimScript.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || card.category === selectedCategory;
      const matchesComp = selectedComp === 'ALL' || card.competitor === selectedComp;

      return matchesSearch && matchesCat && matchesComp;
    });
  }, [allCards, searchTerm, selectedCategory, selectedComp]);

  // Copy Handler
  const handleCopyScript = (id, text, type = 'Script') => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Custom Card
  const handleCreateCard = (e) => {
    e.preventDefault();
    if (!newCard.title || !newCard.objection || !newCard.scriptText) return;

    const created = {
      id: `custom-${Date.now()}`,
      competitor: newCard.competitor,
      category: newCard.category,
      severity: newCard.severity,
      title: newCard.title,
      objection: `"${newCard.objection}"`,
      winRate: Math.floor(Math.random() * 15) + 85,
      verbatimScript: newCard.scriptText.split('\n').filter(Boolean),
      landmineQuestions: newCard.questionText ? newCard.questionText.split('\n').filter(Boolean) : ['Ask for proof of implementation timeline.'],
      evidence: newCard.evidenceText ? newCard.evidenceText.split('\n').filter(Boolean) : ['Verified internal benchmark.'],
      keyWeakness: 'Custom competitive insight added during live call.'
    };

    const updated = [created, ...customCards];
    setCustomCards(updated);
    try {
      localStorage.setItem('mira_custom_kill_cards', JSON.stringify(updated));
    } catch (err) {}

    setIsAddModalOpen(false);
    setNewCard({
      competitor: 'HubSpot',
      category: 'Pricing & ROI',
      severity: 'HIGH',
      title: '',
      objection: '',
      scriptText: '',
      questionText: '',
      evidenceText: ''
    });
  };

  return (
    <div className="app-container" style={{ paddingBottom: 60 }}>
      {/* Top Banner / Call Telemetry HUD */}
      <div
        className="mira-glass"
        style={{
          padding: '20px 26px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 100%)',
          border: '1.5px solid rgba(0, 240, 255, 0.35)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.50), 0 0 25px rgba(0,240,255,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #00F0FF 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.50)'
            }}
          >
            <Swords size={26} color="#000000" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                Live Sales Objection "Kill Card" Co-Pilot
              </h1>
              <span
                className="badge"
                style={{
                  background: 'rgba(0, 240, 255, 0.18)',
                  color: '#00F0FF',
                  border: '1px solid rgba(0, 240, 255, 0.40)'
                }}
              >
                <Zap size={11} /> LIVE EXECUTION
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              Real-time 15-second objection scripts, landmine questions & verified evidence snippets for active pitch calls.
            </p>
          </div>
        </div>

        {/* Live Call Telemetry Timer HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(0,0,0,0.40)', padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isCallActive ? '#00FF94' : '#94A3B8',
                boxShadow: isCallActive ? '0 0 10px #00FF94' : 'none'
              }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900, color: isCallActive ? '#00FF94' : '#F8FAFC' }}>
              {formatTimer(callSeconds)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={isCallActive ? 'mira-btn-danger mira-btn-sm' : 'mira-btn-emerald mira-btn-sm'}
              onClick={() => setIsCallActive(!isCallActive)}
              style={{ padding: '6px 14px' }}
            >
              {isCallActive ? <Pause size={13} /> : <Play size={13} />}
              {isCallActive ? 'PAUSE CALL' : 'START CALL'}
            </button>

            <button
              type="button"
              className="mira-btn-secondary mira-btn-sm"
              onClick={() => {
                setIsCallActive(false);
                setCallSeconds(0);
              }}
              title="Reset Timer"
              style={{ padding: '6px 10px' }}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Category Filters + Add Objection Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 26 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search objections (e.g. 'HubSpot is cheaper', 'No SOC2', 'Einstein AI')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(0, 240, 255, 0.25)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.5)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Competitor Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} color="#00F0FF" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8' }}>TARGET:</span>
            <select
              value={selectedComp}
              onChange={(e) => setSelectedComp(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: '#0F172A',
                border: '1.5px solid rgba(0, 240, 255, 0.30)',
                color: '#00F0FF',
                fontSize: 13.5,
                fontWeight: 800,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {compOptions.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? '⚡ ALL COMPETITORS' : `🎯 ${c}`}
                </option>
              ))}
            </select>
          </div>

          {/* Add Custom Objection Button */}
          <button
            type="button"
            className="mira-btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ padding: '10px 18px', fontSize: 13 }}
          >
            <Plus size={15} /> ADD LIVE KILL CARD
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                background: selectedCategory === cat ? 'linear-gradient(135deg, #00F0FF 0%, #3B82F6 100%)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? '#000000' : '#94A3B8',
                border: selectedCategory === cat ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: selectedCategory === cat ? '0 0 16px rgba(0, 240, 255, 0.40)' : 'none'
              }}
            >
              {cat === 'ALL' ? '🔥 All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Kill Cards Feed */}
      {filteredCards.length === 0 ? (
        <div
          className="mira-glass"
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.60)'
          }}
        >
          <HelpCircle size={42} color="#94A3B8" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>No Kill Cards match your search filter</h3>
          <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 6, maxWidth: 450, margin: '6px auto 16px' }}>
            Try searching for terms like "pricing", "HubSpot", or "compliance", or add a custom kill card for your prospect call.
          </p>
          <button type="button" className="mira-btn-cyan" onClick={() => setSearchTerm('')}>
            Reset Search Filter
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredCards.map((card) => {
            const isExpanded = expandedId === card.id;

            return (
              <div
                key={card.id}
                className="mira-glass"
                style={{
                  padding: '22px 26px',
                  background: isExpanded
                    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 100%)'
                    : 'rgba(18, 24, 48, 0.75)',
                  border: isExpanded ? '1.5px solid rgba(0, 240, 255, 0.50)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: isExpanded ? '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 25px rgba(0, 240, 255, 0.20)' : 'none'
                }}
              >
                {/* Card Header Bar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span
                        className="badge"
                        style={{
                          background: 'linear-gradient(135deg, #00F0FF 0%, #0284C7 100%)',
                          color: '#000000',
                          fontWeight: 900
                        }}
                      >
                        🎯 {card.competitor}
                      </span>

                      <span
                        className="badge"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#CBD5E1',
                          border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                      >
                        {card.category}
                      </span>

                      {card.severity === 'CRITICAL' && (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(255, 42, 109, 0.20)',
                            color: '#FF2A6D',
                            border: '1px solid rgba(255, 42, 109, 0.40)'
                          }}
                        >
                          <Flame size={11} /> CRITICAL OBJECTION
                        </span>
                      )}

                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={13} color="#00FF94" />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#00FF94', fontFamily: 'var(--font-mono)' }}>
                          {card.winRate}% WIN CONFIDENCE
                        </span>
                      </div>
                    </div>

                    <h2 style={{ fontSize: 17.5, fontWeight: 900, color: '#FFFFFF', margin: '4px 0 6px' }}>
                      {card.title}
                    </h2>

                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0, 0, 0, 0.40)',
                        borderLeft: '3px solid #00F0FF',
                        fontSize: 13.5,
                        fontStyle: 'italic',
                        color: '#94A3B8',
                        margin: '8px 0 12px'
                      }}
                    >
                      {card.objection}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="top-bar-icon-btn"
                    onClick={() => setExpandedId(isExpanded ? null : card.id)}
                    style={{ width: 38, height: 38, flexShrink: 0 }}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {/* Expanded Detailed Kill Card Content */}
                {isExpanded && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.10)' }}>
                    {/* Section 1: 15-Second Verbatim Counter-Script */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Zap size={16} color="#00F0FF" />
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#00F0FF', letterSpacing: '0.04em' }}>
                            ⚡ 15-SECOND VERBATIM COUNTER-SCRIPT (SAY THIS OUT LOUD)
                          </span>
                        </div>

                        <button
                          type="button"
                          className="mira-btn-cyan mira-btn-sm"
                          onClick={() => handleCopyScript(card.id, card.verbatimScript.join('\n\n'), 'Script')}
                          style={{ padding: '5px 12px', fontSize: 11.5 }}
                        >
                          {copiedId === `${card.id}-Script` ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === `${card.id}-Script` ? 'COPIED TO CLIPBOARD!' : 'COPY SCRIPT'}
                        </button>
                      </div>

                      <div
                        style={{
                          background: 'rgba(0, 240, 255, 0.05)',
                          border: '1.5px solid rgba(0, 240, 255, 0.25)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}
                      >
                        {card.verbatimScript.map((line, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: '#00F0FF',
                                color: '#000000',
                                fontSize: 12,
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 1
                              }}
                            >
                              {idx + 1}
                            </span>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.5, margin: 0 }}>
                              {line}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grid Section: Landmine Questions & Verified Evidence */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 18 }}>
                      {/* Landmine Questions */}
                      <div
                        style={{
                          background: 'rgba(255, 184, 0, 0.05)',
                          border: '1px solid rgba(255, 184, 0, 0.25)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 18px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Flame size={15} color="#FFB800" />
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#FFB800' }}>
                              💣 LANDMINE QUESTIONS TO ASK PROSPECT
                            </span>
                          </div>

                          <button
                            type="button"
                            className="mira-btn-secondary mira-btn-sm"
                            onClick={() => handleCopyScript(card.id, card.landmineQuestions.join('\n'), 'Questions')}
                            style={{ padding: '4px 10px', fontSize: 11 }}
                          >
                            {copiedId === `${card.id}-Questions` ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === `${card.id}-Questions` ? 'COPIED!' : 'COPY'}
                          </button>
                        </div>

                        <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {card.landmineQuestions.map((q, idx) => (
                            <li key={idx} style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.4 }}>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Verified Evidence & Benchmarks */}
                      <div
                        style={{
                          background: 'rgba(5, 255, 145, 0.05)',
                          border: '1px solid rgba(5, 255, 145, 0.25)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 18px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <CheckCircle2 size={15} color="#00FF94" />
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#00FF94' }}>
                            🛡️ VERIFIED PROOF & BENCHMARKS
                          </span>
                        </div>

                        <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {card.evidence.map((ev, idx) => (
                            <li key={idx} style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.4 }}>
                              {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        background: 'rgba(0, 0, 0, 0.35)',
                        padding: '12px 18px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={14} color="#FF2A6D" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>
                          Competitor Key Weakness: <strong style={{ color: '#FFFFFF' }}>{card.keyWeakness}</strong>
                        </span>
                      </div>

                      {onOpenOracle && (
                        <button
                          type="button"
                          className="mira-btn-primary mira-btn-sm"
                          onClick={() => onOpenOracle(`How do I counter ${card.competitor} when they mention ${card.title}?`)}
                          style={{ padding: '6px 14px', fontSize: 12 }}
                        >
                          <Brain size={13} /> ASK AI CO-PILOT MORE
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Custom Live Kill Card */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div
            className="mira-glass"
            style={{
              width: '100%',
              maxWidth: 600,
              padding: 28,
              background: '#0D152A',
              border: '1.5px solid rgba(0, 240, 255, 0.40)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 35px rgba(0,240,255,0.30)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Swords size={22} color="#00F0FF" />
                <h3 style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  Create Live Call Kill Card
                </h3>
              </div>
              <button
                type="button"
                className="top-bar-icon-btn"
                onClick={() => setIsAddModalOpen(false)}
                style={{ width: 34, height: 34 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Competitor Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HubSpot, Salesforce"
                    value={newCard.competitor}
                    onChange={(e) => setNewCard({ ...newCard, competitor: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.40)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Objection Category
                  </label>
                  <select
                    value={newCard.category}
                    onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 700
                    }}
                  >
                    <option value="Pricing & ROI">Pricing & ROI</option>
                    <option value="Feature Gap">Feature Gap</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                    <option value="Migration & Onboarding">Migration & Onboarding</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Objection Headline / Scenario
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prospect says competitor is launching free AI next week"
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.40)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Exact Customer Objection Quote
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 'We don't need MIRA because we use Gong for call reviews'"
                  value={newCard.objection}
                  onChange={(e) => setNewCard({ ...newCard, objection: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.40)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#00F0FF', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  ⚡ 15-Second Verbatim Counter Script (1 line per point)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Point 1: Acknowledge entry price&#10;Point 2: Expose hidden cost cap&#10;Point 3: Reframe value"
                  value={newCard.scriptText}
                  onChange={(e) => setNewCard({ ...newCard, scriptText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.40)',
                    border: '1px solid rgba(0, 240, 255, 0.30)',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#FFB800', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  💣 Landmine Questions (1 per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ask them: 'Does their tier include unlimited users?'&#10;Ask them: 'Is onboarding mandatory?'"
                  value={newCard.questionText}
                  onChange={(e) => setNewCard({ ...newCard, questionText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.40)',
                    border: '1px solid rgba(255, 184, 0, 0.30)',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="mira-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="mira-btn-primary">
                  Save Kill Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
