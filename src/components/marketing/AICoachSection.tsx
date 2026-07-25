import React from 'react';
import { Brain, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Reveal } from '../ui/Motion';

export default function AICoachSection() {
  return (
    <section id="ai-coach" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-24 relative z-20 scroll-mt-20" aria-label="AI Behavioral Coach">
      
      <div className="rounded-3xl bg-surface-1 border border-border p-8 sm:p-12 lg:p-16 shadow-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-iris/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Explanation */}
          <div className="lg:col-span-6 space-y-6">
            <Reveal direction="up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-semibold text-primary mb-2 shadow-xs">
                <Brain size={14} className="text-iris" />
                <span>Real-Time Behavioral Discipline Core</span>
              </div>
              
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-[1.08]">
                An institutional mentor that intervenes before tilt occurs.
              </h2>
              
              <p className="text-base sm:text-lg text-secondary leading-relaxed font-normal">
                Trading consistency cannot rely solely on human willpower during extended drawdown sequences. TradeVault’s embedded analytical core continuously evaluates your order submission patterns, contract sizing anomalies, and loss frequency in real-time.
              </p>

              <div className="space-y-3.5 pt-4">
                {[
                  "Detects contract sizing anomalies immediately upon placement",
                  "Flags order executions occurring in historically low-expectancy hours",
                  "Enforces structured cooling-off intervals following consecutive losses",
                  "Audits decision variance with objective expectancy scoring"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm font-medium text-secondary">
                    <CheckCircle2 size={18} className="text-success shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right Live Simulation Card */}
          <div className="lg:col-span-6">
            <Reveal direction="up" delay={0.15}>
              <div className="rounded-3xl bg-surface-0 border border-border p-6 sm:p-8 shadow-card space-y-6">
                
                <div className="flex items-center justify-between border-b border-border/60 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-iris text-white flex items-center justify-center font-bold shadow-md">
                      <Brain size={20} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-primary">TradeVault Behavioral Core</h4>
                      <p className="text-xs text-secondary font-medium flex items-center gap-1.5 pt-0.5">
                        <span className="w-2 h-2 rounded-full bg-success inline-block" />
                        <span>Real-time Order Evaluation</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-success bg-success/15 px-3 py-1 rounded-full border border-success/30">
                    Active Guardrail
                  </span>
                </div>

                {/* Simulated Interventions Feed */}
                <div className="space-y-4 pt-1">
                  
                  <div className="p-5 rounded-2xl bg-surface-1/80 border border-border flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger shrink-0 mt-0.5">
                      <AlertCircle size={18} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-danger">
                        <span>Sizing Variance Alert</span>
                        <span className="text-tertiary font-normal">14:02 EST</span>
                      </div>
                      <p className="text-sm font-normal text-secondary leading-relaxed">
                        Warning: Order submission for 10 contracts represents a <strong className="text-primary font-semibold">250% position sizing spike</strong> above your verified 30-day moving average.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-1/80 border border-iris/40 flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-iris/10 flex items-center justify-center text-iris shrink-0 mt-0.5">
                      <Sparkles size={18} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-iris">
                        <span>Behavioral Intervention Triggered</span>
                        <span className="text-success font-medium">Order Cancelled</span>
                      </div>
                      <p className="text-sm font-medium text-primary leading-relaxed">
                        "Historical execution analytics indicate a 14% win-rate when increasing contract sizing immediately after a stopped-out trade. Order routing has been halted."
                      </p>
                    </div>
                  </div>

                </div>

                <div className="p-4 rounded-xl bg-surface-1/50 border border-border/80 flex items-center justify-between text-xs font-semibold text-secondary">
                  <span>Capital Preservation Value Recognized:</span>
                  <span className="text-success font-bold text-sm">+₹114,200</span>
                </div>

              </div>
            </Reveal>
          </div>

        </div>

      </div>

    </section>
  );
}
