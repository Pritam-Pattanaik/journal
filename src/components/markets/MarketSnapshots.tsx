import React from 'react';
import { Camera, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketSnapshots() {
  const snapshots = [
    { time: '09:30 AM', title: 'Opening Bell Spikes', type: 'volatility' },
    { time: '11:00 AM', title: 'Tech Sector Rotation', type: 'flow' },
    { time: '02:00 PM', title: 'Fed Minutes Reaction', type: 'event' },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-iris" />
          <h3 className="font-semibold text-primary">Market Snapshots</h3>
        </div>
        <button className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {snapshots.map((snap, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-lg border border-border/40 bg-surface-1 hover:border-iris/30 transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider block mb-1">
                {snap.time}
              </span>
              <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                {snap.title}
              </span>
            </div>
            <div className="w-6 h-6 rounded bg-surface-2 flex items-center justify-center text-tertiary group-hover:text-iris group-hover:bg-iris/10 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
