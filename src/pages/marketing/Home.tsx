import React from 'react';
import {  useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield, Target, BarChart2, Brain, BookOpen, Activity,
  ArrowRight, ChevronRight, TrendingUp, Zap, LayoutDashboard,
} from 'lucide-react';
import { MagneticButton } from '../../components/ui/MagneticButton';
import { Reveal, StaggerContainer, StaggerItem } from '../../components/ui/Motion';
import HowItWorksSection from '../../components/marketing/HowItWorksSection';
import TestimonialsSection from '../../components/marketing/TestimonialsSection';
import InlinePricingSection from '../../components/marketing/InlinePricingSection';

const features = [
  { icon: Brain,     title: 'AI Behavioral Coach',    description: 'It reads every trade you take and calls out the exact emotional pattern costing you money.' },
  { icon: Target,    title: 'Precision analytics',    description: 'Every metric that matters, one keystroke away.' },
  { icon: Shield,    title: 'Risk guardrails',        description: 'Daily loss caps that stop revenge trades before they start.' },
  { icon: BarChart2, title: 'Automated sync',         description: 'Trades pulled directly from your broker. Zero copy-paste.' },
  { icon: BookOpen,  title: 'Deep journaling',        description: 'Tag setups, log emotion, attach screenshots.' },
  { icon: Activity,  title: 'Strategy edge',          description: 'Know which setups pay you and which quietly drain you.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const h = (e: MouseEvent) => setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 24,
      y: (e.clientY / window.innerHeight - 0.5) * 24,
    });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const yHero    = useTransform(scrollYProgress, [0, 1], [0, 280]);
  const opHero   = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const rotateX  = useTransform(scrollYProgress, [0, 0.2], [14, 0]);
  const scaleP   = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
  const yPreview = useTransform(scrollYProgress, [0, 0.2], [80, 0]);

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-canvas text-primary overflow-x-hidden">

      {/* ── Hero ── */}
      <motion.section
        style={{ y: yHero, opacity: opHero }}
        className="relative w-full pt-52 pb-36 flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Mesh gradient blobs */}
        <motion.div
          animate={{ x: mouse.x * -2, y: mouse.y * -2 }}
          transition={{ type: 'spring', stiffness: 60, damping: 25 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[100vw] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10"
          style={{ background: 'radial-gradient(ellipse, rgba(var(--color-accent), 0.18) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: mouse.x * 3, y: mouse.y * 3 }}
          transition={{ type: 'spring', stiffness: 50, damping: 25 }}
          className="absolute top-1/3 right-1/4 w-[600px] max-w-[100vw] h-[400px] rounded-full blur-[120px] pointer-events-none -z-10"
          style={{ background: 'radial-gradient(ellipse, rgba(var(--color-iris), 0.12) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: mouse.x * 2, y: mouse.y * -2 }}
          transition={{ type: 'spring', stiffness: 40, damping: 20 }}
          className="absolute bottom-1/4 left-1/4 w-[400px] max-w-[100vw] h-[300px] rounded-full blur-[100px] pointer-events-none -z-10"
          style={{ background: 'radial-gradient(ellipse, rgba(var(--color-gold), 0.08) 0%, transparent 70%)' }}
        />

        {/* "V2" badge */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 border border-border bg-surface/80 backdrop-blur-md text-xs font-bold text-primary hover:scale-105 transition-transform cursor-pointer shadow-xs"
        >
          <span className="flex h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--color-accent),0.8)]" />
          <Zap size={12} className="text-gold" />
          TradeVault V2 — Now with AI Coaching
          <ChevronRight size={12} className="text-tertiary" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
          transition={{ duration: 1.0, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tighter text-primary leading-[1] mb-8 max-w-5xl mx-auto text-center"
        >
          Trade with an<br />
          <span className="text-gradient font-serif italic font-normal tracking-normal pr-4">unfair edge.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-12 text-center leading-relaxed font-medium"
        >
          The workspace for serious traders. Automated broker sync, hyper-detailed journaling, 
          and an AI coach that finds the leaks in your discipline.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2"
          >
            Start Building Discipline <ArrowRight size={16} />
          </MagneticButton>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-border bg-surface/60 text-primary font-bold text-[15px] hover:bg-surface hover:border-border-hover transition-all backdrop-blur-md flex justify-center"
          >
            See How it Works
          </a>
        </motion.div>
      </motion.section>

      {/* ── 3D Dashboard Preview ── */}
      <motion.section
        initial={{ opacity: 0, y: 100, rotateX: 12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, scale: scaleP, y: yPreview }}
        className="w-full max-w-[1200px] mx-auto px-6 relative z-20 mb-20 origin-bottom"
      >
        <motion.div
          animate={{ 
            x: mouse.x * 1.2, 
            y: [mouse.y * 1.2 - 10, mouse.y * 1.2 + 10, mouse.y * 1.2 - 10]
          }}
          transition={{ 
            x: { type: 'spring', stiffness: 90, damping: 30 },
            y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
          }}
          className="w-full aspect-[16/9] rounded-[2rem] glass-island overflow-hidden relative p-2 shadow-[0_32px_80px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          {/* Mock App Interior */}
          <div className="w-full h-full bg-canvas rounded-[1.5rem] overflow-hidden flex flex-col border border-border/50">
            {/* Mock Header */}
            <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-surface/60 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-iris flex items-center justify-center">
                  <TrendingUp size={10} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex gap-3 ml-3">
                  {['Dashboard','Trades','Journal'].map(n => (
                    <div key={n} className="h-3 rounded-full bg-border shimmer" style={{ width: n.length * 7 }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-28 rounded-lg bg-surface-1 border border-border shimmer" />
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iris to-accent" />
              </div>
            </div>

            {/* Mock Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-14 border-r border-border bg-surface/40 flex flex-col items-center gap-2 pt-4 shrink-0">
                {[LayoutDashboard,BarChart2,BookOpen,Brain,Target,Shield].map((Icon, i) => (
                  <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-iris/15 text-iris' : 'text-tertiary'}`}>
                    <Icon size={15} strokeWidth={1.8} />
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
                {/* Row 1: Stat row */}
                <div className="grid grid-cols-4 gap-3 shrink-0">
                  {[
                    { label: 'Net P&L', val: '+₹84,250', color: 'text-success', stripe: 'from-success' },
                    { label: 'Win Rate', val: '67.4%',    color: 'text-iris',    stripe: 'from-iris' },
                    { label: 'Avg R:R',  val: '1:2.1',    color: 'text-gold',    stripe: 'from-gold' },
                    { label: 'Discipline',val: '4.2/5',   color: 'text-success', stripe: 'from-success' },
                  ].map((s, i) => (
                    <div key={i} className="card-raised p-3 relative overflow-hidden">
                      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${s.stripe} to-transparent`} />
                      <p className="text-[8px] font-bold uppercase tracking-widest text-tertiary mb-1">{s.label}</p>
                      <p className={`text-xs font-bold font-mono tabular-nums ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Row 2: Equity Curve */}
                <div className="card p-4 flex flex-col shrink-0 h-32 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2 z-10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-secondary">Equity Curve</p>
                    <div className="h-4 w-16 bg-iris/10 border border-iris/20 rounded-md shimmer" />
                  </div>
                  <div className="absolute inset-0 pt-8">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 80">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,70 Q20,60 40,55 T80,35 T120,38 T160,18 T200,10 L200,80 L0,80 Z" fill="url(#chartGrad)" />
                      <path d="M0,70 Q20,60 40,55 T80,35 T120,38 T160,18 T200,10" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Row 3: Strategy & Heatmap */}
                <div className="flex-1 flex gap-4 min-h-0">
                  {/* Strategy Bars */}
                  <div className="w-1/3 card p-4 flex flex-col gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-secondary">Strategy Performance</p>
                    <div className="flex-1 flex flex-col justify-around">
                      {[
                        { w: '85%', color: 'bg-success' },
                        { w: '60%', color: 'bg-iris' },
                        { w: '40%', color: 'bg-gold' },
                      ].map((bar, i) => (
                        <div key={i} className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color}`} style={{ width: bar.w }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Trading Heatmap */}
                  <div className="flex-1 card p-4 flex flex-col">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-secondary mb-3">Trading Heatmap · 90d</p>
                    <div className="flex-1 grid grid-cols-12 grid-rows-4 gap-1">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const isWin = Math.random() > 0.4;
                        const opacity = Math.random() > 0.3 ? (Math.random() * 0.8 + 0.2) : 0.1;
                        return (
                          <div 
                            key={i} 
                            className={`rounded-[2px] ${isWin ? 'bg-success' : 'bg-danger'}`}
                            style={{ opacity }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── How It Works ── */}
      <HowItWorksSection />

      {/* ── Features Grid ── */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-32">
        <Reveal className="text-center mb-20 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-iris mb-4">Built for the serious trader</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-primary leading-[1.05] mb-5">
            Stop trading in the dark.
          </h2>
          <p className="text-secondary text-lg leading-relaxed">
            Build real, repeatable edge with a workspace designed around discipline — not dopamine.
          </p>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" staggerChildren={0.07}>
          {features.map((feat, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="card-raised group relative flex flex-col p-8 cursor-default overflow-hidden h-full"
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-iris/5 to-transparent rounded-bl-3xl" />

                <div className="w-11 h-11 rounded-2xl bg-iris/10 border border-iris/15 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-iris/15">
                  <feat.icon size={20} className="text-iris" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg font-bold text-primary mb-3 tracking-tight">{feat.title}</h3>
                <p className="text-secondary text-sm leading-relaxed font-medium">{feat.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Pricing ── */}
      <InlinePricingSection />

      {/* ── Final CTA ── */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[100vw] h-[350px] rounded-full blur-[180px]"
            style={{ background: 'radial-gradient(ellipse, rgba(var(--color-iris), 0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-44 text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-gold mb-6">Free forever · Upgrade any time</p>
            <h2 className="font-display text-6xl md:text-[5.5rem] font-bold tracking-tighter text-primary mb-12 leading-[0.95]">
              Ready to trade<br />like a professional?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <MagneticButton
              onClick={() => navigate('/signup')}
              className="mx-auto px-12 py-5 rounded-2xl text-lg font-bold flex items-center justify-center gap-3"
            >
              Start Building Edge <ArrowRight size={18} />
            </MagneticButton>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
