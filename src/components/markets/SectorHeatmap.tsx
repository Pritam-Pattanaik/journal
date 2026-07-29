/**
 * SectorHeatmap — Live sector performance from market quotes
 * Real data from useLiveMarketData + supplemental static sector data
 */
import React from 'react';
import { Layers, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useLiveMarketData } from '../../hooks/useLiveMarketData';
import { cn } from '../../lib/cn';

// Sectors we track via live market quotes
const LIVE_SECTORS: { id: string; name: string; displayName: string }[] = [
  { id: 'banknifty',  name: 'BANK NIFTY',    displayName: 'NIFTY BANK'   },
  { id: 'finnifty',   name: 'FIN NIFTY',      displayName: 'NIFTY FIN SVC' },
  { id: 'nifty',      name: 'NIFTY 50',       displayName: 'NIFTY 50'      },
];

// Supplemental static sectors (sectoral indices not in our live feed)
const STATIC_SECTORS = [
  { name: 'NIFTY IT',     change: 1.85, volume: '12.4M' },
  { name: 'NIFTY AUTO',   change: 0.85, volume: '18.1M' },
  { name: 'NIFTY PHARMA', change: -0.45, volume: '9.2M'  },
  { name: 'NIFTY METAL',  change: -1.20, volume: '22.5M' },
  { name: 'NIFTY FMCG',   change: 0.15, volume: '15.8M' },
];

// Get background color based on change intensity
function getHeatBg(change: number): string {
  const abs = Math.abs(change);
  if (change > 0) {
    if (abs > 1.5) return 'rgba(16,185,129,0.15)';
    if (abs > 0.5) return 'rgba(16,185,129,0.09)';
    return 'rgba(16,185,129,0.05)';
  } else {
    if (abs > 1.5) return 'rgba(239,68,68,0.15)';
    if (abs > 0.5) return 'rgba(239,68,68,0.09)';
    return 'rgba(239,68,68,0.05)';
  }
}

function getBorderColor(change: number): string {
  const abs = Math.abs(change);
  if (change > 0) {
    if (abs > 1.5) return 'rgba(16,185,129,0.35)';
    if (abs > 0.5) return 'rgba(16,185,129,0.2)';
    return 'rgba(16,185,129,0.1)';
  } else {
    if (abs > 1.5) return 'rgba(239,68,68,0.35)';
    if (abs > 0.5) return 'rgba(239,68,68,0.2)';
    return 'rgba(239,68,68,0.1)';
  }
}

interface SectorTileProps {
  name: string;
  change: number;
  volume?: string;
  isLive?: boolean;
}

function SectorTile({ name, change, volume, isLive }: SectorTileProps) {
  const isUp = change >= 0;
  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <div
      className="p-3 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-200"
      style={{
        background: getHeatBg(change),
        border: `1px solid ${getBorderColor(change)}`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Heat intensity bar at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: Math.min(Math.abs(change) / 2, 1) }}
      />

      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-white/80">{name}</span>
        <div className="flex items-center gap-0.5" style={{ color }}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span className="text-[12px] font-bold tabular-nums">{Math.abs(change).toFixed(2)}%</span>
        </div>
      </div>

      {volume && (
        <p className="text-[10px] text-white/30 font-mono">Vol: {volume}</p>
      )}

      {isLive && (
        <div className="absolute top-2 right-2">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
        </div>
      )}
    </div>
  );
}

export default function SectorHeatmap() {
  const { data: quotes, loading } = useLiveMarketData();

  // Build live sectors from market quotes
  const liveSectors = quotes.map(q => ({
    name: q.name,
    change: q.pct,
    isLive: true,
  }));

  // Combine live + static, sorted by absolute change
  const allSectors = [
    ...liveSectors,
    ...STATIC_SECTORS.map(s => ({ ...s, isLive: false })),
  ].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const topGainer = allSectors.reduce((best, s) => s.change > best.change ? s : best, allSectors[0] || { change: 0, name: '—' });
  const topLoser  = allSectors.reduce((worst, s) => s.change < worst.change ? s : worst, allSectors[0] || { change: 0, name: '—' });

  return (
    <div
      className="flex flex-col"
      style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-violet-400" />
          <h3 className="text-[14px] font-bold text-white/90">Sector Performance</h3>
        </div>
        {loading && <RefreshCw size={12} className="text-white/25 animate-spin" />}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/60 mb-1">Top Gainer</p>
          <p className="text-[12px] font-bold text-emerald-400">{topGainer.name}</p>
          <p className="text-[11px] font-mono text-emerald-400">+{Math.abs(topGainer.change).toFixed(2)}%</p>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-red-400/60 mb-1">Top Loser</p>
          <p className="text-[12px] font-bold text-red-400">{topLoser.name}</p>
          <p className="text-[11px] font-mono text-red-400">{topLoser.change.toFixed(2)}%</p>
        </div>
      </div>

      {/* Heat grid */}
      <div className="grid grid-cols-2 gap-2">
        {allSectors.slice(0, 8).map(sector => (
          <SectorTile key={sector.name} {...sector} />
        ))}
      </div>

      {/* Data note */}
      <p className="text-[9px] text-white/20 mt-3 text-center">
        ● Live indices · ○ Indicative sector data
      </p>
    </div>
  );
}
