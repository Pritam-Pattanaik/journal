import React, { useState } from 'react';
import { ChevronDown, Shield, Lock, Terminal, HelpCircle } from 'lucide-react';
import { Reveal } from '../ui/Motion';
import { cn } from '../../lib/cn';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does TradeVault connect to my brokerage without risking my trading capital?",
      a: "TradeVault integrates exclusively via standard OAuth protocols and Read-Only API tokens. When configuring credentials in MetaTrader, Interactive Brokers, Tradovate, or custom webhooks, you strictly leave 'Order Execution' and 'Fund Withdrawal' permissions disabled in your broker portal. Our software cannot initiate trades or move funds under any technical circumstance."
    },
    {
      q: "How does the automated daily drawdown lockout work with evaluation prop firms?",
      a: "You enter your evaluation's specific daily drawdown barrier into your TradeVault risk preferences (for example, a maximum $2,000 drawdown threshold in a 24-hour cycle). When account equity reaches this limit, our real-time engine intervenes by blocking further order transmission from our connected tools and initiating an automated cooling-off period, preserving your challenge status."
    },
    {
      q: "Does TradeVault cause any execution delays or impact terminal performance?",
      a: "No. Our quantitative analytics and broker synchronizations run asynchronously in the background via lightweight webhooks and read-only APIs. Your charting platforms and trading terminals operate at absolute peak local speed without interference."
    },
    {
      q: "Can I export my verified trading records for tax accounting and audits?",
      a: "Yes. Every order fill, slippage measurement, transaction commission, and expectancy evaluation is formatted automatically into institutional ledgers. You can export complete records instantly as standard CSV or Excel files designed specifically for professional tax reporting and firm audit verifications."
    },
    {
      q: "What differentiates the AI Behavioral Coach from automated retail trading bots?",
      a: "TradeVault is strictly a quantitative risk management and journaling workstation; we do not sell retail trading signal bots. Our embedded AI acts as an objective behavioral mentor trained on quantitative risk discipline models. It reviews your real-time order history to identify detrimental habit patterns—such as sizing spikes after consecutive stop-outs or unmanaged risk during macroeconomic announcements—to help you protect your capital."
    },
    {
      q: "Can I adjust or cancel my subscription anytime without loss of historical logs?",
      a: "Yes. You can manage or cancel your subscription directly within your settings billing portal with a single click and zero termination fees. You retain permanent read access to your exported historical ledgers and trading journals."
    },
  ];

  const toggleAccordion = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-24 relative z-20 scroll-mt-24" aria-label="Objection Resolution FAQ Vault">
      
      {/* Chapter Title Bar */}
      <div className="text-center mb-16">
        <Reveal direction="up">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-3 flex items-center justify-center gap-1.5">
            <HelpCircle size={14} className="text-iris" />
            <span>Objection Resolution Vault</span>
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
            Definitive answers regarding security &amp; performance.
          </h2>
          <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-2xl mx-auto font-normal">
            We operate with complete algorithmic transparency. Here are comprehensive technical explanations regarding data privacy, background sync, and prop firm compliance.
          </p>
        </Reveal>
      </div>

      {/* ── Zero-CLS Accordion Matrix ── */}
      <div className="space-y-4">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx;
          const answerId = `faq-answer-${idx}`;

          return (
            <Reveal key={idx} direction="up" delay={0.04 * idx}>
              <div
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isOpen 
                    ? "bg-surface-1 border-border-hover shadow-card" 
                    : "bg-surface-0 border-border hover:border-border-hover"
                )}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="w-full px-6 py-5 flex items-center justify-between text-left outline-none focus-ring min-h-[56px] gap-4"
                >
                  <span className="font-display font-bold text-base sm:text-lg text-primary">
                    {item.q}
                  </span>
                  <div className={cn(
                    "w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-secondary transition-transform duration-300 shrink-0",
                    isOpen && "rotate-180 bg-primary text-canvas"
                  )}>
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </div>
                </button>

                <div
                  id={answerId}
                  role="region"
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-6 px-6 pt-1" : "grid-rows-[0fr] opacity-0 px-6"
                  )}
                >
                  <div className="overflow-hidden text-sm sm:text-base text-secondary leading-relaxed font-normal border-t border-border/50 pt-4">
                    {item.a}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Trust Support Bar */}
      <div className="mt-14 text-center text-xs font-semibold text-tertiary flex flex-wrap items-center justify-center gap-8 border-t border-border/60 pt-8">
        <span className="flex items-center gap-1.5"><Lock size={14} className="text-success" /> <span>256-Bit TLS Encryption</span></span>
        <span className="flex items-center gap-1.5"><Shield size={14} className="text-success" /> <span>Read-Only Token Vault</span></span>
        <span className="flex items-center gap-1.5"><Terminal size={14} className="text-primary" /> <span>SOC-2 Compatible Protocols</span></span>
      </div>

    </section>
  );
}
