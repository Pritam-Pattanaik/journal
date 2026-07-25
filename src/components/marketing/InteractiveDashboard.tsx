import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  TrendingUp, Activity, Brain, Shield, BarChart2, BookOpen, AlertCircle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, Zap, Target, Sliders, RefreshCw 
} from 'lucide-react';
import { Reveal } from '../ui/Motion';
import { cn } from '../../lib/cn';

type TabType = 'equity' | 'journal' | 'aicoach';

export default function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('equity');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(4);
  const shouldReduceMotion = useReducedMotion();

  const equityData = [
    { day: 'Day 1', date: 'Oct 02', pnl: '+₹12,400', val: '$102,400', rr: '2.1R', note: 'Disciplined NQ breakout entry' },
    { day: 'Day 15', date: 'Oct 16', pnl: '+₹28,600', val: '$104,200', rr: '1.8R', note: 'Scaled out at targeted resistance' },
    { day: 'Day 30', date: 'Oct 31', pnl: '+₹42,100', val: '$105,800', rr: '3.0R', note: 'A+ Gold reversal setup' },
    { day: 'Day 45', date: 'Nov 14', pnl: '+₹61,350', val: '$107,900', rr: '2.4R', note: 'AI Coach alerted & blocked revenge loss' },
    { day: 'Day 60', date: 'Nov 28', pnl: '+₹84,250', val: '$110,400', rr: '2.8R', note: 'Strict risk rules maintained · All targets met' },
  ];

  const recentTrades = [
    { time: '09:31:14 AM', ticker: 'NQ #Dec24', dir: 'LONG', size: '4 Contracts', rr: '+2.4R', pnl: '+₹32,400', grade: 'A+', verified: true },
    { time: '10:14:02 AM', ticker: 'XAUUSD', dir: 'LONG', size: '2 Lots', rr: '+1.8R', pnl: '+₹18,500', grade: 'A', verified: true },
    { time: '11:05:40 AM', ticker: 'ES #Dec24', dir: 'SHORT', size: '3 Contracts', rr: '-1.0R', pnl: '-₹12,000', grade: 'B', verified: true },
  ];

  const selectedPoint = hoveredPoint !== null ? equityData[hoveredPoint] : equityData[4];

  return (
    <section id="workspace" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 relative z-20 mb-28 scroll-mt-20">
      
      {/* Chapter Title & Rationale Header */}
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <Reveal direction="up">
          <p className="text-xs font-mono-stat font-bold uppercase tracking-widest text-iris mb-3">
            Interactive Showcase · Try It Now
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-4">
            An algorithmic command center for your trading brain.
          </h2>
          <p className="text-secondary text-base sm:text-lg leading-relaxed">
            Toggle the live tabs below to inspect how TradeVault transforms chaotic execution into verified, repeatable positive expectancy.
          </p>
        </Reveal>
      </div>

      {/* ── Centerpiece Interactive Workspace Container ── */}
      <Reveal direction="up" delay={0.1}>
        <div className="w-full rounded-[2rem] bg-surface-1 border border-border-hover p-2 sm:p-4 shadow-floating overflow-hidden">
          
          <div className="w-full bg-canvas rounded-[1.5rem] overflow-hidden flex flex-col border border-border">
            
            {/* ── Workspace Title Bar & Interactive Tab Navigation ── */}
            <div className="min-h-[56px] border-b border-border flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-2.5 gap-3 bg-surface-0/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-gold/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <span className="text-xs font-mono-stat text-tertiary font-bold pl-2 border-l border-border/60">
                  WORKSPACE v2.0 // PROP_ENGAGE
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono-stat text-success font-semibold px-2 py-0.5 rounded bg-success/10 border border-success/20">
                  <Zap size={11} /> LIVE API SYNCED
                </span>
              </div>

              {/* Functional Tab Buttons */}
              <div className="flex items-center p-1 rounded-xl bg-surface-1 border border-border/80 text-xs font-semibold gap-1 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start" role="tablist">
                {[
                  { id: 'equity', label: 'P&L Equity Curve', icon: TrendingUp },
                  { id: 'journal', label: 'Deep Trade Journal', icon: BookOpen },
                  { id: 'aicoach', label: 'AI Coach Insights', icon: Brain, badge: 'NEW' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg transition-all font-display duration-200 min-h-[36px] outline-none focus-ring flex-1 sm:flex-none",
                      activeTab === tab.id 
                        ? "bg-primary text-surface-0 font-bold shadow-sm" 
                        : "text-secondary hover:text-primary hover:bg-surface-2"
                    )}
                  >
                    <tab.icon size={14} className={activeTab === tab.id ? "text-surface-0" : "text-iris"} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="text-[9px] font-mono-stat font-extrabold bg-gold text-canvas px-1.5 py-0.2 rounded">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Stat Metric Summary Header Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border bg-surface-0/60 divide-y sm:divide-y-0 lg:divide-x divide-border">
              {[
                { label: 'NET PROFIT (90 DAYS)', value: selectedPoint.pnl, sub: `Account Equity: ${selectedPoint.val}`, color: 'text-success', icon: TrendingUp },
                { label: 'WIN RATE & EXPECTANCY', value: '68.4%', sub: '+₹3,850 avg per trade', color: 'text-primary', icon: Target },
                { label: 'RISK TO REWARD RATIO', value: selectedPoint.rr, sub: 'Target threshold ≥ 2.0R', color: 'text-iris', icon: BarChart2 },
                { label: 'BEHAVIORAL DISCIPLINE', value: '98.2 / 100', sub: '0 rule breaches this month', color: 'text-success', icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="p-4 sm:p-5 flex flex-col gap-1 transition-colors hover:bg-surface-1/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-stat font-extrabold uppercase tracking-wider text-tertiary">{stat.label}</span>
                    <stat.icon size={15} className="text-tertiary" />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-mono-stat font-extrabold tabular-nums tracking-tight ${stat.color}`}>
                    {stat.value}
                  </div>
                  <span className="text-xs font-medium text-secondary truncate">{stat.sub}</span>
                </div>
              ))}
            </div>

            {/* ── Dynamic Tab View Content Panel ── */}
            <div className="p-5 sm:p-8 min-h-[420px] bg-canvas flex flex-col justify-between">
              <AnimatePresence mode="wait">
                
                {/* ── VIEW 1: EQUITY & P&L CURVE INTERACTION ── */}
                {activeTab === 'equity' && (
                  <motion.div
                    key="equity"
                    id="panel-equity"
                    role="tabpanel"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full flex flex-col gap-6"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-1 border border-border">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-success/15 text-success text-xs font-mono-stat font-bold border border-success/30">
                          INSTITUTIONAL CURVE · +18.4% GAIN
                        </span>
                        <span className="text-sm font-semibold text-secondary">
                          Hover or tap data nodes below to inspect verified trade attributions.
                        </span>
                      </div>
                      <div className="text-xs font-mono-stat text-tertiary">
                        Selected Node: <strong className="text-primary">{selectedPoint.date}</strong> · <strong className="text-success">{selectedPoint.pnl}</strong>
                      </div>
                    </div>

                    {/* SVG Interactive Line Chart Representation */}
                    <div className="relative w-full h-64 sm:h-72 bg-surface-0/40 border border-border rounded-2xl p-4 flex flex-col justify-end overflow-hidden">
                      {/* Grid line divisions */}
                      <div className="absolute inset-x-0 top-1/4 border-b border-border/40 border-dashed pointer-events-none" />
                      <div className="absolute inset-x-0 top-2/4 border-b border-border/40 border-dashed pointer-events-none" />
                      <div className="absolute inset-x-0 top-3/4 border-b border-border/40 border-dashed pointer-events-none" />

                      {/* Line Chart path */}
                      <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 180">
                        <defs>
                          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(32, 196, 117, 0.35)" />
                            <stop offset="100%" stopColor="rgba(32, 196, 117, 0.0)" />
                          </linearGradient>
                        </defs>
                        {/* Shaded area */}
                        <path d="M10,160 Q80,140 160,110 T280,60 T390,20 L390,180 L10,180 Z" fill="url(#pnlGrad)" />
                        {/* Primary vector curve */}
                        <path d="M10,160 Q80,140 160,110 T280,60 T390,20" fill="none" stroke="#20C475" strokeWidth="3" strokeLinecap="round" />
                      </svg>

                      {/* Interactive Scrubbing Nodes */}
                      <div className="relative z-10 flex justify-between items-end w-full h-full px-2 sm:px-6 pb-2">
                        {[
                          { h: 'h-1/5', idx: 0, label: 'Oct 02' },
                          { h: 'h-2/5', idx: 1, label: 'Oct 16' },
                          { h: 'h-3/5', idx: 2, label: 'Oct 31' },
                          { h: 'h-4/5', idx: 3, label: 'Nov 14' },
                          { h: 'h-[95%]', idx: 4, label: 'Nov 28' },
                        ].map((node) => (
                          <button
                            key={node.idx}
                            onClick={() => setHoveredPoint(node.idx)}
                            onMouseEnter={() => setHoveredPoint(node.idx)}
                            className="group flex flex-col items-center gap-2 outline-none focus-ring p-2"
                            aria-label={`Inspect equity node for ${node.label}`}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                              hoveredPoint === node.idx
                                ? "bg-success border-white scale-125 shadow-[0_0_15px_rgba(32,196,117,0.8)]"
                                : "bg-surface border-success/60 group-hover:bg-success/40"
                            )}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                            </div>
                            <span className={cn(
                              "text-xs font-mono-stat font-semibold transition-colors",
                              hoveredPoint === node.idx ? "text-primary font-bold" : "text-tertiary"
                            )}>
                              {node.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Live Data Tooltip Display Box */}
                      <div className="absolute top-4 left-6 max-w-sm p-3 rounded-xl bg-surface-1/95 border border-border shadow-lg backdrop-blur-md hidden sm:block">
                        <p className="text-[11px] font-mono-stat font-extrabold text-iris uppercase tracking-wider mb-1">
                          EXECUTION METRIC LOG · {selectedPoint.date}
                        </p>
                        <p className="text-xs text-secondary font-medium leading-relaxed">
                          "{selectedPoint.note}" — Strategy R:R verified at <strong className="text-success font-mono-stat">{selectedPoint.rr}</strong>.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── VIEW 2: DEEP TRADE JOURNAL LOG ── */}
                {activeTab === 'journal' && (
                  <motion.div
                    key="journal"
                    id="panel-journal"
                    role="tabpanel"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-bold text-base text-primary flex items-center gap-2">
                        <BookOpen size={18} className="text-iris" />
                        <span>Automated Broker Fill Log · Verified Audited Executions</span>
                      </h3>
                      <span className="text-xs font-mono-stat text-tertiary">0 MANUAL DATA ENTRANTS REQUIRED</span>
                    </div>

                    {/* Responsive Table Representation */}
                    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface-0">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-border bg-surface-1 text-[11px] font-mono-stat font-extrabold text-tertiary uppercase tracking-wider">
                            <th className="p-3 pl-4">Timestamp &amp; Broker</th>
                            <th className="p-3">Instrument &amp; Size</th>
                            <th className="p-3">Direction</th>
                            <th className="p-3">Expectancy (R:R)</th>
                            <th className="p-3">Net Realized P&amp;L</th>
                            <th className="p-3 pr-4 text-right">Discipline Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-sm font-medium">
                          {recentTrades.map((t, i) => (
                            <tr key={i} className="hover:bg-surface-1/50 transition-colors">
                              <td className="p-3 pl-4 font-mono-stat text-xs text-secondary flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                                <span>{t.time}</span>
                              </td>
                              <td className="p-3 font-mono-stat font-bold text-primary">{t.ticker} <span className="text-xs font-normal text-tertiary ml-1">({t.size})</span></td>
                              <td className="p-3 font-mono-stat">
                                {t.dir === 'LONG' ? (
                                  <span className="inline-flex items-center text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">
                                    <ArrowUpRight size={13} className="mr-0.5" /> LONG
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-xs font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20">
                                    <ArrowDownRight size={13} className="mr-0.5" /> SHORT
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono-stat font-bold text-secondary">{t.rr}</td>
                              <td className={`p-3 font-mono-stat font-extrabold tabular-nums ${t.pnl.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                                {t.pnl}
                              </td>
                              <td className="p-3 pr-4 text-right">
                                <span className={cn(
                                  "inline-block font-mono-stat font-bold text-xs px-2.5 py-1 rounded-md border",
                                  t.grade === 'A+' ? "bg-iris/15 text-iris border-iris/30" : "bg-surface-2 text-secondary border-border"
                                )}>
                                  GRADE: {t.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* ── VIEW 3: AI COACH BEHAVIORAL INTERVENTION ── */}
                {activeTab === 'aicoach' && (
                  <motion.div
                    key="aicoach"
                    id="panel-aicoach"
                    role="tabpanel"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {/* Diagnostic column */}
                    <div className="md:col-span-1 p-5 rounded-2xl bg-surface-0 border border-border flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 text-xs font-mono-stat font-bold uppercase tracking-wider text-iris mb-3">
                          <Brain size={14} /> AI PATTERN AUDITION
                        </div>
                        <h4 className="font-display text-lg font-bold text-primary mb-2">
                          Revenge Trade Interception
                        </h4>
                        <p className="text-sm text-secondary leading-relaxed mb-4">
                          Our continuous behavioral engine audits your execution velocity. When emotional variance spikes after a loss, TradeVault intervenes instantly.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-between text-xs font-mono-stat font-bold text-danger">
                        <span>EST. DRAWDOWN PREVENTED:</span>
                        <span className="text-sm">+₹45,000</span>
                      </div>
                    </div>

                    {/* Simulated Coaching timeline */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-surface-1 border border-border flex flex-col gap-4">
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-2 border border-border text-sm">
                        <div className="w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertCircle size={16} className="text-danger" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs font-mono-stat font-bold mb-1">
                            <span className="text-danger">SYSTEM ALERT · 11:08 AM</span>
                            <span className="text-tertiary">RULE #4 VIOLATED</span>
                          </div>
                          <p className="text-primary font-medium">
                            Attempted short entry on ES Futures occurred just <strong className="text-danger font-bold">140 seconds</strong> after stopping out on NQ. Pattern recognition indicates <strong className="text-danger font-bold">92% probability of Revenge Trading</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-iris/10 border border-iris/25 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-iris text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Shield size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs font-mono-stat font-bold mb-1">
                            <span className="text-iris font-extrabold">TRADEVAULT GUARDRAIL ACTIVE</span>
                            <span className="text-success">CAPITAL LOCKED</span>
                          </div>
                          <p className="text-primary font-semibold">
                            Order transmission halted. 30-minute mandatory cooling-off protocol engaged to protect daily funded evaluation limits.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Assurance Bar */}
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono-stat text-tertiary">
                <span className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>ALL CALCULATIONS IN REAL-TIME · SOC-2 COMPLIANT AUDIT TRAIL</span>
                </span>
                <span className="font-semibold text-secondary">
                  LATENCY WITH BROKER TERMINAL: <strong className="text-success">&lt; 8ms</strong>
                </span>
              </div>
            </div>

          </div>

        </div>
      </Reveal>

    </section>
  );
}
