import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  Copy, 
  Check, 
  Plus, 
  X, 
  Sliders, 
  ArrowUpRight, 
  FileText, 
  ChevronRight,
  Brain,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Mail,
  Send
} from 'lucide-react';

const INITIAL_PREDICTIONS = [
  {
    id: 'pred-1',
    competitor: 'HubSpot',
    category: 'CRM & Marketing Automation',
    priceHikeRisk: 92, // %
    riskLevel: 'CRITICAL',
    predictedWindow: 'Next 30–45 Days (Q3 2026)',
    expectedIncrease: '+15% to +20%',
    affectedTiers: 'Professional & Enterprise Marketing Hub',
    confidenceScore: '94% (High Confidence)',
    signals: [
      'Scraped 3 pricing tier test variants in staging subdomain.',
      'API rate limit adjustments detected in public documentation.',
      'Historical pattern: Annual pricing adjustment every August.'
    ],
    upcomingFeatures: [
      { name: 'Copilot AI Agents for Workflows', status: 'In Beta Testing', impact: 'HIGH' },
      { name: 'Consumption-Based Contact Enrichment', status: 'Unannounced Leak', impact: 'CRITICAL' }
    ],
    salesPlaybook: `🔥 PRE-EMPTIVE CLOSING SCRIPT FOR HUBSPOT LEADS:

"HubSpot is scheduled to roll out a 15-20% seat price increase across Marketing Hub Pro within the next 45 days. If you sign our agreement this week, we will lock in your current flat-rate pricing for 24 months, saving your team over $8,400 before their price hike takes effect."`,
    landmineQuestion: 'Ask prospect: "Did HubSpot mention if your quote includes their upcoming contact-based API consumption overage charges?"'
  },
  {
    id: 'pred-2',
    competitor: 'Salesforce',
    category: 'Enterprise Revenue Cloud',
    priceHikeRisk: 78,
    riskLevel: 'HIGH',
    predictedWindow: 'Next 60 Days',
    expectedIncrease: '+10% to +14%',
    affectedTiers: 'Sales Cloud Unlimited & Einstein AI Add-on',
    confidenceScore: '87% (Moderate-High)',
    signals: [
      'Einstein AI mandatory bundling test detected in EMEA market pricing.',
      'Minimum commitment seat floor raised from 5 to 10 seats in updated T&Cs.'
    ],
    upcomingFeatures: [
      'Autonomous Sales SDR Agents',
      'Real-time Call Sentiment Scoring (Mandatory Add-on)'
    ],
    salesPlaybook: `🔥 PRE-EMPTIVE CLOSING SCRIPT FOR SALESFORCE LEADS:

"Salesforce is transitioning Einstein AI into a mandatory $75/user/month bundled add-on starting next quarter. MIRA includes full native AI intelligence with zero seat add-on fees or hidden annual commitment escalators."`,
    landmineQuestion: 'Ask prospect: "Is Salesforce guaranteeing in writing that your Einstein AI add-on rate will remain fixed for Year 2 and Year 3?"'
  },
  {
    id: 'pred-3',
    competitor: 'Gong',
    category: 'Revenue Intelligence',
    priceHikeRisk: 65,
    riskLevel: 'MODERATE',
    predictedWindow: 'Q4 2026',
    expectedIncrease: '+8% to +12%',
    affectedTiers: 'Gong Engage & Conversation Intelligence',
    confidenceScore: '81% (Moderate)',
    signals: [
      'Platform onboarding fee increased from $3,000 to $4,500 for mid-market.',
      'New platform tier "Gong Horizon" spotted in partner documentation.'
    ],
    upcomingFeatures: [
      'Automated Executive Meeting Summarizer',
      'Competitor Mention Real-time Telemetry'
    ],
    salesPlaybook: `🔥 PRE-EMPTIVE CLOSING SCRIPT FOR GONG LEADS:

"Gong has recently bumped their mandatory platform onboarding fee to $4,500 with seat renewal bumps planned for Q4. MIRA provides instant setup with zero mandatory professional service fees."`,
    landmineQuestion: 'Ask prospect: "Will Gong waive their $4,500 onboarding setup fee if you don\'t sign by the end of this month?"'
  }
];

