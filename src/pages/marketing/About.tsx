import React from 'react';
import { Target, Users, Zap } from 'lucide-react';
import aboutGraphic from '../../assets/images/about-graphic.png';

export default function About() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="animate-slide-up opacity-0">
          <h1 className="text-[50px] md:text-[80px] font-bold mb-6 text-primary drop-shadow-lg tracking-tight leading-tight">
            Built for <span className="text-gradient-accent">Traders</span>.<br/>Powered by AI.
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed mb-16">
            We believe that successful trading isn't just about strategy—it's about discipline, risk management, and continuous mathematical analysis of your edge.
          </p>
        </div>
        
        {/* About Graphic */}
        <div className="w-full max-w-5xl relative animate-slide-up delay-200 opacity-0 mb-32">
          <div className="absolute inset-0 bg-accent/10 blur-[100px] rounded-full pointer-events-none"></div>
          <img 
            src={aboutGraphic} 
            alt="TradeVault AI Network" 
            className="w-full h-[400px] object-cover rounded-3xl shadow-glow-profit border border-white/10"
          />
        </div>
      </section>

      {/* Mission Section */}
      <section className="w-full glass-panel border-y border-white/10 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center animate-slide-up opacity-0">
          <h2 className="text-4xl font-bold text-primary mb-8">Our Mission</h2>
          <div className="space-y-6 text-lg text-secondary leading-relaxed">
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
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <h2 className="text-4xl font-bold text-center text-primary mb-16 animate-slide-up opacity-0">Core Philosophy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-10 rounded-2xl animate-slide-up opacity-0 delay-100">
            <Target className="w-10 h-10 text-accent mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-4">Objectivity</h3>
            <p className="text-secondary leading-relaxed">
              Numbers don't lie. We strip away the emotion from trading by presenting you with cold, hard facts about your performance, win rates, and drawdowns.
            </p>
          </div>
          <div className="glass-panel p-10 rounded-2xl animate-slide-up opacity-0 delay-200">
            <Zap className="w-10 h-10 text-success mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-4">Continuous Evolution</h3>
            <p className="text-secondary leading-relaxed">
              The markets are always changing, and so must we. Our AI coach analyzes recent market regimes to ensure your edge hasn't decayed over time.
            </p>
          </div>
          <div className="glass-panel p-10 rounded-2xl animate-slide-up opacity-0 delay-300">
            <Users className="w-10 h-10 text-purple-400 mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-4">Traders First</h3>
            <p className="text-secondary leading-relaxed">
              We don't sell your data and we don't take the other side of your trades. We build tools that serve your best interests and protect your capital.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
