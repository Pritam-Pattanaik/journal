import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, HelpCircle } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="w-full pb-32">
      {/* Header */}
      <section className="text-center pt-24 pb-16 px-6 animate-slide-up opacity-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-tv-xs text-profit font-bold uppercase tracking-widest mb-6">
          Simple Pricing
        </div>
        <h1 className="text-[50px] md:text-[70px] font-bold mb-6 text-primary drop-shadow-lg leading-tight">
          Invest in your <span className="text-gradient-accent">edge.</span>
        </h1>
        <p className="text-tv-xl text-secondary max-w-2xl mx-auto">
          Start for free to explore the platform. Upgrade when you're ready to scale your trading business to the next level.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Hobby */}
          <div className="glass-panel flex flex-col p-8 rounded-3xl animate-slide-up opacity-0 delay-100">
            <h3 className="text-2xl font-bold text-primary mb-2">Hobby</h3>
            <p className="text-secondary text-sm mb-6 h-10">For beginners keeping a simple journal.</p>
            <div className="text-[50px] font-bold text-primary mb-8"><span className="text-lg text-secondary font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> 50 Trades per month</li>
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Basic Analytics</li>
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Manual Entry</li>
              <li className="flex items-center gap-3 text-muted"><X className="w-5 h-5" /> Broker Sync</li>
              <li className="flex items-center gap-3 text-muted"><X className="w-5 h-5" /> AI Coach</li>
            </ul>
            <Link to="/signup" className="w-full py-4 glass-panel text-center font-bold rounded-xl hover:bg-white/10 transition-colors text-primary">
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="glass-panel flex flex-col p-8 rounded-3xl border border-accent/50 relative transform md:scale-105 shadow-glow-profit z-10 animate-slide-up opacity-0 delay-200 bg-white/5">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-glow-profit">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-accent-light mb-2">Pro</h3>
            <p className="text-secondary text-sm mb-6 h-10">For serious traders seeking consistency.</p>
            <div className="text-[50px] font-bold text-primary mb-8"><span className="text-lg text-secondary font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-primary"><Check className="w-5 h-5 text-profit" /> Unlimited Trades</li>
              <li className="flex items-center gap-3 text-primary"><Check className="w-5 h-5 text-profit" /> Advanced Heatmaps</li>
              <li className="flex items-center gap-3 text-primary"><Check className="w-5 h-5 text-profit" /> Automatic Broker Sync</li>
              <li className="flex items-center gap-3 text-primary"><Check className="w-5 h-5 text-profit" /> Basic AI Coach</li>
              <li className="flex items-center gap-3 text-muted"><X className="w-5 h-5" /> API Access</li>
            </ul>
            <Link to="/signup" className="w-full py-4 bg-accent text-white text-center font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-glow-profit">
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Elite */}
          <div className="glass-panel flex flex-col p-8 rounded-3xl animate-slide-up opacity-0 delay-300">
            <h3 className="text-2xl font-bold text-primary mb-2">Elite</h3>
            <p className="text-secondary text-sm mb-6 h-10">For institutional traders and syndicates.</p>
            <div className="text-[50px] font-bold text-primary mb-8"><span className="text-lg text-secondary font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Everything in Pro</li>
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Advanced AI Coach</li>
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Strategy Backtesting</li>
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Priority 24/7 Support</li>
              <li className="flex items-center gap-3 text-secondary"><Check className="w-5 h-5 text-profit" /> Custom API Access</li>
            </ul>
            <Link to="/signup" className="w-full py-4 glass-panel text-center font-bold rounded-xl hover:bg-white/10 transition-colors text-primary">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20 animate-slide-up opacity-0 delay-400">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {[
            { q: "Do I need to enter my credit card for the free trial?", a: "No! You can start your 14-day Pro trial without entering any payment information." },
            { q: "Which brokers do you support?", a: "We currently support automatic syncing with Zerodha (Kite), Interactive Brokers, TD Ameritrade, and Binance." },
            { q: "Is my trading data secure?", a: "Yes. Your data is encrypted at rest and in transit. We use bank-level security and do not sell your data to third parties." },
            { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges will be applied automatically." }
          ].map((faq, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-xl">
              <h4 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-accent" />
                {faq.q}
              </h4>
              <p className="text-secondary pl-7">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
