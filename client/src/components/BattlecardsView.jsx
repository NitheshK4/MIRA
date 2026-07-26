import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function BattlecardsView({ workspaceId, competitors = [] }) {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState(competitors[0]?.id || null);
  const [battlecards, setBattlecards] = useState({});
  const [loadingCard, setLoadingCard] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Compute effective active competitor ID reliably
  const activeCompetitorId = selectedCompetitorId || competitors[0]?.id || null;

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
        setGenError(errData.error || 'Failed to generate battlecard.');
      }
    } catch (err) {
      console.error('Failed to generate battlecard:', err);
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
      console.error('Failed to save battlecard edit:', err);
    }
  };

  const parseArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return [field];
    }
  };

  const currentCompetitor = competitors.find(c => String(c.id) === String(activeCompetitorId)) || competitors[0];
  const rawCard = activeCompetitorId ? battlecards[activeCompetitorId] : null;

  const cardData = rawCard ? {
    ...rawCard,
    strengths: parseArrayField(rawCard.strengths),
    weaknesses: parseArrayField(rawCard.weaknesses),
    why_we_win: parseArrayField(rawCard.why_we_win),
    objection_handling: parseArrayField(rawCard.objection_handling),
    landmines: parseArrayField(rawCard.landmines)
  } : null;

  const startEdit = () => {
    if (!cardData) return;
    setEditData({
      overview: cardData.overview || '',
      pricing_comparison: cardData.pricing_comparison || '',
      strengths: cardData.strengths,
      weaknesses: cardData.weaknesses,
      why_we_win: cardData.why_we_win,
      landmines: cardData.landmines,
      objection_handling: cardData.objection_handling
    });
    setEditMode(true);
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportMarkdown = () => {
    if (!currentCompetitor || !cardData) return;
    
    const mdContent = `# Battlecard: Our Business vs ${currentCompetitor.name || 'Competitor'}
URL: ${currentCompetitor.url}
Generated At: ${cardData.last_generated_at || new Date().toISOString()}

## Overview
${cardData.overview}

## Core Strengths & Advantages
${cardData.strengths.map(s => `- ${s}`).join('\n')}

## Weaknesses & Vulnerabilities
${cardData.weaknesses.map(w => `- ${w}`).join('\n')}

## Why We Win (Key Differentiators)
${cardData.why_we_win.map(w => `- ${w}`).join('\n')}

## Pricing Comparison
${cardData.pricing_comparison}

## Landmine Questions for Reps
${cardData.landmines.map(l => `- ${l}`).join('\n')}

## Objection Handling Scripts
${cardData.objection_handling.map(o => `### Prospect: ${o.objection}\n**Response**: ${o.response}\n`).join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battlecard_${(currentCompetitor.name || 'competitor').toLowerCase().replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (competitors.length === 0) {
    return (
      <div className="card-glass" style={{ padding: '48px', textAlign: 'center' }}>
        <Swords size={48} style={{ color: '#8B5CF6', marginBottom: '16px', opacity: 0.8 }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No Competitors Configured</h2>
        <p style={{ color: '#94A3B8', maxWidth: '480px', margin: '0 auto 24px auto', fontSize: '14px' }}>
          Add your first competitor in the Dashboard tab to unlock AI-powered battlecards for your sales team.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '10px', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <Swords size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Competitive Battlecards
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                AI-synthesized tactical playbooks, objection handlers, and landmines for sales enablement.
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
                <Save size={15} /> Save Changes
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
                {generating ? 'Synthesizing Battlecard...' : cardData ? 'Refresh with AI' : 'Generate Battlecard with AI'}
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
                    <Download size={15} /> Export Markdown
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

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Competitors Selector Panel */}
        <div className="card-glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '4px' }}>
            Competitors ({competitors.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {competitors.map(comp => {
              const isSelected = String(comp.id) === String(activeCompetitorId);
              const hasCard = !!battlecards[comp.id];
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
                    justify: 'space-between',
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
                  {hasCard ? (
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      AI Ready
                    </span>
                  ) : (
                    <ChevronRight size={14} style={{ color: '#64748B' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Battlecard Details View */}
        <div>
          {!cardData ? (
            <div className="card-glass" style={{ padding: '48px', textAlign: 'center' }}>
              <Sparkles size={40} style={{ color: '#38BDF8', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                No Battlecard Generated Yet for {currentCompetitor?.name || 'this competitor'}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Generate an AI battlecard now using recent scraped page content, detected intelligence signals, and your company profile.
              </p>
              <button
                onClick={() => handleGenerate(activeCompetitorId)}
                disabled={generating}
                className="btn-primary"
                style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {generating ? <RefreshCw size={16} className="spin-animation" /> : <Sparkles size={16} />}
                {generating ? 'Analyzing Competitor Intelligence...' : 'Generate Battlecard with AI'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
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
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Overview & Positioning</label>
                    <textarea
                      value={editData.overview}
                      onChange={(e) => setEditData({ ...editData, overview: e.target.value })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '10px', marginTop: '4px', minHeight: '80px' }}
                    />
                  </div>
                ) : (
                  <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {cardData.overview}
                  </p>
                )}
              </div>

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

              {/* Landmine Questions */}
              <div className="card-glass" style={{ padding: '20px', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>
                  <AlertTriangle size={18} /> Landmines to Plant in Sales Calls
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cardData.landmines.map((lm, idx) => (
                    <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#FEF3C7', fontStyle: 'italic' }}>
                      "{lm}"
                    </div>
                  ))}
                </div>
              </div>

              {/* Objection Handling Scripts */}
              <div className="card-glass" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
                  <ShieldAlert size={20} /> Objection Handling Counter-Scripts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cardData.objection_handling.map((obj, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#F87171', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={14} /> Prospect Says: {obj.objection}
                      </div>
                      <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.5', paddingLeft: '20px', borderLeft: '2px solid #8B5CF6', position: 'relative' }}>
                        <span style={{ fontWeight: 600, color: '#A78BFA' }}>Sales Rep Response: </span>
                        {obj.response}
                        <button
                          onClick={() => handleCopyText(obj.response, idx)}
                          style={{
                            position: 'absolute',
                            right: '0',
                            top: '-4px',
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
                          {copiedIndex === idx ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                          {copiedIndex === idx ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Battle Card */}
              <div className="card-glass" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
                  <DollarSign size={18} /> Pricing & Tier Breakdown
                </div>
                <p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                  {cardData.pricing_comparison}
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
