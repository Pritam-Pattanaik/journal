import React, { useState, useEffect } from 'react';
import { X, Brain, Loader2 } from 'lucide-react';
import { Trade } from '../../types';
import Button from '../ui/Button';
import { getLocalDateTimeString } from '../../lib/dateUtils';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Trade | null;
}

export default function TradeFormModal({ isOpen, onClose, onSave, initialData }: TradeFormModalProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    market: 'NSE' as Trade['market'],
    instrumentType: 'EQ' as Trade['instrumentType'],
    direction: 'LONG' as Trade['direction'],
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    charges: '',
    strategyName: '',
    date: getLocalDateTimeString(),
    notes: '',
    setupDescription: '',
    mindset: '',
    learnings: '',
    disciplineScore: '',
    stopLoss: '',
    mistakes: [] as string[],
    checklist: {} as Record<string, boolean>,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        symbol: initialData.symbol,
        market: initialData.market,
        instrumentType: initialData.instrumentType,
        direction: initialData.direction,
        entryPrice: initialData.entryPrice.toString(),
        exitPrice: initialData.exitPrice.toString(),
        quantity: initialData.quantity.toString(),
        charges: initialData.charges.toString(),
        strategyName: initialData.strategyName || '',
        date: getLocalDateTimeString(new Date(initialData.date)),
        notes: initialData.decisionNotes || '',
        setupDescription: initialData.setupDescription || '',
        mindset: initialData.mindset || '',
        learnings: initialData.learnings || '',
        disciplineScore: initialData.disciplineScore ? initialData.disciplineScore.toString() : '',
        stopLoss: initialData.stopLoss ? initialData.stopLoss.toString() : '',
        mistakes: initialData.mistakes || [],
        checklist: initialData.checklist || {},
      });
    } else {
      setFormData({
        symbol: '',
        market: 'NSE',
        instrumentType: 'EQ',
        direction: 'LONG',
        entryPrice: '',
        exitPrice: '',
        quantity: '',
        charges: '',
        strategyName: '',
        date: getLocalDateTimeString(),
        notes: '',
        setupDescription: '',
        mindset: '',
        learnings: '',
        disciplineScore: '',
        stopLoss: '',
        mistakes: [],
        checklist: {},
      });
    }
  }, [initialData, isOpen]);

  // AI evaluation for score has been removed. The backend deterministic engine computes this now.

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(formData.entryPrice) || 0;
    const exit = parseFloat(formData.exitPrice) || 0;
    const qty = parseInt(formData.quantity) || 0;
    const charges = parseFloat(formData.charges) || 0;
    
    // Calculate PNL
    let pnl = 0;
    if (formData.direction === 'LONG') {
      pnl = (exit - entry) * qty;
    } else {
      pnl = (entry - exit) * qty;
    }
    
    const netPnl = pnl - charges;
    const status = netPnl > 0 ? 'WIN' : netPnl < 0 ? 'LOSS' : 'BREAKEVEN';

    onSave({
      symbol: formData.symbol.toUpperCase(),
      market: formData.market,
      instrumentType: formData.instrumentType,
      direction: formData.direction,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      pnl,
      charges,
      netPnl,
      status,
      date: new Date(formData.date).toISOString(),
      source: 'manual',
      strategyName: formData.strategyName,
      decisionNotes: formData.notes,
      setupDescription: formData.setupDescription,
      mindset: formData.mindset,
      learnings: formData.learnings,
      isManualOverride: !!formData.disciplineScore,
      manualScore: formData.disciplineScore ? parseInt(formData.disciplineScore) : undefined,
      disciplineScore: formData.disciplineScore ? parseInt(formData.disciplineScore) : undefined,
      stopLoss: parseFloat(formData.stopLoss) || null,
      mistakes: formData.mistakes,
      checklist: formData.checklist,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-tv-border rounded-xl shadow-2xl modal-enter max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tv-border shrink-0">
          <h2 className="text-lg font-bold font-ui">{initialData ? 'Edit Trade' : 'Add Manual Trade'}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary hover:bg-base rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto">
          <form id="trade-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Symbol</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. NIFTY or AAPL"
                  className="input-base uppercase"
                  value={formData.symbol}
                  onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Date & Time</label>
                <input
                  required
                  type="datetime-local"
                  className="input-base"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Market</label>
                <select
                  className="input-base"
                  value={formData.market}
                  onChange={e => setFormData({ ...formData, market: e.target.value as Trade['market'] })}
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                  <option value="F&O">F&O</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Instrument</label>
                <select
                  className="input-base"
                  value={formData.instrumentType}
                  onChange={e => setFormData({ ...formData, instrumentType: e.target.value as Trade['instrumentType'] })}
                >
                  <option value="EQ">Equity</option>
                  <option value="CE">Call (CE)</option>
                  <option value="PE">Put (PE)</option>
                  <option value="FUT">Future</option>
                  <option value="CRYPTO">Crypto</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Direction</label>
                <select
                  className="input-base"
                  value={formData.direction}
                  onChange={e => setFormData({ ...formData, direction: e.target.value as Trade['direction'] })}
                >
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Quantity</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  className="input-base"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Entry Price</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-base font-number"
                  value={formData.entryPrice}
                  onChange={e => setFormData({ ...formData, entryPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Exit Price</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-base font-number"
                  value={formData.exitPrice}
                  onChange={e => setFormData({ ...formData, exitPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Charges (Optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-base font-number"
                  value={formData.charges}
                  onChange={e => setFormData({ ...formData, charges: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Stop Loss</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-base font-number"
                  value={formData.stopLoss}
                  onChange={e => setFormData({ ...formData, stopLoss: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Mistakes (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. FOMO, early exit, oversized"
                className="input-base"
                value={formData.mistakes.join(', ')}
                onChange={e => setFormData({ ...formData, mistakes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Strategy (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Breakout Retest"
                  className="input-base"
                  value={formData.strategyName}
                  onChange={e => setFormData({ ...formData, strategyName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Manual Score Override (1-5)</label>
                </div>
                <select
                  className="input-base"
                  value={formData.disciplineScore}
                  onChange={e => setFormData({ ...formData, disciplineScore: e.target.value })}
                >
                  <option value="">Not rated</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Setup Description</label>
              <textarea
                rows={2}
                className="input-base resize-none"
                placeholder="Describe your setup..."
                value={formData.setupDescription}
                onChange={e => setFormData({ ...formData, setupDescription: e.target.value })}
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Mindset</label>
              <textarea
                rows={2}
                className="input-base resize-none"
                placeholder="What was your mental state?"
                value={formData.mindset}
                onChange={e => setFormData({ ...formData, mindset: e.target.value })}
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Decision Notes</label>
              <textarea
                rows={2}
                className="input-base resize-none"
                placeholder="Why did you take this trade?"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider">Learnings</label>
              <textarea
                rows={2}
                className="input-base resize-none"
                placeholder="What did you learn from this trade?"
                value={formData.learnings}
                onChange={e => setFormData({ ...formData, learnings: e.target.value })}
              ></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-tv-border bg-base/50 flex justify-end gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={(e) => handleSubmit(e as any)}>
            {initialData ? 'Save Changes' : 'Add Trade'}
          </Button>
        </div>
      </div>
    </div>
  );
}
