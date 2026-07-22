import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal, StaggerContainer, StaggerItem, HoverLift } from '../../components/ui/Motion';

const plans = [
  {
    name: 'Hobby',
    price: '₹0',
    description: 'For beginners keeping a simple journal.',
    features: [
      { label: '50 Trades per month', included: true },
      { label: 'Basic Analytics', included: true },
      { label: 'Manual Entry', included: true },
      { label: 'Broker Sync', included: false },
      { label: 'AI Coach', included: false },
    ],
    cta: 'Get Started',
    ctaVariant: 'secondary' as const,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹999',
    description: 'For serious traders seeking consistency.',
    features: [
      { label: 'Unlimited Trades', included: true },
      { label: 'Advanced Heatmaps', included: true },
      { label: 'Automatic Broker Sync', included: true },
      { label: 'Basic AI Coach', included: true },
      { label: 'API Access', included: false },
    ],
    cta: 'Start 14-Day Free Trial',
    ctaVariant: 'primary' as const,
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Elite',
    price: '₹2,499',
    description: 'For institutional traders and syndicates.',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Advanced AI Coach', included: true },
      { label: 'Strategy Analytics', included: true },
      { label: 'Priority 24/7 Support', included: true },
      { label: 'Custom API Access', included: true },
    ],
    cta: 'Contact Sales',
    ctaVariant: 'secondary' as const,
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Do I need to enter my credit card for the free trial?',
    a: 'No! You can start your 14-day Pro trial without entering any payment information.',
  },
  {
    q: 'Which brokers do you support?',
    a: 'We currently support automatic syncing with Zerodha (Kite), Interactive Brokers, TD Ameritrade, and Binance.',
  },
  {
    q: 'Is my trading data secure?',
    a: 'Yes. Your data is encrypted at rest and in transit. We use bank-level security and do not sell your data to third parties.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges will be applied automatically.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="card bg-surface border border-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(x => !x)}
        className="w-full flex items-center justify-between p-5 bg-transparent border-none cursor-pointer text-left gap-4 outline-none focus-ring"
      >
        <span className="text-base font-semibold text-primary leading-tight font-display">
          {q}
        </span>
        {open ? (
          <ChevronUp size={20} strokeWidth={1.5} className="text-tertiary shrink-0" />
        ) : (
          <ChevronDown size={20} strokeWidth={1.5} className="text-tertiary shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 text-sm text-secondary leading-relaxed font-medium border-t border-border mt-1">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Pricing() {
  return (
    <div className="w-full pb-24 bg-canvas text-primary min-h-screen">
      {/* Header */}
      <section className="text-center pt-32 pb-16 max-w-2xl mx-auto px-6">
        <Reveal>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold uppercase tracking-widest mb-6">
            Simple Pricing
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-primary tracking-tight leading-[1.1] mb-6">
            Invest in your <span className="text-gradient">edge.</span>
          </h1>
          <p className="text-lg text-secondary leading-relaxed font-medium">
            Start for free to explore the platform. Upgrade when you're ready to scale your trading.
          </p>
        </Reveal>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" staggerChildren={0.1}>
          {plans.map(plan => (
            <StaggerItem key={plan.name}>
              <HoverLift 
                className={`card-raised p-8 flex flex-col relative h-full bg-surface ${
                  plan.highlight ? 'border border-iris/50 shadow-iris' : 'border border-border'
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap tracking-wide shadow-md shadow-accent/20">
                    {plan.badge}
                  </div>
                )}

                <h3 className={`font-display text-2xl font-bold mb-2 tracking-tight ${
                  plan.highlight ? 'text-accent' : 'text-primary'
                }`}>
                  {plan.name}
                </h3>

                <p className="text-sm text-secondary mb-6 min-h-[40px] leading-relaxed font-medium">
                  {plan.description}
                </p>

                <div className="font-mono-premium text-4xl font-bold text-primary tracking-tight mb-8 tabular-nums">
                  {plan.price}
                  {plan.price !== '₹0' && (
                    <span className="text-sm font-normal text-secondary font-sans ml-1">
                      /mo
                    </span>
                  )}
                </div>

                <ul className="flex flex-col gap-4 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm font-medium ${
                      f.included ? 'text-primary' : 'text-tertiary'
                    }`}>
                      {f.included ? (
                        <Check size={18} strokeWidth={2.5} className="text-success shrink-0" />
                      ) : (
                        <X size={18} strokeWidth={2.5} className="text-muted shrink-0" />
                      )}
                      {f.label}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`flex items-center justify-center py-3 px-6 rounded-xl text-[15px] font-bold text-center transition-all focus-ring ${
                    plan.highlight 
                      ? 'bg-accent text-white hover:bg-accent-hover shadow-md shadow-accent/20' 
                      : 'bg-surface-1 border border-border text-primary hover:bg-surface-2'
                  }`}
                >
                  {plan.cta}
                </Link>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6">
        <Reveal className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary tracking-tight">
            Frequently Asked Questions
          </h2>
        </Reveal>
        <Reveal delay={0.2} className="flex flex-col gap-1">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </Reveal>
      </section>
    </div>
  );
}
