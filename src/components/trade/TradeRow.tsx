import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import DisciplineRater from '../ui/DisciplineRater';
import Badge from '../ui/Badge';

interface TradeRowProps {
  trade: Trade;
  onClick: () => void;
}

export default function TradeRow({ trade, onClick }: TradeRowProps) {
  const isProfit = trade.netPnl >= 0;

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[100px_1fr_70px_90px_80px_80px_90px_56px_24px] items-center h-[48px] px-4 cursor-pointer hover:bg-surface-hover border-b border-tv-border transition-colors text-tv-base"
    >
      {/* Date */}
      <span className="font-mono text-tv-xs text-secondary whitespace-nowrap">
        {formatDate(trade.date)}
      </span>

      {/* Symbol + optional Carry-Forward badge */}
      <span className="flex items-center gap-1.5 min-w-0 pr-2">
        <span className="font-medium text-primary truncate">{trade.symbol}</span>
        {trade.isCarryForward && (
          <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold tracking-wide text-amber-400 bg-amber-400/10 border border-amber-400/25 px-1.5 py-[2px] rounded whitespace-nowrap">
            ↩ CF · {formatDate(trade.date)}
          </span>
        )}
      </span>

      {/* Market */}
      <span className="flex">
        <Badge variant="accent">{trade.market}</Badge>
      </span>

      {/* Strategy */}
      <span className="text-tv-sm text-secondary truncate pr-2">
        {trade.strategyName || '-'}
      </span>

      {/* Entry Price */}
      <span className="font-mono text-tv-xs text-secondary">
        {trade.entryPrice.toFixed(2)}
      </span>

      {/* Exit Price */}
      <span className="font-mono text-tv-xs text-secondary">
        {trade.exitPrice.toFixed(2)}
      </span>

      {/* P&L */}
      <span
        className={`font-mono font-semibold whitespace-nowrap ${
          isProfit ? 'text-profit' : 'text-loss'
        }`}
      >
        {isProfit ? '+' : ''}
        {formatCurrency(trade.netPnl)}
      </span>

      {/* Discipline */}
      <span className="flex">
        {trade.disciplineScore != null ? (
          <DisciplineRater value={trade.disciplineScore} />
        ) : (
          <span className="text-muted text-tv-xs">-</span>
        )}
      </span>

      {/* Detail Arrow */}
      <span className="flex justify-end text-muted">
        <ChevronRight className="h-[14px] w-[14px]" />
      </span>
    </div>
  );
}
