import React from 'react';
import { Shield, Brain, Activity } from 'lucide-react';
import { Reveal } from '../ui/Motion';

const steps = [
  {
    icon: Shield,
    title: 'Connect your broker',
    description: 'One-click OAuth or API-key sync. Trades import automatically.',
  },
  {
    icon: Activity,
    title: 'Journal with intent',
    description: 'Tag setups, emotions and screenshots. Fast keyboard-first UX.',
  },
  {
    icon: Brain,
    title: 'Let AI find the leaks',
    description: 'Weekly briefings surface the exact patterns hurting your P&L.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-6 py-32">
      <div className="flex flex-col md:flex-row gap-16">
        <div className="md:w-1/3">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-iris mb-4">How it works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-primary leading-[1.05] mb-5">
              Three steps to a measurable edge.
            </h2>
          </Reveal>
        </div>
        
        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-6 text-primary shadow-sm">
                  <step.icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg font-bold text-primary mb-3">{step.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
