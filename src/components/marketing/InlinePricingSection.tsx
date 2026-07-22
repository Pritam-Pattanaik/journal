import React from 'react';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal, StaggerContainer, StaggerItem, HoverLift } from '../ui/Motion';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For beginners keeping a simple journal.',
    features: [
      { label: 'Unlimited manual trades', included: true },
      { label: 'Basic analytics', included: true },
      { label: '1 broker sync', included: true },
      { label: 'Community access', included: true },
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
      { label: 'Everything in Starter', included: true },
      { label: 'AI Behavioral Coach', included: true },
      { label: 'Unlimited broker sync', included: true },
      { label: 'Strategy analytics', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: 'Start 14-Day Free Trial',
    ctaVariant: 'primary' as const,
    highlight: true,
    badge: 'Most Popular',
  },
];

export default function InlinePricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="w-full max-w-5xl mx-auto px-6 py-32">
      <div className="text-center mb-16">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-4">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-primary mb-5">
            Simple. Fair.
          </h2>
          <p className="text-secondary text-lg">Everything to get disciplined.</p>
        </Reveal>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-3xl mx-auto" staggerChildren={0.1}>
        {plans.map(plan => (
          <StaggerItem key={plan.name}>
            <HoverLift 
              className={`card-raised p-8 flex flex-col relative h-full bg-surface ${
                plan.highlight ? 'border border-iris/50 shadow-iris' : 'border border-border'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-iris text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <h3 className="font-display text-2xl font-bold text-primary mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-4xl font-bold text-primary tracking-tight">
                  {plan.price}
                </span>
                {plan.price !== 'Free' && <span className="text-sm font-semibold text-tertiary">/mo</span>}
              </div>
              <p className="text-sm text-secondary font-medium leading-relaxed mb-8">
                {plan.description}
              </p>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map(feat => (
                    <li key={feat.label} className="flex items-start gap-3">
                      {feat.included ? (
                        <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} strokeWidth={3} className="text-success" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center shrink-0 mt-0.5 opacity-50">
                          <X size={12} strokeWidth={3} className="text-tertiary" />
                        </div>
                      )}
                      <span className={feat.included ? 'text-sm font-semibold text-primary' : 'text-sm font-medium text-tertiary'}>
                        {feat.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate('/signup')}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all outline-none focus-ring ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-iris to-accent text-white shadow-[0_0_20px_rgba(var(--color-iris),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-iris),0.5)] hover:scale-[1.02]'
                    : 'bg-surface-2 text-primary border border-border hover:bg-surface-3 hover:border-border-hover'
                }`}
              >
                {plan.cta}
              </button>
            </HoverLift>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
