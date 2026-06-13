import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Target, BarChart2, Brain, Activity, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';
import heroGraphic from '../../assets/images/hero-graphic.png';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left z-10 animate-slide-up opacity-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-tv-xs text-accent-light font-bold uppercase tracking-widest mb-6">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
            TradeVault 2.0 is Live
          </div>
          <h1 className="text-[50px] md:text-[72px] font-bold leading-[1.1] mb-6 tracking-tight text-primary drop-shadow-lg">
            Master Your <span className="text-gradient-accent">Trades.</span>
          </h1>
          <p className="text-tv-xl text-secondary mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            The ultimate all-in-one trading journal, AI coach, and performance analytics platform. Turn raw market data into unbreakable discipline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to="/signup"
              className="group px-8 py-4 bg-accent text-white font-semibold rounded-tv-xl hover:bg-accent/90 transition-all shadow-glow-profit text-tv-lg w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 glass-panel text-primary font-semibold rounded-tv-xl hover:bg-white/10 transition-all text-tv-lg w-full sm:w-auto text-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
        
        {/* Hero Graphic */}
        <div className="flex-1 w-full max-w-2xl lg:max-w-none relative animate-slide-up delay-200 opacity-0">
          <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>
          <img 
            src={heroGraphic} 
            alt="Trading Analytics Dashboard Graphic" 
            className="w-full h-auto rounded-3xl shadow-glow-profit object-cover border border-white/10 transform hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      </section>

      {/* Stats Banner */}
      <section className="w-full border-y border-white/10 glass-panel py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
          <div className="animate-slide-up opacity-0 delay-100">
            <div className="text-4xl font-bold text-primary mb-2">$2B+</div>
            <div className="text-secondary text-tv-sm uppercase tracking-wider">Volume Tracked</div>
          </div>
          <div className="animate-slide-up opacity-0 delay-200">
            <div className="text-4xl font-bold text-primary mb-2">150k+</div>
            <div className="text-secondary text-tv-sm uppercase tracking-wider">Trades Logged</div>
          </div>
          <div className="animate-slide-up opacity-0 delay-300">
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-secondary text-tv-sm uppercase tracking-wider">Uptime</div>
          </div>
          <div className="animate-slide-up opacity-0 delay-400">
            <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-secondary text-tv-sm uppercase tracking-wider">User Rating</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20 animate-slide-up opacity-0">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">Everything you need for <span className="text-gradient-accent">consistency</span></h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto">Stop guessing. Start measuring. TradeVault gives you the tools institutional traders use to maintain an edge.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Target, color: 'text-accent', title: 'Precision Analytics', desc: 'Track every metric. Find your edge with hyper-detailed performance reports and heatmaps.' },
            { icon: Brain, color: 'text-profit', title: 'AI Coach', desc: 'Get real-time insights and automated trade reviews to build unbreakable discipline.' },
            { icon: Shield, color: 'text-gold', title: 'Risk Management', desc: 'Set daily limits and let TradeVault protect your capital from revenge trading.' },
            { icon: BarChart2, color: 'text-loss', title: 'Automated Sync', desc: 'Connect directly to your broker. We pull your trades automatically so you never miss a beat.' },
            { icon: BookOpen, color: 'text-blue-400', title: 'Deep Journaling', desc: 'Tag setups, track emotions, and write detailed notes with screenshot attachments.' },
            { icon: Activity, color: 'text-purple-400', title: 'Strategy Backtesting', desc: 'Simulate your strategies against historical data before risking real capital.' },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className={`glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors animate-slide-up opacity-0 delay-${(idx % 3 + 1) * 100}`}>
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{feature.title}</h3>
                <p className="text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-32 animate-slide-up opacity-0 delay-200">
        <div className="glass-panel rounded-3xl p-12 text-center relative overflow-hidden border-accent/30 shadow-glow-profit">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none"></div>
          <h2 className="text-4xl font-bold text-primary mb-6 relative z-10">Ready to transform your trading?</h2>
          <p className="text-xl text-secondary mb-10 max-w-2xl mx-auto relative z-10">Join thousands of profitable traders who use TradeVault to manage their risk and multiply their edge.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-transform hover:scale-105 relative z-10 text-lg"
          >
            Create Your Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
          <ul className="flex flex-col sm:flex-row justify-center gap-6 mt-8 text-sm text-secondary relative z-10">
            <li className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-profit" /> No credit card required</li>
            <li className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-profit" /> 14-day Pro trial included</li>
            <li className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-profit" /> Cancel anytime</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
