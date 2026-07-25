import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { Reveal } from '../ui/Motion';
import { MagneticButton } from '../ui/MagneticButton';
import { cn } from '../../lib/cn';

export default function PricingSection() {
  const [annualBilling, setAnnualBilling] = useState(true);
  const [revengeCost, setRevengeCost] = useState(5000);
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Starter Tier',
      badge: 'Forever Free',
      price: annualBilling ? '₹0' : '₹0',
      period: '/ month',
      desc: 'Essential algorithmic journaling and expectancy analytics for developing traders.',
      cta: 'Claim Free Starter Plan',
      popular: false,
      features: [
        'Automated broker sync (1 connection)',
        'Verified R:R expectancy calculations',
        '30-day execution performance ledger',
        'Standard setup attribution tags',
        'Read-only encrypted token vault'
      ]
    },
    {
      name: 'Pro Quantitative',
      badge: 'Most Popular',
      price: annualBilling ? '₹1,249' : '₹1,599',
      period: '/ month (billed annually)',
      desc: 'The complete discipline workstation engineered to defend funded prop allocations.',
      cta: 'Start 14-Day Free Trial',
      popular: true,
      features: [
        'Unlimited automated broker integration',
        'Real-time AI Behavioral Coach monitoring',
        'Automated Daily Drawdown lockout guardrails',
        'Live economic event schedules & volatility alerts',
        'Full CSV audit exports for accounting compliance',
        'Asynchronous real-time broker sync via webhooks'
      ]
    },
    {
      name: 'Institutional Desk',
      badge: 'Custom Desk',
      price: annualBilling ? '₹3,499' : '₹4,299',
      period: '/ month (billed annually)',
      desc: 'Designed for multi-account algorithmic desks and proprietary evaluation firms.',
      cta: 'Request Desk Setup',
      popular: false,
      features: [
        'Everything included in Pro Quantitative tier',
        'Multi-account copy orchestration ledgers',
        'Custom strategy alert webhooks & API access',
        'Dedicated quantitative desk architect',
        'SOC-2 Type II verification ready architecture',
        'Priority 24/7 technical desk engineering support'
      ]
    }
  ];

  return (
    <section id="pricing" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-24 relative z-20 scroll-mt-20" aria-label="Transparent Investment Plans and ROI Calculator">
      
      {/* Chapter Title Bar */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Reveal direction="up">
          <p className="text-xs font-semibold uppercase tracking-wider text-iris mb-2.5">
            Rational Software Economics
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
            An investment that justifies itself by blocking one mistake.
          </h2>
          <p className="text-base sm:text-lg text-secondary leading-relaxed">
            Choose your algorithmic workstation tier. Change or cancel your plan anytime with zero termination fees.
          </p>
        </Reveal>
      </div>

      {/* ── Interactive ROI Estimator Container ── */}
      <Reveal direction="up" delay={0.1}>
        <div className="max-w-4xl mx-auto p-7 sm:p-9 rounded-3xl bg-surface-1 border border-border mb-16 shadow-card">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success font-semibold text-xs">
                <TrendingUp size={14} /> <span>ROI Justification Calculator</span>
              </div>
              <h4 className="font-display text-2xl font-bold text-primary">
                What is the financial impact of an emotional trade?
              </h4>
              <p className="text-sm text-secondary leading-relaxed">
                Adjust the slider to estimate your average capital drawdown when discipline rules are violated during trading sessions.
              </p>
            </div>

            {/* Slider Controls */}
            <div className="w-full md:w-80 flex flex-col gap-4 bg-surface-0 p-6 rounded-2xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Est. Loss / Mistake:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-danger tabular-nums">
                  ₹{revengeCost.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={revengeCost}
                onChange={(e) => setRevengeCost(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-2 rounded-lg cursor-pointer outline-none focus-ring"
                aria-label="Estimated loss per mistake slider"
              />
              <div className="text-center pt-3 border-t border-border/50 text-xs font-semibold text-success">
                Avoiding 1 error = {(revengeCost / 1249).toFixed(1)}x your annual subscription!
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Billing Cycle Toggle Switch ── */}
      <Reveal direction="up" delay={0.15}>
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={cn("text-sm font-semibold cursor-pointer transition-colors", !annualBilling ? "text-primary font-bold" : "text-secondary")} onClick={() => setAnnualBilling(false)}>
            Monthly Billing
          </span>
          
          <button
            role="switch"
            aria-checked={annualBilling}
            aria-label="Toggle annual billing discount"
            onClick={() => setAnnualBilling(!annualBilling)}
            className="w-14 h-8 rounded-full bg-surface-2 border border-border-hover p-1 transition-all flex items-center outline-none focus-ring cursor-pointer shadow-inner"
          >
            <div className={cn(
              "w-6 h-6 rounded-full bg-primary transition-transform duration-300 shadow-sm",
              annualBilling ? "translate-x-6" : "translate-x-0"
            )} />
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAnnualBilling(true)}>
            <span className={cn("text-sm font-semibold transition-colors", annualBilling ? "text-primary font-bold" : "text-secondary")}>
              Annual Billing
            </span>
            <span className="text-[11px] font-bold text-canvas bg-success px-2.5 py-0.5 rounded-full">
              Save 22%
            </span>
          </div>
        </div>
      </Reveal>

      {/* ── Pricing Tier Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <Reveal key={idx} direction="up" delay={0.1 + idx * 0.1}>
            <div
              className={cn(
                "h-full rounded-3xl p-8 flex flex-col justify-between border transition-all duration-300 relative",
                plan.popular
                  ? "bg-surface-1 border-primary shadow-card ring-1 ring-primary/40 scale-[1.02]"
                  : "bg-surface-0 border-border hover:border-border-hover shadow-card"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-canvas text-xs font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5">
                  <Sparkles size={13} /> <span>Built for Funded Traders</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase text-tertiary tracking-wider">{plan.badge}</span>
                </div>
                <h3 className="font-display font-bold text-2xl text-primary mb-2.5">{plan.name}</h3>
                <p className="text-sm text-secondary leading-relaxed mb-6 h-12">{plan.desc}</p>

                {/* Price Display */}
                <div className="pb-6 mb-6 border-b border-border flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-primary tabular-nums tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-medium text-tertiary">{plan.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-secondary font-medium">
                      <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <MagneticButton
                  onClick={() => navigate('/signup')}
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full min-h-[48px] justify-center text-sm font-bold shadow-sm"
                >
                  {plan.cta}
                </MagneticButton>
                
                <p className="text-xs text-center text-tertiary font-medium mt-4 flex items-center justify-center gap-1.5">
                  <Shield size={13} className="text-success" />
                  <span>No hidden fees · Instant cancellation</span>
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

    </section>
  );
}
