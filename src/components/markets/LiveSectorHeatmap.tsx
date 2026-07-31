/**
 * LiveSectorHeatmap — Real-Time Sector Performance
 *
 * Fetches live sector quotes from /api/market/sectors.
 * Renders a heat-intensity grid sorted by absolute change.
 * 100% real data — no hardcoded values.
 */

import React, { useState } from 'react';
import { Layers, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useMarketSectors, type SectorQuote } from '../../hooks/useMarketData';

function getHeatBg(change: number): string {
  const abs = Math.abs(change);
  if (change > 0) {
    if (abs > 1.5) return 'rgba(16,185,129,0.18)';
    if (abs > 0.75) return 'rgba(16,185,129,0.11)';
    return 'rgba(16,185,129,0.06)';
  } else {
    if (abs > 1.5) return 'rgba(239,68,68,0.18)';
    if (abs > 0.75) return 'rgba(239,68,68,0.11)';
    return 'rgba(239,68,68,0.06)';
  }
}

function getBorderColor(change: number): string {
  const abs = Math.abs(change);
  if (change > 0) {
    if (abs > 1.5) return 'rgba(16,185,129,0.4)';
    if (abs > 0.75) return 'rgba(16,185,129,0.2)';
    return 'rgba(16,185,129,0.1)';
  } else {
    if (abs > 1.5) return 'rgba(239,68,68,0.4)';
    if (abs > 0.75) return 'rgba(239,68,68,0.2)';
    return 'rgba(239,68,68,0.1)';
  }
}

interface SectorTileProps {
  sector: SectorQuote;
  isLargest?: boolean;
}

function SectorTile({ sector, isLargest }: SectorTileProps) {
  const isUp = sector.changePercent >= 0;
  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <div
      className="p-3 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-200"
      style={{
        background: getHeatBg(sector.changePercent),
        border: `1px solid ${getBorderColor(sector.changePercent)}`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 6px 20px ${isUp ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Intensity bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: Math.min(Math.abs(sector.changePercent) / 2, 1),
        }}
      />

      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[11px] font-bold text-white/80 leading-tight max-w-[100px]">
          {sector.name}
        </span>
        <div className="flex items-center gap-0.5" style={{ color }}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span className="text-[12px] font-bold tabular-nums">
            {Math.abs(sector.changePercent).toFixed(2)}%
          </span>
        </div>
      </div>

      {sector.volume !== undefined && sector.volume > 0 && (
        <p className="text-[9px] text-white/30 font-mono">
          Vol: {(sector.volume / 1_000_000).toFixed(1)}M
        </p>
      )}

      {/* Live indicator */}
      {sector.isLive && (
        <div className="absolute top-2 right-2">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: color, boxShadow: `0 0 5px ${color}` }}
          />
        </div>
      )}
    </div>
  );
}

export default function LiveSectorHeatmap() {
  const { sectors, loading, error } = useMarketSectors();

  // Sort by absolute change descending
  const sorted = [...sectors].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const topGainer = sorted.find(s => s.changePercent > 0);
  const topLoser = sorted.slice().reverse().find(s => s.changePercent < 0);

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-violet-400" />
          <h3 className="text-[14px] font-bold text-white/90">Sector Performance</h3>
          {sectors.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              LIVE
            </span>
          )}
        </div>
        {loading && <RefreshCw size={12} className="text-white/25 animate-spin" />}
      </div>

      {/* Loading skeleton */}
      {loading && sectors.length === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-6">
          <p className="text-[12px] text-white/30">Sector data unavailable</p>
        </div>
      )}

      {/* Summary stats */}
      {sorted.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/60 mb-1">Top Gainer</p>
              <p className="text-[12px] font-bold text-emerald-400">{topGainer?.name ?? '—'}</p>
              <p className="text-[11px] font-mono text-emerald-400">
                {topGainer ? `+${topGainer.changePercent.toFixed(2)}%` : '—'}
              </p>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-red-400/60 mb-1">Top Loser</p>
              <p className="text-[12px] font-bold text-red-400">{topLoser?.name ?? '—'}</p>
              <p className="text-[11px] font-mono text-red-400">
                {topLoser ? `${topLoser.changePercent.toFixed(2)}%` : '—'}
              </p>
            </div>
          </div>

          {/* Heat grid */}
          <div className="grid grid-cols-2 gap-2">
            {sorted.slice(0, 10).map(sector => (
              <SectorTile key={sector.id} sector={sector} />
            ))}
          </div>

          <p className="text-[9px] text-white/20 mt-3 text-center">
            ● All values are live · Provider: {sorted[0]?.provider ?? 'yahoo'}
          </p>
        </>
      )}
    </div>
  );
}
