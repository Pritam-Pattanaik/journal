import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div
      style={{
        background: 'rgb(var(--color-surface))',
        border: '1px solid rgb(var(--color-border))',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(x => !x)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: 'rgb(var(--color-text-primary))',
            lineHeight: 1.4,
          }}
        >
          {q}
        </span>
        {open ? (
          <ChevronUp size={18} strokeWidth={1.5} style={{ color: 'rgb(var(--color-text-tertiary))', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={18} strokeWidth={1.5} style={{ color: 'rgb(var(--color-text-tertiary))', flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div
          style={{
            padding: '0 20px 16px',
            fontSize: 'var(--text-sm)',
            color: 'rgb(var(--color-text-secondary))',
            lineHeight: 1.6,
            borderTop: '1px solid rgb(var(--color-border))',
            paddingTop: 14,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function Pricing() {
  return (
    <div style={{ width: '100%', paddingBottom: 96 }}>
      {/* Header */}
      <section
        style={{
          textAlign: 'center',
          padding: '80px 24px 64px',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: 'rgb(var(--color-success))',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 20,
          }}
        >
          Simple Pricing
        </div>
        <h1
          style={{
            fontSize: 'var(--text-4xl)',
            fontWeight: 600,
            color: 'rgb(var(--color-text-primary))',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Invest in your{' '}
          <span style={{ color: 'rgb(var(--color-accent))' }}>edge.</span>
        </h1>
        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'rgb(var(--color-text-secondary))',
            lineHeight: 1.6,
          }}
        >
          Start for free to explore the platform. Upgrade when you're ready to scale your trading.
        </p>
      </section>

      {/* Pricing Cards */}
      <section
        style={{
          maxWidth: 1024,
          margin: '0 auto',
          padding: '0 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
        className="max-md:grid-cols-1"
      >
        {plans.map(plan => (
          <div
            key={plan.name}
            style={{
              background: 'rgb(var(--color-surface))',
              border: plan.highlight
                ? '1px solid rgba(99,102,241,0.5)'
                : '1px solid rgb(var(--color-border))',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: plan.highlight ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
            }}
          >
            {/* Popular Badge */}
            {plan.badge && (
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgb(var(--color-accent))',
                  color: 'rgb(var(--color-text-inverse))',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  padding: '3px 12px',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}
              >
                {plan.badge}
              </div>
            )}

            <h3
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 600,
                color: plan.highlight ? 'rgb(var(--color-accent))' : 'rgb(var(--color-text-primary))',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}
            >
              {plan.name}
            </h3>

            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'rgb(var(--color-text-secondary))',
                marginBottom: 20,
                minHeight: 40,
                lineHeight: 1.5,
              }}
            >
              {plan.description}
            </p>

            <div
              style={{
                fontSize: 'var(--text-4xl)',
                fontWeight: 700,
                color: 'rgb(var(--color-text-primary))',
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                marginBottom: 24,
                lineHeight: 1,
              }}
            >
              {plan.price}
              {plan.price !== '₹0' && (
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 400,
                    color: 'rgb(var(--color-text-secondary))',
                    fontFamily: 'var(--font-sans)',
                    marginLeft: 4,
                  }}
                >
                  /mo
                </span>
              )}
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, flex: 1 }}>
              {plan.features.map((f, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 'var(--text-sm)',
                    color: f.included ? 'rgb(var(--color-text-primary))' : 'rgb(var(--color-text-tertiary))',
                  }}
                >
                  {f.included ? (
                    <Check size={16} strokeWidth={2} style={{ color: 'rgb(var(--color-success))', flexShrink: 0 }} />
                  ) : (
                    <X size={16} strokeWidth={2} style={{ color: 'rgb(var(--color-text-disabled))', flexShrink: 0 }} />
                  )}
                  {f.label}
                </li>
              ))}
            </ul>

            <Link
              to="/signup"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                textDecoration: 'none',
                textAlign: 'center',
                background: plan.highlight ? 'rgb(var(--color-accent))' : 'transparent',
                color: plan.highlight ? 'rgb(var(--color-text-inverse))' : 'rgb(var(--color-text-primary))',
                border: plan.highlight ? 'none' : '1px solid rgb(var(--color-border))',
                transition: 'background-color var(--duration-fast) var(--ease-out)',
              }}
              onMouseEnter={e => {
                if (plan.highlight) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgb(var(--color-accent-hover))';
                } else {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgb(var(--color-surface-hover))';
                }
              }}
              onMouseLeave={e => {
                if (plan.highlight) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgb(var(--color-accent))';
                } else {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                }
              }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </section>

      {/* FAQ Section */}
      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 600,
              color: 'rgb(var(--color-text-primary))',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
