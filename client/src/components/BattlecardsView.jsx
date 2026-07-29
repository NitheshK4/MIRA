import React, { useState, useEffect, useMemo } from 'react';
import { 
  Swords, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  HelpCircle, 
  AlertTriangle, 
  DollarSign, 
  Download, 
  Edit3, 
  Save, 
  X, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Target,
  Zap,
  Lock,
  ArrowRight,
  Compass,
  FileText,
  Users,
  Megaphone
} from 'lucide-react';

export default function BattlecardsView({ workspaceId, competitors = [], onOpenPdfModal }) {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState(competitors[0]?.id || null);
  const [battlecards, setBattlecards] = useState({});
  const [loadingCard, setLoadingCard] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [pitchCopied, setPitchCopied] = useState(false);

  // BattleGuard active view tab: 'overview' | 'battleguard' | 'simulator'
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Interactive Objection Simulator state
  const [simQuery, setSimQuery] = useState('');
  const [simMatch, setSimMatch] = useState(null);

  // Sync selected competitor ID when competitors list changes
  useEffect(() => {
    if (!selectedCompetitorId && competitors.length > 0) {
      setSelectedCompetitorId(competitors[0].id);
    }
  }, [competitors, selectedCompetitorId]);

  // Fetch all battlecards on load or workspace change
  useEffect(() => {
    fetchBattlecards();
  }, [workspaceId]);

  const fetchBattlecards = async () => {
    try {
      setLoadingCard(true);
      const res = await fetch('/api/battlecards', {
        headers: { 'x-workspace-id': workspaceId }
      });
      if (res.ok) {
        const data = await res.json();
        const cardMap = {};
        data.forEach(c => {
          cardMap[c.competitor_id] = c;
        });
        setBattlecards(cardMap);
      }
    } catch (err) {
      console.error('Failed to load battlecards:', err);
    } finally {
      setLoadingCard(false);
    }
  };

  const activeCompetitorId = selectedCompetitorId || competitors[0]?.id || null;

  const handleGenerate = async (compId) => {
    const cid = compId || activeCompetitorId;
    if (!cid) {
      setGenError('No competitor selected.');
      return;
    }

    try {
      setGenerating(true);
      setGenError(null);
      const res = await fetch(`/api/battlecards/${cid}/generate`, {
        method: 'POST',
        headers: { 'x-workspace-id': workspaceId }
      });
      if (res.ok) {
        const card = await res.json();
        setBattlecards(prev => ({ ...prev, [cid]: card }));
        if (editMode) setEditMode(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        setGenError(errData.error || 'Failed to generate BattleGuard card.');
      }
    } catch (err) {
      console.error('Failed to generate BattleGuard card:', err);
      setGenError(err.message || 'Error communicating with server.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeCompetitorId || !editData) return;

    try {
      const res = await fetch(`/api/battlecards/${activeCompetitorId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId 
        },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        const updated = await res.json();
        setBattlecards(prev => ({ ...prev, [activeCompetitorId]: updated }));
        setEditMode(false);
      }
    } catch (err) {
      console.error('Failed to save BattleGuard edit:', err);
    }
  };

  const parseJsonField = (field, fallback = []) => {
    if (!field) return fallback;
    if (typeof field === 'object') return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return fallback;
    }
  };

  const currentCompetitor = competitors.find(c => String(c.id) === String(activeCompetitorId)) || competitors[0];
  const rawCard = activeCompetitorId ? battlecards[activeCompetitorId] : null;

  const cardData = useMemo(() => {
    if (!rawCard) return null;
    const bgParsed = parseJsonField(rawCard.battleguard, null);
    const bgData = bgParsed || {
      threat_level: 'MODERATE',
      defense_score: 84,
      threat_vectors: [`Competitor active on ${currentCompetitor?.url || 'target market'}`],
      defensive_tactics: [
        { vector: 'Pricing Defense', strategy: 'Highlight total cost of ownership, included seats, and zero hidden add-on fees.' },
        { vector: 'Feature Superiority Counter', strategy: 'Demonstrate our ONNX-driven change detection & zero-downtime CRM sync.' },
        { vector: 'Security & Compliance Guard', strategy: 'Provide SOC2 and compliance proof point documentation immediately.' }
      ],
      recommended_win_angle: 'Emphasize immediate 14-day ROI, zero hidden seat fees, and dedicated customer success.'
    };

    return {
      ...rawCard,
      strengths: parseJsonField(rawCard.strengths, []),
      weaknesses: parseJsonField(rawCard.weaknesses, []),
      why_we_win: parseJsonField(rawCard.why_we_win, []),
      objection_handling: parseJsonField(rawCard.objection_handling, []),
      landmines: parseJsonField(rawCard.landmines, []),
      switching_triggers: parseJsonField(rawCard.switching_triggers, []),
      battleguard: bgData
    };
  }, [rawCard, currentCompetitor]);

  const startEdit = () => {
    if (!cardData) return;
    setEditData({
      overview: cardData.overview || '',
      target_icp: cardData.target_icp || '',
      switching_triggers: cardData.switching_triggers || [],
      elevator_pitch: cardData.elevator_pitch || '',
      pricing_comparison: cardData.pricing_comparison || '',
      strengths: cardData.strengths,
      weaknesses: cardData.weaknesses,
      why_we_win: cardData.why_we_win,
      landmines: cardData.landmines,
      objection_handling: cardData.objection_handling,
      battleguard: cardData.battleguard
    });
    setEditMode(true);
  };

  const handleCopyText = (text, idxKey) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idxKey);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyPitch = (text) => {
    navigator.clipboard.writeText(text);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!currentCompetitor || !cardData) return;
    
    const bg = cardData.battleguard || {};
    const tacticsStr = (bg.defensive_tactics || []).map(t => `- **${t.vector}**: ${t.strategy}`).join('\n');
    const vectorsStr = (bg.threat_vectors || []).map(v => `- ${v}`).join('\n');

    const mdContent = `# BattleGuard Sales Playbook: Our Business vs ${currentCompetitor.name || 'Competitor'}
URL: ${currentCompetitor.url}
Generated At: ${cardData.last_generated_at || new Date().toISOString()}

## 🛡️ BattleGuard Defense Metrics
- **Defense Score**: ${bg.defense_score || 85}/100
- **Threat Level**: ${bg.threat_level || 'MODERATE'}
- **Recommended Win Angle**: ${bg.recommended_win_angle || 'N/A'}

### Active Threat Vectors
${vectorsStr || '- Standard competitive monitoring active.'}

### Tactical Defense Protocols
${tacticsStr || '- Maintain core value messaging.'}

---

## 📌 Competitive Overview
${cardData.overview}

## 🎯 Target Persona & Ideal Customer Profile (ICP)
${cardData.target_icp || 'N/A'}

## ⚡ Customer Switching Triggers
${(cardData.switching_triggers || []).map(t => `- ${t}`).join('\n')}

## 🗣️ 30-Second Elevator & Displacement Pitch
${cardData.elevator_pitch || 'N/A'}

## 🟩 Competitor Strengths & Advantages
${cardData.strengths.map(s => `- ${s}`).join('\n')}

## 🟥 Competitor Weaknesses & Vulnerabilities
${cardData.weaknesses.map(w => `- ${w}`).join('\n')}

## 🏆 Why We Win (Key Differentiators)
${cardData.why_we_win.map(w => `- ${w}`).join('\n')}

## 💰 Pricing Comparison
${cardData.pricing_comparison}

## 💣 Landmine Questions for Reps
${cardData.landmines.map(l => `- ${l}`).join('\n')}

## 🛡️ Objection Handling Scripts
${cardData.objection_handling.map(o => `### Prospect Claim: ${o.objection}\n**Winning Counter-Script**: ${o.response}\n`).join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battleguard_${(currentCompetitor.name || 'competitor').toLowerCase().replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run objection simulation lookup
  const handleSimulate = (queryText) => {
    setSimQuery(queryText);
    if (!queryText.trim() || !cardData) {
      setSimMatch(null);
      return;
    }
    const q = queryText.toLowerCase();
    const handlers = cardData.objection_handling || [];
    const bestMatch = handlers.find(h => 
      h.objection.toLowerCase().includes(q) || 
      q.split(' ').some(w => w.length > 3 && h.objection.toLowerCase().includes(w))
    ) || handlers[0];

    setSimMatch(bestMatch);
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ name: 'Notion', url: 'https://notion.so' })
      });
      await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ name: 'HubSpot', url: 'https://hubspot.com' })
      });
      window.location.reload();
    } catch (e) {
      console.error('Failed to seed demo competitors:', e);
    } finally {
      setSeeding(false);
    }
  };

  if (competitors.length === 0) {
    return (
      <div className="card-glass" style={{ padding: '48px', textAlign: 'center' }}>
        <ShieldCheck size={48} style={{ color: '#8B5CF6', marginBottom: '16px', opacity: 0.8 }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No Competitors Registered</h2>
        <p style={{ color: '#94A3B8', maxWidth: '480px', margin: '0 auto 24px auto', fontSize: '14px' }}>
          Add your first competitor URL in the Dashboard tab to initialize AI-powered BattleGuard defense playbooks.
        </p>
        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} />
          {seeding ? 'Adding Demo Competitors...' : 'Add Sample Demo Competitors'}
        </button>
      </div>
    );
  }

  const bg = cardData?.battleguard || {};
  const defenseScore = bg.defense_score || 85;
  const threatLevel = bg.threat_level || 'MODERATE';
  const scoreColor = defenseScore >= 80 ? '#34D399' : defenseScore >= 65 ? '#FBBF24' : '#F87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(56,189,248,0.2))', borderRadius: '12px', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  Battlecards & BattleGuard 🛡️
                </h1>
                <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                  v2.5 Defense Engine
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                Real-time competitive defense matrix, threat ratings, objection handlers, and sales counter-scripts.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {editMode ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10B981', borderColor: '#059669' }}
              >
                <Save size={15} /> Save Playbook
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={15} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleGenerate(activeCompetitorId)}
                disabled={generating}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {generating ? (
                  <RefreshCw size={15} className="spin-animation" />
                ) : (
                  <Sparkles size={15} />
                )}
                {generating ? 'Synthesizing BattleGuard...' : cardData ? 'Sync with AI' : 'Generate BattleGuard Playbook'}
              </button>
              {cardData && (
                <>
                  <button
                    onClick={startEdit}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} /> Export Cheat Sheet
                  </button>
                  <button
                    onClick={onOpenPdfModal}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#D8B4FE' }}
                  >
                    <FileText size={15} /> Export PDF Report
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {genError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {genError}
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Competitor Selector Panel */}
        <div className="card-glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '4px' }}>
            Competitors ({competitors.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {competitors.map(comp => {
              const isSelected = String(comp.id) === String(activeCompetitorId);
              const card = battlecards[comp.id];
              const bgObj = card ? parseJsonField(card.battleguard, {}) : {};
              const score = bgObj.defense_score || 80;

              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompetitorId(comp.id);
                    setEditMode(false);
                    setGenError(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid rgba(167, 139, 250, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? '#fff' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {comp.name || comp.url}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {comp.url}
                    </div>
                  </div>
                  {card ? (
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <ShieldCheck size={10} /> {score}%
                    </span>
                  ) : (
                    <ChevronRight size={14} style={{ color: '#64748B' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Playbook Details Area */}
        <div>
          {!cardData ? (
            <div className="card-glass" style={{ padding: '48px', textAlign: 'center' }}>
              <Sparkles size={40} style={{ color: '#38BDF8', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                No BattleGuard Generated for {currentCompetitor?.name || 'this competitor'}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Synthesize a high-impact competitive BattleGuard playbook using scraped web intelligence and position metrics.
              </p>
              <button
                onClick={() => handleGenerate(activeCompetitorId)}
                disabled={generating}
                className="btn-primary"
                style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {generating ? <RefreshCw size={16} className="spin-animation" /> : <Sparkles size={16} />}
                {generating ? 'Synthesizing Defense Playbook...' : 'Generate BattleGuard Playbook'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* BattleGuard Defense Bar & Security Gauge */}
              <div className="card-glass" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(15,23,42,0.6) 100%)', border: '1px solid rgba(139,92,246,0.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {currentCompetitor?.name || 'Competitor'} Defense Index
                      </h2>
                      <a
                        href={currentCompetitor?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      >
                        <ExternalLink size={12} /> {currentCompetitor?.url}
                      </a>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      BattleGuard Protection Active • Synchronized {cardData.last_generated_at ? new Date(cardData.last_generated_at).toLocaleDateString() : 'Today'}
                    </div>
                  </div>

                  {/* Defense Score Widget */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.05em' }}>
                        Defense Score
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                        {defenseScore}<span style={{ fontSize: '14px', color: '#64748B' }}>/100</span>
                      </div>
                    </div>
                    <div style={{ padding: '6px 12px', borderRadius: '8px', background: threatLevel === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: threatLevel === 'HIGH' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)', color: threatLevel === 'HIGH' ? '#F87171' : '#34D399', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Threat: {threatLevel}
                    </div>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${defenseScore}%`, height: '100%', background: scoreColor, transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* Card Meta & Overview */}
              <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #8B5CF6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {currentCompetitor?.name || 'Competitor'} Battlecard
                    </h2>
                    <a
                      href={currentCompetitor?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      <ExternalLink size={12} /> Visit Site
                    </a>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Last Updated: {cardData.last_generated_at ? new Date(cardData.last_generated_at).toLocaleDateString() : 'Just now'}
                  </div>
                </div>

                {editMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Overview & Positioning</label>
                      <textarea
                        value={editData.overview}
                        onChange={(e) => setEditData({ ...editData, overview: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '10px', marginTop: '4px', minHeight: '65px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>Target Persona & ICP Fit</label>
                      <textarea
                        value={editData.target_icp}
                        onChange={(e) => setEditData({ ...editData, target_icp: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '10px', marginTop: '4px', minHeight: '60px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>30-Second Elevator Pitch</label>
                      <textarea
                        value={editData.elevator_pitch}
                        onChange={(e) => setEditData({ ...editData, elevator_pitch: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '10px', marginTop: '4px', minHeight: '65px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {cardData.overview}
                  </p>
                )}
              </div>

              {/* Target ICP & Elevator Pitch Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Target ICP Fit */}
                <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #38BDF8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
                    <Users size={18} /> Target Persona & ICP Fit
                  </div>
                  <p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                    {cardData.target_icp || `${currentCompetitor?.name || 'Competitor'} targets general buyers, whereas our product is optimized for agile teams seeking high ROI.`}
                  </p>
                </div>

                {/* 30-Second Elevator Pitch */}
                <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #EC4899', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F472B6', fontWeight: 700, fontSize: '15px' }}>
                      <Megaphone size={18} /> 30-Second Elevator Pitch
                    </div>
                    {cardData.elevator_pitch && (
                      <button
                        onClick={() => handleCopyPitch(cardData.elevator_pitch)}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#CBD5E1',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {pitchCopied ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                        {pitchCopied ? 'Copied Pitch' : 'Copy Pitch'}
                      </button>
                    )}
                  </div>
                  <p style={{ color: '#F1F5F9', fontSize: '13px', lineHeight: '1.5', margin: 0, fontStyle: 'italic', background: 'rgba(236, 72, 153, 0.08)', padding: '10px', borderRadius: '6px', border: '1px dashed rgba(236, 72, 153, 0.3)' }}>
                    {cardData.elevator_pitch ? `"${cardData.elevator_pitch}"` : 'No pitch generated yet.'}
                  </p>
                </div>
              </div>

              {/* Customer Switching Triggers */}
              {cardData.switching_triggers && cardData.switching_triggers.length > 0 && (
                <div className="card-glass" style={{ padding: '16px 20px', borderLeft: '4px solid #F59E0B', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
                    <Zap size={16} /> Customer Migration & Switching Triggers
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {cardData.switching_triggers.map((trigger, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#FEF3C7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#F59E0B', fontWeight: 800 }}>⚡</span> {trigger}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths vs Weaknesses Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Strengths */}
                <div className="card-glass" style={{ padding: '20px', borderTop: '3px solid #10B981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 700, fontSize: '15px', marginBottom: '14px' }}>
                    <CheckCircle2 size={18} /> Competitor Strengths
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cardData.strengths.map((str, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#CBD5E1', lineHeight: '1.4' }}>
                        <span style={{ color: '#34D399', fontWeight: 800 }}>•</span> {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="card-glass" style={{ padding: '20px', borderTop: '3px solid #EF4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F87171', fontWeight: 700, fontSize: '15px', marginBottom: '14px' }}>
                    <XCircle size={18} /> Competitor Vulnerabilities
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cardData.weaknesses.map((wk, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#CBD5E1', lineHeight: '1.4' }}>
                        <span style={{ color: '#F87171', fontWeight: 800 }}>•</span> {wk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Why We Win Highlights */}
              <div className="card-glass" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 800, fontSize: '16px', marginBottom: '12px' }}>
                  <Trophy size={20} /> Why We Win (Key Differentiators)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {cardData.why_we_win.map((win, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#F1F5F9', fontWeight: 500, lineHeight: '1.4' }}>
                      <span style={{ color: '#38BDF8', fontWeight: 700, marginRight: '6px' }}>#{idx + 1}</span> {win}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <button
                  onClick={() => setActiveSubTab('overview')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: activeSubTab === 'overview' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                    background: activeSubTab === 'overview' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: activeSubTab === 'overview' ? '#fff' : '#94A3B8'
                  }}
                >
                  <FileText size={14} /> Overview & Differentiators
                </button>
                <button
                  onClick={() => setActiveSubTab('battleguard')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: activeSubTab === 'battleguard' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    background: activeSubTab === 'battleguard' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: activeSubTab === 'battleguard' ? '#38BDF8' : '#94A3B8'
                  }}
                >
                  <ShieldCheck size={14} /> BattleGuard Defense Matrix
                </button>
                <button
                  onClick={() => setActiveSubTab('simulator')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: activeSubTab === 'simulator' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                    background: activeSubTab === 'simulator' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: activeSubTab === 'simulator' ? '#FBBF24' : '#94A3B8'
                  }}
                >
                  <Target size={14} /> Objection Simulator
                </button>
              </div>

              {/* TAB 1: OVERVIEW & DIFFERENTIATORS */}
              {activeSubTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Executive Overview */}
                  <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #8B5CF6' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: '#A78BFA', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Positioning & Market Context
                    </h3>
                    {editMode ? (
                      <textarea
                        value={editData.overview}
                        onChange={(e) => setEditData({ ...editData, overview: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '10px', minHeight: '80px' }}
                      />
                    ) : (
                      <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                        {cardData.overview}
                      </p>
                    )}
                  </div>

                  {/* Strengths vs Weaknesses */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="card-glass" style={{ padding: '20px', borderTop: '3px solid #10B981' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 700, fontSize: '15px', marginBottom: '14px' }}>
                        <CheckCircle2 size={18} /> Competitor Strengths
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {cardData.strengths.map((str, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#CBD5E1', lineHeight: '1.4' }}>
                            <span style={{ color: '#34D399', fontWeight: 800 }}>•</span> {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card-glass" style={{ padding: '20px', borderTop: '3px solid #EF4444' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F87171', fontWeight: 700, fontSize: '15px', marginBottom: '14px' }}>
                        <XCircle size={18} /> Competitor Vulnerabilities
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {cardData.weaknesses.map((wk, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#CBD5E1', lineHeight: '1.4' }}>
                            <span style={{ color: '#F87171', fontWeight: 800 }}>•</span> {wk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Why We Win Differentiators */}
                  <div className="card-glass" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 800, fontSize: '16px', marginBottom: '12px' }}>
                      <Trophy size={20} /> Why We Win (Key Differentiators)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {cardData.why_we_win.map((win, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#F1F5F9', fontWeight: 500, lineHeight: '1.4' }}>
                          <span style={{ color: '#38BDF8', fontWeight: 700, marginRight: '6px' }}>#{idx + 1}</span> {win}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="card-glass" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
                      <DollarSign size={18} /> Pricing & Value Contrast
                    </div>
                    <p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                      {cardData.pricing_comparison}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: BATTLEGUARD DEFENSE MATRIX */}
              {activeSubTab === 'battleguard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Recommended Win Angle Banner */}
                  <div className="card-glass" style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#34D399', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      Recommended Strategic Win Angle
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#ECFDF5', lineHeight: '1.4' }}>
                      "{bg.recommended_win_angle || 'Emphasize superior speed to value, transparent pricing, and robust platform stability.'}"
                    </div>
                  </div>

                  {/* Defensive Counter-Tactics */}
                  <div className="card-glass" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 800, fontSize: '16px', marginBottom: '16px' }}>
                      <ShieldCheck size={20} /> Tactical Defense Counter-Maneuvers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(bg.defensive_tactics || []).map((tactic, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Vector #{idx + 1}: {tactic.vector}
                            </span>
                            <button
                              onClick={() => handleCopyText(tactic.strategy, `tactic_${idx}`)}
                              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '3px 8px', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {copiedIndex === `tactic_${idx}` ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                              {copiedIndex === `tactic_${idx}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.5' }}>
                            {tactic.strategy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Planted Landmines */}
                  <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>
                      <AlertTriangle size={18} /> Killer Landmine Questions for Reps
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cardData.landmines.map((lm, idx) => (
                        <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <span style={{ fontStyle: 'italic' }}>"{lm}"</span>
                          <button
                            onClick={() => handleCopyText(lm, `lm_${idx}`)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '3px 8px', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                          >
                            {copiedIndex === `lm_${idx}` ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                            {copiedIndex === `lm_${idx}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OBJECTION SIMULATOR */}
              {activeSubTab === 'simulator' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Simulator Interactive Box */}
                  <div className="card-glass" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 800, fontSize: '16px', marginBottom: '8px' }}>
                      <Target size={20} /> Interactive Objection Counter-Script Simulator
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '16px' }}>
                      Type a prospect objection or claim to test against BattleGuard scripts in real time:
                    </p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder={`e.g., "${currentCompetitor?.name || 'Competitor'} is 30% cheaper" or "They have more integrations"`}
                        value={simQuery}
                        onChange={(e) => handleSimulate(e.target.value)}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 14px', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {['cheaper', 'features', 'legacy', 'support'].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSimulate(chip)}
                          style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Test "{chip}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulator Output Result */}
                  {simMatch ? (
                    <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #A78BFA' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#F87171', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        Matched Prospect Claim: {simMatch.objection}
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', position: 'relative' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#A78BFA', marginBottom: '4px' }}>
                          BattleGuard Recommended Counter-Script:
                        </div>
                        <p style={{ color: '#F1F5F9', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                          {simMatch.response}
                        </p>
                        <button
                          onClick={() => handleCopyText(simMatch.response, 'sim_match')}
                          style={{ position: 'absolute', right: '12px', top: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 8px', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copiedIndex === 'sim_match' ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                          {copiedIndex === 'sim_match' ? 'Copied Script' : 'Copy Response'}
                        </button>
                      </div>
                    </div>
                  ) : simQuery ? (
                    <div style={{ color: '#94A3B8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                      No exact match found for "{simQuery}". Try keywords like "cheaper", "support", "legacy".
                    </div>
                  ) : null}

                  {/* All Default Objection Scripts List */}
                  <div className="card-glass" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
                      <HelpCircle size={20} /> All BattleGuard Objection Scripts ({cardData.objection_handling.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {cardData.objection_handling.map((obj, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', position: 'relative' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F87171', marginBottom: '6px' }}>
                            Prospect: {obj.objection}
                          </div>
                          <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', paddingLeft: '16px', borderLeft: '2px solid #8B5CF6' }}>
                            <span style={{ fontWeight: 600, color: '#A78BFA' }}>Response: </span>
                            {obj.response}
                          </div>
                          <button
                            onClick={() => handleCopyText(obj.response, `obj_${idx}`)}
                            style={{ position: 'absolute', right: '12px', top: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 8px', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiedIndex === `obj_${idx}` ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                            {copiedIndex === `obj_${idx}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
