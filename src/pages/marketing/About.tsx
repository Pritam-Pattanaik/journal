import React from 'react';
import { Target, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal, StaggerContainer, StaggerItem, HoverLift } from '../../components/ui/Motion';
import aboutGraphic from '../../assets/images/about-graphic.png';

export default function About() {
  return (
    <div className="w-full flex flex-col items-center bg-canvas text-primary overflow-x-hidden min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <Reveal>
          <h1 className="font-display text-5xl md:text-[80px] font-bold mb-6 text-primary tracking-tight leading-tight">
            Built for <span className="text-gradient">Traders</span>.<br/>Powered by AI.
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed mb-16 font-medium">
            We believe that successful trading isn't just about strategy—it's about discipline, risk management, and continuous mathematical analysis of your edge.
          </p>
        </Reveal>
        
        {/* About Graphic */}
        <Reveal delay={0.2} className="w-full max-w-5xl relative mb-32">
          <div className="absolute inset-0 bg-accent/10 blur-[100px] rounded-full pointer-events-none -z-10" />
          <motion.img 
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            src={aboutGraphic} 
            alt="TradeVault AI Network" 
            className="w-full h-[400px] object-cover rounded-3xl shadow-floating border border-border"
          />
        </Reveal>
      </section>

      {/* Mission Section */}
      <section className="w-full glass-float border-y border-border py-24 bg-surface-1/40">
        <Reveal className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-primary mb-8 tracking-tight">Our Mission</h2>
          <div className="space-y-6 text-lg text-secondary leading-relaxed font-medium">
            <p>
              TradeVault was built by traders, for traders. We grew tired of fragmented spreadsheets, complex Excel macros, and emotional trading days that wiped out weeks of progress because of a single lapse in discipline.
            </p>
            <p>
              Our mission is to provide an all-in-one ecosystem that mathematically proves your edge and uses Artificial Intelligence to enforce discipline when human emotion fails.
            </p>
            <p>
              Whether you are trading equities, forex, crypto, or futures, TradeVault is designed to be your unwavering companion in the markets, objectively analyzing your performance without bias.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Core Values */}
      <section className="w-full max-w-7xl mx-auto px-6 py-32">
        <Reveal>
          <h2 className="font-display text-4xl font-bold text-center text-primary mb-16 tracking-tight">Core Philosophy</h2>
        </Reveal>
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerChildren={0.1}>
          <StaggerItem>
            <HoverLift className="card-raised p-10 h-full flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/5 to-transparent rounded-bl-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:bg-accent/20 transition-colors">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4 tracking-tight">Objectivity</h3>
              <p className="text-secondary leading-relaxed font-medium">
                Numbers don't lie. We strip away the emotion from trading by presenting you with cold, hard facts about your performance, win rates, and drawdowns.
              </p>
            </HoverLift>
          </StaggerItem>

          <StaggerItem>
            <HoverLift className="card-raised p-10 h-full flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/5 to-transparent rounded-bl-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-6 border border-success/20 group-hover:bg-success/20 transition-colors">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4 tracking-tight">Continuous Evolution</h3>
              <p className="text-secondary leading-relaxed font-medium">
                The markets are always changing, and so must we. Our AI coach analyzes recent market regimes to ensure your edge hasn't decayed over time.
              </p>
            </HoverLift>
          </StaggerItem>

          <StaggerItem>
            <HoverLift className="card-raised p-10 h-full flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-iris/5 to-transparent rounded-bl-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-iris/10 flex items-center justify-center mb-6 border border-iris/20 group-hover:bg-iris/20 transition-colors">
                <Users className="w-6 h-6 text-iris" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4 tracking-tight">Traders First</h3>
              <p className="text-secondary leading-relaxed font-medium">
                We don't sell your data and we don't take the other side of your trades. We build tools that serve your best interests and protect your capital.
              </p>
            </HoverLift>
          </StaggerItem>
        </StaggerContainer>
      </section>
    </div>
  );
}
