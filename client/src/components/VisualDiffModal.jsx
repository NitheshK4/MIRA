import React, { useState, useEffect } from 'react';
import { 
  X, 
  Columns, 
  Sliders, 
  FileText, 
  Calendar, 
  Globe, 
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function VisualDiffModal({ cardId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split-slider'); // 'split-slider', 'side-by-side', 'dom-diff'
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%

  useEffect(() => {
    if (!cardId) return;
    fetchDiffData();
  }, [cardId]);

  const fetchDiffData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/intelligence/${cardId}/diff-snapshots`);
      if (!res.ok) throw new Error('Failed to load snapshot comparison data.');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'Error fetching visual diff snapshots.');
    } finally {
      setLoading(false);
    }
  };

  if (!cardId) return null;

  const currentScreenshot = data?.currentScrape?.screenshot_path || data?.card?.screenshot_path;
  const previousScreenshot = data?.previousScrape?.screenshot_path;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleString();
    } catch (_) {
      return isoStr;
    }
  };

  return (
    <div className="mira-modal-backdrop" onClick={onClose}>
      <div 
        className="modal-panel max-w-5xl w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">
              <Sparkles size={18} className="text-cyan-400" />
              <span>Visual Snapshot & DOM Diff Inspector</span>
            </div>
            {data?.competitor && (
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                <Globe size={13} className="text-cyan-400" />
                <span className="font-bold text-white">{data.competitor.name}</span>
                <span>•</span>
                <a 
                  href={data.competitor.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:underline text-cyan-300 truncate max-w-sm flex items-center gap-1"
                >
                  {data.competitor.url}
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Mode Switcher Toolbar */}
        <div className="px-6 py-3 bg-[var(--surface-recessed)] border-b border-black/25 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('split-slider')}
              className={`mira-btn mira-btn-sm ${viewMode === 'split-slider' ? 'mira-btn-primary' : 'mira-btn-secondary'}`}
            >
              <Sliders size={13} />
              <span>Interactive Split Slider</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`mira-btn mira-btn-sm ${viewMode === 'side-by-side' ? 'mira-btn-primary' : 'mira-btn-secondary'}`}
            >
              <Columns size={13} />
              <span>Side-by-Side View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('dom-diff')}
              className={`mira-btn mira-btn-sm ${viewMode === 'dom-diff' ? 'mira-btn-primary' : 'mira-btn-secondary'}`}
            >
              <FileText size={13} />
              <span>DOM Text Diff</span>
            </button>
          </div>

          {data?.card?.impact_score && (
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-slate-400">Impact Score:</span>
              <span className={`impact-score-badge impact-${data.card.impact_score >= 8 ? 'high' : data.card.impact_score >= 5 ? 'medium' : 'low'}`} style={{ width: 28, height: 28, fontSize: 11 }}>
                {data.card.impact_score}
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="modal-body overflow-y-auto" style={{ flex: 1 }}>
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 mx-auto mira-skeleton rounded-full animate-bounce" />
              <div>Loading visual snapshot diff analysis...</div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-xl font-medium">
              {error}
            </div>
          ) : (
            <>
              {/* MODE 1: INTERACTIVE SPLIT SLIDER */}
              {viewMode === 'split-slider' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2">
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Calendar size={12} />
                      BEFORE ({formatDate(data.previousScrape?.timestamp)})
                    </span>
                    <span className="text-slate-500">← Drag Slider to Compare →</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Calendar size={12} />
                      AFTER ({formatDate(data.currentScrape?.timestamp)})
                    </span>
                  </div>

                  {currentScreenshot ? (
                    <div className="relative w-full overflow-hidden rounded-xl border border-black/30 shadow-2xl bg-[#080B15]" style={{ height: '440px' }}>
                      {/* Current Image (After - Full Base) */}
                      <img 
                        src={currentScreenshot} 
                        alt="Current After Capture"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />

                      {/* Previous Image (Before - Clipped Top Layer) */}
                      {previousScreenshot && (
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${sliderPos}%` }}
                        >
                          <img 
                            src={previousScreenshot} 
                            alt="Previous Before Capture"
                            className="absolute inset-0 w-full h-full object-cover object-top"
                            style={{ width: '100%', maxWidth: 'none' }}
                          />
                        </div>
                      )}

                      {/* Slider Divider Bar */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#06B6D4] cursor-ew-resize flex items-center justify-center"
                        style={{ left: `${sliderPos}%` }}
                      >
                        <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg border border-white">
                          ↔
                        </div>
                      </div>

                      {/* Range Input Control */}
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPos}
                        onChange={e => setSliderPos(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                      />
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500 bg-black/30 rounded-xl">
                      No screenshot captures stored for this scrape item.
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: SIDE BY SIDE */}
              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-2">
                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-mono font-bold flex items-center justify-between">
                      <span>BEFORE SNAPSHOT</span>
                      <span>{formatDate(data.previousScrape?.timestamp)}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-black/30 bg-[#080B15] h-96">
                      {previousScreenshot ? (
                        <img src={previousScreenshot} alt="Before" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="p-8 text-center text-slate-500 h-full flex items-center justify-center text-xs">
                          No previous snapshot baseline available.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After */}
                  <div className="space-y-2">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-mono font-bold flex items-center justify-between">
                      <span>CURRENT SNAPSHOT</span>
                      <span>{formatDate(data.currentScrape?.timestamp)}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-black/30 bg-[#080B15] h-96">
                      {currentScreenshot ? (
                        <img src={currentScreenshot} alt="After" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="p-8 text-center text-slate-500 h-full flex items-center justify-center text-xs">
                          No current snapshot available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: DOM TEXT DIFF */}
              {viewMode === 'dom-diff' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-[var(--surface-recessed)] rounded-lg text-slate-400 flex items-center justify-between">
                    <span>Parsed DOM Text Change Audit</span>
                    <span className="text-[11px] text-cyan-400">Green = Added, Red = Removed</span>
                  </div>

                  <div className="bg-[var(--surface-recessed)] p-4 rounded-xl max-h-96 overflow-y-auto space-y-1 shadow-[var(--clay-inset-shadow)]">
                    {data?.card?.summary ? (
                      <div className="mb-3 p-3 bg-violet-500/15 rounded-lg text-slate-200">
                        <div className="font-bold text-violet-300 uppercase tracking-wider text-[10px] mb-1">AI Executive Summary</div>
                        {data.card.summary}
                      </div>
                    ) : null}

                    {data?.card?.justification ? (
                      <div className="p-3 bg-slate-900/60 rounded-lg text-slate-300 space-y-1">
                        <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Scrape Context Justification</div>
                        <div>{data.card.justification}</div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500">No raw text diff lines available.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <Layers size={13} className="text-cyan-400" />
            <span>MIRA Visual Snapshot Inspector</span>
          </div>

          <button className="mira-btn mira-btn-secondary mira-btn-sm" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
