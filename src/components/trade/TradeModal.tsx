import React from 'react';
import { Trade } from '../../types';
import { formatCurrencyFull, formatDateFull } from '../../lib/analytics';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import DisciplineRater from '../ui/DisciplineRater';

interface TradeModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

export default function TradeModal({ trade, isOpen, onClose, onEdit, onDelete }: TradeModalProps) {
  if (!trade) return null;

  const isProfit = trade.netPnl >= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${trade.symbol} Execution Details`}
    >
      <div className="space-y-5">
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-tv-border pb-3">
          <div className="flex flex-col">
            <span className="text-tv-lg font-bold text-primary tracking-wide">
              {trade.symbol}
            </span>
            <span className="text-tv-xs text-secondary font-mono mt-0.5">
              {formatDateFull(trade.date)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent">{trade.market}</Badge>
            <Badge variant={trade.status === 'WIN' ? 'win' : trade.status === 'LOSS' ? 'loss' : 'breakeven'}>
              {trade.status}
            </Badge>
          </div>
        </div>

        {/* P&L Large Banner */}
        <div className="bg-base/40 border border-tv-border rounded-tv-lg p-4 text-center">
          <div className={`text-tv-2xl font-mono font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
            {isProfit ? '+' : ''}
            {formatCurrencyFull(trade.netPnl)}
          </div>
          <div className="text-tv-xs text-secondary mt-1 font-mono">
            {trade.entryPrice.toFixed(2)} → {trade.exitPrice.toFixed(2)} × {trade.quantity} ({trade.direction})
          </div>
        </div>

        {/* Details Grid (2 columns) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-tv-border pb-4">
          <div>
            <span className="label-section block mb-0.5">Strategy</span>
            <span className="text-tv-sm text-primary font-medium truncate block">
              {trade.strategyName || 'Untagged'}
            </span>
          </div>

          <div>
            <span className="label-section block mb-0.5">Direction</span>
            <span className={`text-tv-sm font-semibold ${trade.direction === 'LONG' ? 'text-profit' : 'text-loss'}`}>
              {trade.direction}
            </span>
          </div>

          <div>
            <span className="label-section block mb-0.5">Instrument Type</span>
            <span className="text-tv-sm text-primary font-mono font-medium block">
              {trade.instrumentType}
            </span>
          </div>

          <div>
            <span className="label-section block mb-0.5">Discipline Score</span>
            <div className="mt-1">
              {trade.disciplineScore != null ? (
                <DisciplineRater value={trade.disciplineScore} />
              ) : (
                <span className="text-muted text-tv-xs">Not rated</span>
              )}
            </div>
          </div>
        </div>

        {/* Annotations Section */}
        <div className="space-y-4">
          <div>
            <span className="label-section block text-accent-light mb-1">Setup</span>
            <div className={`bg-base/20 border border-tv-border rounded-tv-sm p-3 text-tv-sm leading-relaxed whitespace-pre-wrap ${trade.setupDescription ? 'text-primary' : 'text-muted italic'}`}>
              {trade.setupDescription || 'No setup description provided.'}
            </div>
          </div>

          <div>
            <span className="label-section block text-secondary mb-1">Mindset</span>
            <div className={`bg-base/20 border border-tv-border rounded-tv-sm p-3 text-tv-sm leading-relaxed whitespace-pre-wrap ${trade.mindset ? 'text-primary' : 'text-muted italic'}`}>
              {trade.mindset || 'No mindset notes provided.'}
            </div>
          </div>

          <div>
            <span className="label-section block text-accent mb-1">Decision Notes</span>
            <div className={`bg-base/20 border border-tv-border rounded-tv-sm p-3 text-tv-sm leading-relaxed whitespace-pre-wrap ${trade.decisionNotes ? 'text-primary' : 'text-muted italic'}`}>
              {trade.decisionNotes || 'No decision notes provided.'}
            </div>
          </div>

          <div>
            <span className="label-section block text-gold mb-1">Learnings</span>
            <div className={`bg-base/20 border border-tv-border rounded-tv-sm p-3 text-tv-sm leading-relaxed whitespace-pre-wrap ${trade.learnings ? 'text-primary' : 'text-muted italic'}`}>
              {trade.learnings || 'No learnings provided.'}
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-tv-border text-tv-xs text-muted">
          <div className="flex items-center gap-4">
            <span>Source: <Badge variant={trade.source === 'manual' ? 'manual' : 'accent'}>{trade.source === 'manual' ? 'Manual' : 'Synced'}</Badge></span>
            {trade.charges > 0 && (
              <span>Charges: ₹{trade.charges.toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={() => onEdit(trade)} className="px-3 py-1.5 rounded-md hover:bg-base text-secondary hover:text-primary transition-colors font-medium">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(trade.id)} className="px-3 py-1.5 rounded-md hover:bg-loss/10 text-loss transition-colors font-medium">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