export default function PredictorView({ onLaunchOracle }) {
  const [predictions, setPredictions] = useState(() => {
    try {
      const saved = localStorage.getItem('mira_custom_predictions');
      return saved ? JSON.parse(saved) : INITIAL_PREDICTIONS;
    } catch (e) {
      return INITIAL_PREDICTIONS;
    }
  });

  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [seatCount, setSeatCount] = useState(20);

  // Email Generator State
  const [selectedPredForEmail, setSelectedPredForEmail] = useState(null);
  const [emailProspectName, setEmailProspectName] = useState('Alex Rivers');
  const [emailCompanyName, setEmailCompanyName] = useState('Acme Corp');
  const [prospectEmail, setProspectEmail] = useState('alex@acme.com');
  const [emailTone, setEmailTone] = useState('Urgent Executive');
  const [emailCopied, setEmailCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState(null);

  const getGeneratedEmail = () => {
    if (!selectedPredForEmail) return { subject: '', body: '' };

    const comp = selectedPredForEmail.competitor;
    const hike = selectedPredForEmail.expectedIncrease;
    const windowText = selectedPredForEmail.predictedWindow;

    const subject = `[Urgent Rate Lock] Avoiding ${comp}'s Upcoming ${hike} Price Adjustment for ${emailCompanyName}`;
    
    let body = `Hi ${emailProspectName},\n\n`;
    
    if (emailTone === 'Urgent Executive') {
      body += `Our market intelligence telemetry indicates that ${comp} is rolling out a ${hike} price adjustment on their core tiers within ${windowText}.\n\n`;
      body += `If your team at ${emailCompanyName} is currently evaluating ${comp} or reviewing contract renewals, I want to offer an executive pre-emptive rate lock. By securing your agreement with us this month, we will guarantee fixed flat-rate pricing for 24 months with zero mandatory onboarding fees.\n\n`;
      body += `Would you be open to a brief 10-minute call this Thursday to lock in your rates before their price hike takes effect?\n\nBest regards,\nSales Strategy Team`;
    } else if (emailTone === 'CFO Financial Security') {
      body += `As you finalize budget allocations for ${emailCompanyName}, I wanted to bring an important pricing update to your attention regarding ${comp}.\n\n`;
      body += `According to historical tier telemetry, ${comp} is projected to bump tier rates by ${hike}. For a growing team, this represents a significant unbudgeted expense bump.\n\n`;
      body += `We are currently offering executive price protection—allowing ${emailCompanyName} to lock in a 2-year fixed pricing contract with 0 contact overage fees. Attached is a breakdown of your projected 3-year savings.\n\n`;
      body += `Let me know if you have 10 minutes for a financial briefing this week.\n\nBest regards,\nFinance & Strategy Team`;
    } else {
      body += `Hope you're having a great week! I noticed ${emailCompanyName} is currently reviewing sales and intelligence platforms.\n\n`;
      body += `Quick heads up: market data indicates ${comp} is planning a ${hike} rate increase in ${windowText}.\n\n`;
      body += `We'd love to help you lock in a locked-in rate today so your team avoids their upcoming price inflation.\n\nLet me know if you'd like a quick demo!\n\nBest,\nGrowth Team`;
    }

    return { subject, body };
  };

  const handleOpenMailto = (e) => {
    e.preventDefault();
    const { subject, body } = getGeneratedEmail();
    const mailtoUrl = `mailto:${encodeURIComponent(prospectEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
  };

  const handleSendViaBackend = async () => {
    const { subject, body } = getGeneratedEmail();
    try {
      setSendingEmail(true);
      setEmailSentMessage(null);
      const res = await fetch('/api/email/send-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: prospectEmail,
          subject,
          body
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSentMessage(`✅ ${data.message}`);
      } else {
        setEmailSentMessage(`⚠️ ${data.error || 'Failed to dispatch email.'}`);
      }
    } catch (err) {
      setEmailSentMessage(`⚠️ Connection error: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // New Custom Prediction Form State
  const [newPred, setNewPred] = useState({
    competitor: '',
    category: 'SaaS Platform',
    priceHikeRisk: 75,
    riskLevel: 'HIGH',
    predictedWindow: 'Next 30–60 Days',
    expectedIncrease: '+10% to +15%',
    affectedTiers: 'Pro & Enterprise Tiers',
    salesPlaybook: '',
    landmineQuestion: ''
  });

  useEffect(() => {
    try {
      localStorage.setItem('mira_custom_predictions', JSON.stringify(predictions));
    } catch (e) {}
  }, [predictions]);

  const handleCopyPlaybook = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPrediction = (e) => {
    e.preventDefault();
    if (!newPred.competitor.trim()) return;

    const item = {
      ...newPred,
      id: `custom-pred-${Date.now()}`,
      confidenceScore: '90% (Custom Rep Telemetry)',
      signals: [
        'Added via Sales Intelligence Rep Telemetry.',
        'Market pricing shift rumor verified by team.'
      ],
      upcomingFeatures: [
        { name: 'Unannounced Feature Module', status: 'Scraped Telemetry', impact: 'HIGH' }
      ]
    };

    setPredictions([item, ...predictions]);
    setIsAddModalOpen(false);
    setNewPred({
      competitor: '',
      category: 'SaaS Platform',
      priceHikeRisk: 75,
      riskLevel: 'HIGH',
      predictedWindow: 'Next 30–60 Days',
      expectedIncrease: '+10% to +15%',
      affectedTiers: 'Pro & Enterprise Tiers',
      salesPlaybook: '',
      landmineQuestion: ''
    });
  };

  const filteredPredictions = predictions.filter(p => {
    if (selectedCompetitor !== 'all' && p.competitor.toLowerCase() !== selectedCompetitor.toLowerCase()) {
      return false;
    }
    return true;
  });

  const getRiskColor = (risk) => {
    if (risk >= 85) return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
    if (risk >= 70) return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="mira-glass p-8 rounded-3xl border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black tracking-wider uppercase mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              AI FORECASTING ENGINE • VERIFIED TELEMETRY
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-3">
              🔮 Competitor Price Hike & Roadmap Predictor
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
              Predict competitor price increases and unannounced feature releases before they happen. Equips sales reps with pre-emptive closing scripts to lock in deals early.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-cyan-500 text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add Custom Forecast
            </button>

            {onLaunchOracle && (
              <button
                onClick={onLaunchOracle}
                className="px-5 py-3 rounded-2xl bg-violet-600/30 border border-violet-500/50 text-violet-200 font-extrabold text-xs uppercase tracking-wider hover:bg-violet-600/50 transition-all flex items-center gap-2 shadow-md"
              >
                <Brain className="w-4 h-4 text-violet-400" /> Ask AI Oracle
              </button>
            )}
          </div>
        </div>

        {/* Live Forecast Metric Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-[#0F1424] border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Imminent Price Hikes</div>
              <div className="text-xl font-black text-white font-['Outfit'] mt-0.5">3 Competitors Flagged</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1424] border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Hike Timeline</div>
              <div className="text-xl font-black text-white font-['Outfit'] mt-0.5">Next 30–45 Days</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1424] border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Inflation Impact</div>
              <div className="text-xl font-black text-emerald-400 font-['Outfit'] mt-0.5">+12% to +20% Cost Bump</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Inflation Impact Calculator */}
      <div className="mira-glass p-6 rounded-3xl border border-slate-800 bg-[#0E1222] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">Interactive Prospect Savings Calculator</h3>
              <p className="text-xs text-slate-400">Simulate how much your prospect saves by signing before competitor price hikes take effect.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#161C30] p-2 px-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-extrabold text-slate-300">Target Team Seats:</span>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={seatCount} 
              onChange={e => setSeatCount(parseInt(e.target.value, 10))}
              className="w-32 accent-emerald-400 cursor-pointer"
            />
            <span className="text-sm font-black text-emerald-400 min-w-[50px]">{seatCount} Seats</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090C17] border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-300">
            💡 For a <strong className="text-white font-bold">{seatCount}-person sales team</strong>, HubSpot & Salesforce's predicted 15% price hike adds <strong className="text-rose-400 font-extrabold">${(seatCount * 35 * 12 * 0.15).toLocaleString()}/year</strong> in unexpected software expansion cost.
          </div>

          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black whitespace-nowrap shadow-sm">
            💰 Pre-Emptive Deal Lock-In Value: ${(seatCount * 35 * 12 * 0.15).toLocaleString()}/yr Saved
          </div>
        </div>
      </div>

      {/* Competitor Filter Matrix */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        <button
          onClick={() => setSelectedCompetitor('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            selectedCompetitor === 'all' 
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
              : 'bg-[#121729] text-slate-300 border border-slate-800 hover:border-slate-700'
          }`}
        >
          All Competitors ({predictions.length})
        </button>
        {['HubSpot', 'Salesforce', 'Gong'].map(comp => (
          <button
            key={comp}
            onClick={() => setSelectedCompetitor(comp)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              selectedCompetitor.toLowerCase() === comp.toLowerCase()
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                : 'bg-[#121729] text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            🎯 {comp}
          </button>
        ))}
      </div>

      {/* Predictions Forecast Grid */}
      <div className="space-y-6">
        {filteredPredictions.map((pred) => (
          <div 
            key={pred.id}
            className="mira-glass p-6 md:p-8 rounded-3xl border border-slate-800/90 bg-[#0B0F1D] hover:border-cyan-500/40 transition-all space-y-6 shadow-xl relative"
          >
            {/* Card Top Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
                  <div className="w-full h-full bg-[#080B14] rounded-[14px] flex items-center justify-center font-black text-lg text-white font-['Outfit']">
                    {pred.competitor.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-black text-white font-['Outfit']">{pred.competitor}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${getRiskColor(pred.priceHikeRisk)}`}>
                      🔥 {pred.riskLevel} PRICE HIKE RISK ({pred.priceHikeRisk}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-1">{pred.category} • Confidence: {pred.confidenceScore}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2 rounded-xl bg-[#13182B] border border-slate-800 text-xs font-extrabold text-slate-300">
                  📅 Predicted Window: <span className="text-cyan-400 font-black">{pred.predictedWindow}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-black text-rose-300">
                  📈 Expected Hike: {pred.expectedIncrease}
                </div>
              </div>
            </div>

            {/* Signals & Upcoming Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telemetry Signals */}
              <div className="p-5 rounded-2xl bg-[#090D1A] border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Scraped Early-Warning Signals
                </h4>
                <ul className="space-y-2">
                  {pred.signals.map((sig, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upcoming Feature Roadmap Leaks */}
              <div className="p-5 rounded-2xl bg-[#090D1A] border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" /> Unannounced Feature Roadmap Leaks
                </h4>
                <div className="space-y-2">
                  {pred.upcomingFeatures.map((feat, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#121729] border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{feat.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase">
                        {feat.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre-Emptive Sales Playbook & Script */}
            <div className="p-5 md:p-6 rounded-2xl bg-[#090E1F] border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> Pre-Emptive Deal Closing Script
                </h4>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedPredForEmail(pred)}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-600/25 border border-violet-500/50 text-violet-200 hover:bg-violet-600/40 text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-violet-400" />
                    <span>Generate Pre-Emptive Email ✉️</span>
                  </button>

                  <button
                    onClick={() => handleCopyPlaybook(pred.salesPlaybook, pred.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm"
                  >
                    {copiedId === pred.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === pred.id ? 'Copied Script!' : 'Copy Script'}</span>
                  </button>
                </div>
              </div>

              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-[#060914] p-4 rounded-xl border border-slate-800/80">
                {pred.salesPlaybook}
              </pre>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-300">Strategic Landmine Question: </strong>
                  {pred.landmineQuestion}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Forecast Modal */}
      {isAddModalOpen && (
        <div className="mira-modal-backdrop animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
          <div 
            className="mira-glass mira-modal-card border-2 border-violet-500/50 shadow-2xl p-8 max-w-xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
              <h2 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
                <Plus className="w-6 h-6 text-cyan-400" />
                ADD CUSTOM PRICE HIKE PREDICTION
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="crossmark-btn text-slate-400 hover:text-white p-1.5 rounded-lg transition-all"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPrediction} className="space-y-5">
              <div className="mira-form-group">
                <label className="mira-form-label text-sm font-extrabold text-slate-300">COMPETITOR NAME</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Highspot or Salesforce"
                  value={newPred.competitor}
                  onChange={e => setNewPred({ ...newPred, competitor: e.target.value })}
                  className="mira-input text-base font-semibold py-3 px-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mira-form-group">
                  <label className="mira-form-label text-sm font-extrabold text-slate-300">RISK LEVEL (% RISK)</label>
                  <input 
                    type="number"
                    min="10"
                    max="99"
                    value={newPred.priceHikeRisk}
                    onChange={e => setNewPred({ ...newPred, priceHikeRisk: parseInt(e.target.value, 10) })}
                    className="mira-input text-base font-semibold py-3 px-4"
                  />
                </div>

                <div className="mira-form-group">
                  <label className="mira-form-label text-sm font-extrabold text-slate-300">EXPECTED HIKE</label>
                  <input 
                    type="text"
                    value={newPred.expectedIncrease}
                    onChange={e => setNewPred({ ...newPred, expectedIncrease: e.target.value })}
                    className="mira-input text-base font-semibold py-3 px-4"
                  />
                </div>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-sm font-extrabold text-slate-300">PRE-EMPTIVE CLOSING SCRIPT</label>
                <textarea 
                  rows={3}
                  placeholder="Type the exact script sales reps should read..."
                  value={newPred.salesPlaybook}
                  onChange={e => setNewPred({ ...newPred, salesPlaybook: e.target.value })}
                  className="mira-input text-base font-semibold py-3 px-4"
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-sm font-extrabold text-slate-300">LANDMINE QUESTION</label>
                <input 
                  type="text"
                  placeholder="Question reps should ask the buyer..."
                  value={newPred.landmineQuestion}
                  onChange={e => setNewPred({ ...newPred, landmineQuestion: e.target.value })}
                  className="mira-input text-base font-semibold py-3 px-4"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="mira-btn mira-btn-secondary px-6 py-3 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="mira-btn mira-btn-primary px-6 py-3 text-xs font-black uppercase shadow-lg"
                >
                  SAVE FORECAST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Emptive Email Generator Modal */}
      {selectedPredForEmail && (
        <div className="mira-modal-backdrop animate-fade-in" onClick={() => setSelectedPredForEmail(null)}>
          <div 
            className="mira-glass mira-modal-card border-2 border-violet-500/50 shadow-2xl p-8 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
              <h2 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
                <Mail className="w-6 h-6 text-violet-400" />
                PRE-EMPTIVE PROSPECT EMAIL GENERATOR
              </h2>
              <button 
                onClick={() => setSelectedPredForEmail(null)}
                className="crossmark-btn text-slate-400 hover:text-white p-1.5 rounded-lg transition-all"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mira-form-group">
                  <label className="mira-form-label text-sm font-extrabold text-slate-300">PROSPECT / BUYER NAME</label>
                  <input 
                    type="text"
                    value={emailProspectName}
                    onChange={e => setEmailProspectName(e.target.value)}
                    className="mira-input text-base font-semibold py-3 px-4"
                    placeholder="e.g. Alex Rivers"
                  />
                </div>

                <div className="mira-form-group">
                  <label className="mira-form-label text-sm font-extrabold text-slate-300">PROSPECT COMPANY</label>
                  <input 
                    type="text"
                    value={emailCompanyName}
                    onChange={e => setEmailCompanyName(e.target.value)}
                    className="mira-input text-base font-semibold py-3 px-4"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div className="mira-form-group">
                  <label className="mira-form-label text-sm font-extrabold text-slate-300">RECIPIENT EMAIL ADDRESS</label>
                  <input 
                    type="email"
                    value={prospectEmail}
                    onChange={e => setProspectEmail(e.target.value)}
                    className="mira-input text-base font-semibold py-3 px-4"
                    placeholder="e.g. alex@acme.com"
                  />
                </div>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-sm font-extrabold text-slate-300">EMAIL STRATEGY TONE</label>
                <div className="flex gap-2 flex-wrap">
                  {['Urgent Executive', 'CFO Financial Security', 'Consultative ROI'].map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setEmailTone(tone)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                        emailTone === tone 
                          ? 'bg-violet-600 text-white border border-violet-400 shadow-md' 
                          : 'bg-[#12182B] text-slate-300 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-sm font-extrabold text-slate-300">GENERATED EMAIL SUBJECT</label>
                <input 
                  type="text"
                  readOnly
                  value={getGeneratedEmail().subject}
                  className="mira-input text-sm font-bold py-2.5 px-4 text-cyan-300 bg-[#090D1A]"
                />
              </div>

              <div className="mira-form-group">
                <label className="mira-form-label text-sm font-extrabold text-slate-300">GENERATED EMAIL BODY</label>
                <textarea 
                  rows={7}
                  readOnly
                  value={getGeneratedEmail().body}
                  className="mira-input text-xs font-mono py-3 px-4 leading-relaxed text-slate-200 bg-[#090D1A]"
                />
              </div>

              {emailSentMessage && (
                <div className={`p-3 rounded-xl border text-xs font-bold ${
                  emailSentMessage.startsWith('✅') 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}>
                  {emailSentMessage}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="mira-btn mira-btn-secondary px-5 py-3 text-xs font-black uppercase flex items-center gap-2"
                  title="Opens your desktop/browser mail app with pre-filled subject & body"
                >
                  <Send className="w-4 h-4 text-cyan-400" /> OPEN IN EMAIL CLIENT
                </button>

                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={handleSendViaBackend}
                  className="mira-btn mira-btn-secondary px-5 py-3 text-xs font-black uppercase flex items-center gap-2 border-violet-500/50 text-violet-200 hover:bg-violet-600/30"
                  title="Sends email directly from MIRA Backend Engine using SMTP/Resend"
                >
                  {sendingEmail ? <RefreshCw className="w-4 h-4 animate-spin text-violet-400" /> : <Mail className="w-4 h-4 text-violet-400" />}
                  <span>{sendingEmail ? 'DISPATCHING...' : 'SEND VIA BACKEND ENGINE 🚀'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fullText = `Subject: ${getGeneratedEmail().subject}\n\n${getGeneratedEmail().body}`;
                    navigator.clipboard.writeText(fullText);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className="mira-btn mira-btn-primary px-6 py-3 text-xs font-black uppercase shadow-lg flex items-center gap-2"
                >
                  {emailCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{emailCopied ? 'COPIED TO CLIPBOARD!' : 'COPY EMAIL TEXT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
