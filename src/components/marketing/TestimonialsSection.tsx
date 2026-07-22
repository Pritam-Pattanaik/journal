import React from 'react';
import { StaggerContainer, StaggerItem } from '../ui/Motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "TradeVault is the first journal that actually changed how I trade. The AI flagged my revenge-trade window on Wednesdays. I killed the leak in three weeks.",
    author: "Full-time Options Trader"
  },
  {
    quote: "I stopped guessing which setups made me money. My R:R went from 1.1 to 2.3 because the strategy analytics don't lie.",
    author: "Prop Firm Funded Trader"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-32">
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8" staggerChildren={0.1}>
        {testimonials.map((t, i) => (
          <StaggerItem key={i}>
            <div className="card-raised p-8 h-full flex flex-col relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 text-border opacity-50 group-hover:opacity-100 group-hover:text-iris/10 transition-colors">
                <Quote size={80} />
              </div>
              <p className="text-primary text-lg leading-relaxed font-medium mb-8 relative z-10">
                "{t.quote}"
              </p>
              <p className="text-tertiary text-sm font-bold uppercase tracking-widest mt-auto relative z-10">
                — {t.author}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
