import React from 'react';
import { Trade } from '../../types';
import { formatCurrency, formatDateFull } from '../../lib/analytics';
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
            <span className="text-lg font-bold text-primary tracking-wide">
              {trade.symbol}
            </span>
            <span className="text-xs text-secondary font-mono mt-0.5">
              {trade.isCarryForward && trade.exitTime
                ? `Squared off · ${formatDateFull(trade.exitTime)}`
                : formatDateFull(trade.date)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">{trade.market}</Badge>
            <Badge variant={trade.status === 'WIN' ? 'success' : trade.status === 'LOSS' ? 'danger' : 'warning'}>
              {trade.status}
            </Badge>
          </div>
        </div>

        {/* P&L Large Banner */}
        <div className="bg-base/40 border border-tv-border rounded-lg p-4 text-center">
          <div className={`text-2xl font-mono font-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
            {isProfit ? '+' : ''}
            {formatCurrency(trade.netPnl)}
          </div>
          <div className="text-xs text-secondary mt-1 font-mono">
            {trade.entryPrice.toFixed(2)} → {trade.exitPrice.toFixed(2)} × {trade.quantity} ({trade.direction})
          </div>
        </div>

        {/* Details Grid (2 columns) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-tv-border pb-4">
          <div>
            <span className="label-section block mb-0.5">Strategy</span>
            <span className="text-sm text-primary font-medium truncate block">
              {trade.strategyName || 'Untagged'}
            </span>
          </div>

          <div>
            <span className="label-section block mb-0.5">Direction</span>
            <span className={`text-sm font-semibold ${trade.direction === 'LONG' ? 'text-success' : 'text-danger'}`}>
              {trade.direction}
            </span>
          </div>

          <div>
            <span className="label-section block mb-0.5">Instrument Type</span>
            <span className="text-sm text-primary font-mono font-medium block">
              {trade.instrumentType}
            </span>
          </div>

          <div>
            <span className="label-section block mb-0.5">Discipline Score</span>
            <div className="mt-1">
              <DisciplineRater value={trade.disciplineScore} />
            </div>
          </div>
        </div>

        {/* Carry-Forward Banner */}
        {trade.isCarryForward && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-amber-400/8 border border-amber-400/20">
            <span className="text-amber-400 text-base leading-none">↩</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-amber-300 tracking-wide">CARRY FORWARD TRADE</span>
              <span className="text-xs text-amber-400/70">
                Position opened on {formatDateFull(trade.date)} · held overnight to square off
              </span>
            </div>
          </div>
        )}

        {/* Annotations Section */}
        <div className="space-y-4">
          <div>
            <span className="label-section block text-accent-light mb-1">Setup</span>
            <div className={`bg-base/20 border border-tv-border rounded-sm p-3 text-sm leading-relaxed whitespace-pre-wrap ${trade.setupDescription ? 'text-primary' : 'text-muted italic'}`}>
              {trade.setupDescription || 'No setup description provided.'}
            </div>
          </div>

          <div>
            <span className="label-section block text-secondary mb-1">Mindset</span>
            <div className={`bg-base/20 border border-tv-border rounded-sm p-3 text-sm leading-relaxed whitespace-pre-wrap ${trade.mindset ? 'text-primary' : 'text-muted italic'}`}>
              {trade.mindset || 'No mindset notes provided.'}
            </div>
          </div>

          <div>
            <span className="label-section block text-accent mb-1">Decision Notes</span>
            <div className={`bg-base/20 border border-tv-border rounded-sm p-3 text-sm leading-relaxed whitespace-pre-wrap ${trade.decisionNotes ? 'text-primary' : 'text-muted italic'}`}>
              {trade.decisionNotes || 'No decision notes provided.'}
            </div>
          </div>

          <div>
            <span className="label-section block text-warning mb-1">Learnings</span>
            <div className={`bg-base/20 border border-tv-border rounded-sm p-3 text-sm leading-relaxed whitespace-pre-wrap ${trade.learnings ? 'text-primary' : 'text-muted italic'}`}>
              {trade.learnings || 'No learnings provided.'}
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-tv-border text-xs text-muted">
          <div className="flex items-center gap-4">
            <span>Source: <Badge variant={trade.source === 'manual' ? 'default' : 'primary'}>{trade.source === 'manual' ? 'Manual' : 'Synced'}</Badge></span>
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
              <button onClick={() => onDelete(trade.id)} className="px-3 py-1.5 rounded-md hover:bg-danger/10 text-danger transition-colors font-medium">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
