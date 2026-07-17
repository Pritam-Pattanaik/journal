import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  Target,
  BarChart2,
  Brain,
  BookOpen,
  Activity,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MagneticButton } from '../../components/ui/MagneticButton';

const features = [
  {
    icon: Target,
    title: 'Precision Analytics',
    description: 'Track every metric. Find your edge with hyper-detailed performance reports and discipline heatmaps.',
  },
  {
    icon: Brain,
    title: 'AI Coach',
    description: 'Get real-time insights and automated trade reviews to build unbreakable trading discipline.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Set daily limits and let TradeVault protect your capital from revenge trading spirals.',
  },
  {
    icon: BarChart2,
    title: 'Automated Sync',
    description: 'Connect directly to your broker. We pull your trades automatically so you never miss a beat.',
  },
  {
    icon: BookOpen,
    title: 'Deep Journaling',
    description: 'Tag setups, track emotions, and write detailed notes with screenshot attachments.',
  },
  {
    icon: Activity,
    title: 'Strategy Analytics',
    description: 'Analyze performance per strategy. Know exactly which setups give you the most edge.',
  },
];

const stats = [
  { value: '$2B+', label: 'Volume Tracked' },
  { value: '150k+', label: 'Trades Logged' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'User Rating' },
];

export default function Home() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  // Mouse Parallax
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sophisticated 3D Scroll Transforms
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
  const yPreview = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-canvas text-primary selection:bg-black/20 dark:selection:bg-white/20 perspective-1000 overflow-x-hidden">
      
      {/* Top Nav */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-canvas/60 border-b border-black/5 dark:border-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 shrink-0 shadow-sm">
            <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight text-lg text-primary">TradeVault</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-bold text-secondary hover:text-primary transition-colors">
            Log in
          </Link>
          <MagneticButton onClick={() => navigate('/signup')} className="px-5 py-2.5 text-sm rounded-xl font-bold" magneticPull={0.2}>
            Sign up
          </MagneticButton>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        style={{ y: yHero, opacity: opacityHero }}
        className="relative w-full pt-52 pb-32 flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Dynamic Mesh Gradients */}
        <motion.div 
          animate={{ x: mousePosition.x * -2, y: mousePosition.y * -2 }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen dark:opacity-40 opacity-70" 
        />
        <motion.div 
          animate={{ x: mousePosition.x * 3, y: mousePosition.y * 3 }}
          transition={{ type: "spring", stiffness: 40, damping: 20 }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen dark:opacity-40 opacity-60" 
        />
        
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs font-bold text-primary mb-8 backdrop-blur-md hover:scale-105 transition-transform cursor-pointer"
        >
          <span className="flex h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
          TradeVault V5 is now live <ChevronRight size={14} className="opacity-50" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-[8rem] font-bold tracking-tighter text-primary leading-[0.9] mb-8 max-w-5xl mx-auto text-center"
        >
          Master your <br />
          <span className="text-gradient">psychology.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-12 text-center leading-relaxed font-medium"
        >
          The workspace for serious traders. High-performance journaling, automated sync, and AI behavioral analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 z-10"
        >
          <MagneticButton
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
          >
            Start Building Discipline <ArrowRight size={16} />
          </MagneticButton>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-primary font-bold text-base transition-colors focus-ring hover:bg-black/5 dark:hover:bg-white/5"
          >
            View Documentation
          </button>
        </motion.div>
      </motion.section>

      {/* 3D Dashboard Preview */}
      <motion.section 
        initial={{ opacity: 0, y: 100, rotateX: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, scale, y: yPreview }}
        className="w-full max-w-[1200px] mx-auto px-6 relative z-20 mb-40 origin-bottom"
      >
        <motion.div 
          animate={{ x: mousePosition.x * 1.5, y: mousePosition.y * 1.5 }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
          className="w-full aspect-[16/10] md:aspect-[16/9] rounded-[2rem] glass-island overflow-hidden relative flex items-center justify-center p-2 transform-gpu shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
        >
           {/* Abstract Inner App */}
           <div className="w-full h-full bg-surface-0 rounded-[1.5rem] overflow-hidden relative border border-black/5 dark:border-white/5 flex flex-col">
              
              {/* Fake App Header */}
              <div className="h-14 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 bg-surface-1 shrink-0 relative z-10">
                 <div className="flex items-center gap-6">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                     <div className="w-3 h-3 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                     <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                   </div>
                   <div className="hidden md:flex gap-4">
                     <div className="h-4 w-16 bg-black/5 dark:bg-white/5 rounded-full" />
                     <div className="h-4 w-20 bg-black/5 dark:bg-white/5 rounded-full" />
                     <div className="h-4 w-12 bg-black/10 dark:bg-white/10 rounded-full" />
                   </div>
                 </div>
                 <div className="flex gap-3 items-center">
                   <div className="h-6 w-32 bg-black/5 dark:bg-white/5 rounded-full hidden sm:block" />
                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-indigo-400 p-[1px]">
                     <div className="w-full h-full bg-surface-0 rounded-full" />
                   </div>
                 </div>
              </div>

              {/* Fake App Body */}
              <div className="flex-1 flex bg-canvas relative overflow-hidden">
                
                {/* Background Ambient Glow inside the mock app */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-success/10 rounded-full blur-[80px]" />

                {/* Sidebar */}
                <div className="w-16 md:w-56 h-full border-r border-black/5 dark:border-white/5 bg-surface-0/50 backdrop-blur-md shrink-0 flex flex-col gap-2 p-3 z-10">
                  <div className="h-8 w-full bg-black/5 dark:bg-white/5 rounded-lg mb-4 hidden md:block" />
                  <div className="h-10 w-full bg-black/10 dark:bg-white/10 rounded-lg" />
                  <div className="h-10 w-full bg-black/5 dark:bg-white/5 rounded-lg" />
                  <div className="h-10 w-full bg-black/5 dark:bg-white/5 rounded-lg" />
                  <div className="h-10 w-full bg-black/5 dark:bg-white/5 rounded-lg" />
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 flex flex-col gap-4 md:gap-6 z-10 overflow-hidden">
                  
                  {/* Top Stats Row */}
                  <div className="flex gap-4 md:gap-6 h-24 md:h-32 shrink-0">
                    <div className="flex-1 bg-surface-0 border border-black/5 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="h-3 w-16 bg-black/10 dark:bg-white/10 rounded-full" />
                      <div>
                        <div className="h-8 w-32 bg-primary rounded-md mb-2 opacity-80" />
                        <div className="h-3 w-20 bg-success/40 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 bg-surface-0 border border-black/5 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col justify-between">
                      <div className="h-3 w-20 bg-black/10 dark:bg-white/10 rounded-full" />
                      <div>
                        <div className="h-8 w-24 bg-primary rounded-md mb-2 opacity-80" />
                        <div className="h-3 w-24 bg-danger/40 rounded-full" />
                      </div>
                    </div>
                    <div className="hidden md:flex flex-1 bg-surface-0 border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-sm flex-col justify-between">
                      <div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded-full" />
                      <div>
                        <div className="h-8 w-28 bg-primary rounded-md mb-2 opacity-80" />
                        <div className="h-3 w-16 bg-warning/40 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Main Chart Area */}
                  <div className="flex-1 bg-surface-0 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm relative overflow-hidden p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-8 shrink-0">
                      <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded-full" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-black/5 dark:bg-white/5 rounded-md" />
                        <div className="h-6 w-16 bg-black/5 dark:bg-white/5 rounded-md" />
                      </div>
                    </div>
                    {/* Mock Line Chart */}
                    <div className="flex-1 w-full relative">
                       {/* Grid lines */}
                       <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                         <div className="w-full h-px bg-primary" />
                         <div className="w-full h-px bg-primary" />
                         <div className="w-full h-px bg-primary" />
                         <div className="w-full h-px bg-primary" />
                         <div className="w-full h-px bg-primary" />
                       </div>
                       {/* Wavy Chart Path SVG mock */}
                       <svg className="absolute inset-0 w-full h-full text-accent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                         <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20 L100,100 L0,100 Z" fill="url(#grad)" opacity="0.1" />
                         <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                         <defs>
                           <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="currentColor" />
                             <stop offset="100%" stopColor="transparent" />
                           </linearGradient>
                         </defs>
                       </svg>
                       {/* Cursor line & point mock */}
                       <div className="absolute left-[60%] top-0 bottom-0 w-px bg-black/10 dark:bg-white/10 flex flex-col justify-center items-center">
                         <div className="w-3 h-3 rounded-full bg-canvas border-2 border-accent shadow-[0_0_10px_rgba(99,102,241,1)] absolute -mt-[10%]" />
                       </div>
                    </div>
                  </div>

                </div>
              </div>
           </div>
        </motion.div>
      </motion.section>

      {/* Stats */}
      <section className="w-full border-y border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-black/5 dark:divide-white/5">
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary tracking-tighter mb-2">{stat.value}</div>
                <div className="text-xs font-bold text-tertiary uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid with 3D Hover */}
      <section className="w-full max-w-7xl mx-auto px-6 py-40">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-primary mb-6 leading-[1.1]"
          >
            Everything you need to <br className="hidden md:block" />
            <span className="text-tertiary">scale your edge.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, rotateY: 5, rotateX: 5, z: 20 }}
              className="group relative flex flex-col p-8 rounded-3xl glass-panel overflow-hidden transition-all duration-300 transform-gpu cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mb-8 relative z-10 transition-transform group-hover:scale-110">
                <feat.icon size={20} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 tracking-tight relative z-10">{feat.title}</h3>
              <p className="text-secondary font-medium leading-relaxed relative z-10">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen opacity-50" />
        
        <div className="max-w-4xl mx-auto px-6 py-40 md:py-52 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-6xl md:text-[5rem] font-bold tracking-tighter text-primary mb-10 leading-[0.9]"
          >
            Ready to trade <br /> like a professional?
          </motion.h2>
          <MagneticButton
            onClick={() => navigate('/signup')}
            className="mx-auto px-10 py-5 rounded-2xl text-lg font-bold shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
          >
            Create Your Workspace <ArrowRight size={18} />
          </MagneticButton>
        </div>
      </section>
    </main>
  );
}
