import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: LucideIcon;
  colorType: 'pnl' | 'winrate' | 'rr' | 'discipline' | 'default';
  rawValue: number;
}

const configs = {
  pnl: {
    pos: {
      stripe: 'from-success to-success/30',
      icon:   'bg-success/10 text-success',
      value:  'text-success',
    },
    neg: {
      stripe: 'from-danger to-danger/30',
      icon:   'bg-danger/10 text-danger',
      value:  'text-danger',
    },
  },
  winrate:    { stripe: 'from-iris to-iris/30',    icon: 'bg-iris/10 text-iris',       value: 'text-primary' },
  rr:         { stripe: 'from-gold to-gold/30',    icon: 'bg-gold/10 text-gold',       value: 'text-primary' },
  discipline: {
    good: { stripe: 'from-success to-success/30', icon: 'bg-success/10 text-success', value: 'text-primary' },
    mid:  { stripe: 'from-gold to-gold/30',        icon: 'bg-gold/10 text-gold',       value: 'text-primary' },
    bad:  { stripe: 'from-danger to-danger/30',    icon: 'bg-danger/10 text-danger',   value: 'text-primary' },
  },
};

export default React.memo(function StatCard({ label, value, subLabel, icon: Icon, colorType, rawValue }: StatCardProps) {
  const stripe = (() => {
    if (colorType === 'pnl')        return rawValue >= 0 ? configs.pnl.pos.stripe : configs.pnl.neg.stripe;
    if (colorType === 'winrate')    return configs.winrate.stripe;
    if (colorType === 'rr')         return configs.rr.stripe;
    if (colorType === 'discipline') return rawValue >= 4 ? configs.discipline.good.stripe : rawValue >= 3 ? configs.discipline.mid.stripe : configs.discipline.bad.stripe;
    return 'from-accent to-iris/30';
  })();

  const iconClass = (() => {
    if (colorType === 'pnl')        return rawValue >= 0 ? configs.pnl.pos.icon : configs.pnl.neg.icon;
    if (colorType === 'winrate')    return configs.winrate.icon;
    if (colorType === 'rr')         return configs.rr.icon;
    if (colorType === 'discipline') return rawValue >= 4 ? configs.discipline.good.icon : rawValue >= 3 ? configs.discipline.mid.icon : configs.discipline.bad.icon;
    return 'bg-accent/10 text-accent';
  })();

  const valueClass = colorType === 'pnl'
    ? (rawValue >= 0 ? 'text-success' : 'text-danger')
    : 'text-primary';

  const formatNumber = (val: number) => {
    if (colorType === 'pnl')        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    if (colorType === 'winrate')    return `${val.toFixed(1)}%`;
    if (colorType === 'rr')         return `1:${val.toFixed(2)}`;
    if (colorType === 'discipline') return `${val.toFixed(1)}/5`;
    return val.toString();
  };

  const isNumber = typeof rawValue === 'number' && !isNaN(rawValue);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card-raised relative overflow-hidden h-full min-h-[160px] flex flex-col justify-center items-center p-6 cursor-default select-none group border border-border-subtle shadow-xl shadow-black/5 dark:shadow-black/20"
    >
      {/* Top accent stripe */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', stripe)} />

      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(var(--color-iris), 0.04) 0%, transparent 70%)' }} />

      <div className="flex flex-col items-center justify-center text-center w-full z-10 pt-2">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl mb-3 shrink-0 shadow-sm border border-white/5', iconClass)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        
        <div className={cn('font-mono text-4xl tabular-nums font-bold tracking-tight leading-none mb-3', valueClass)}>
          {colorType === 'pnl' && (
            <span className="sr-only">{rawValue >= 0 ? 'Profit: ' : 'Loss: '}</span>
          )}
          {value}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">{label}</p>
        <p className="text-xs text-tertiary mt-1 max-w-[80%] mx-auto">{subLabel}</p>
      </div>
    </motion.div>
  );
});
