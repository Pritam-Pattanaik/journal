import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2 } from 'lucide-react';
import { Trade } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TradeSheetProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

export default function TradeSheet({ trade, isOpen, onClose, onEdit, onDelete }: TradeSheetProps) {
  if (!trade && isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && trade && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-1 border-l border-border shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-0/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-semibold text-primary">{trade.symbol}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary">{trade.market}</Badge>
                  <Badge variant={trade.status === 'WIN' ? 'success' : trade.status === 'LOSS' ? 'danger' : 'warning'}>
                    {trade.status}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-8">
              {/* Core Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-2 border border-border">
                  <p className="text-sm text-secondary mb-1">Net P&L</p>
                  <p className={`text-2xl font-bold tabular-nums ${trade.netPnl > 0 ? 'text-success' : trade.netPnl < 0 ? 'text-danger' : 'text-primary'}`}>
                    ₹{trade.netPnl.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2 border border-border">
                  <p className="text-sm text-secondary mb-1">Gross P&L</p>
                  <p className={`text-2xl font-bold tabular-nums ${trade.pnl > 0 ? 'text-success' : trade.pnl < 0 ? 'text-danger' : 'text-primary'}`}>
                    ₹{trade.pnl.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Execution Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">Execution</h3>
                <div className="rounded-xl border border-border divide-y divide-border bg-surface-0">
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-tertiary">Direction</span>
                    <Badge variant={trade.direction === 'LONG' ? 'success' : 'danger'}>{trade.direction}</Badge>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-tertiary">Entry Price</span>
                    <span className="font-medium tabular-nums">₹{trade.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-tertiary">Exit Price</span>
                    <span className="font-medium tabular-nums">{trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-tertiary">Quantity</span>
                    <span className="font-medium tabular-nums">{trade.quantity}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-tertiary">Charges</span>
                    <span className="font-medium tabular-nums text-danger">₹{trade.charges.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Setup Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">Setup</h3>
                <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-4">
                  <div>
                    <p className="text-xs text-tertiary mb-1">Strategy</p>
                    <p className="text-sm font-medium">{trade.strategyName || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary mb-1">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {trade.tags && trade.tags.length > 0 ? (
                        trade.tags.map((t, i) => <Badge key={i} variant="default">{t}</Badge>)
                      ) : (
                        <span className="text-sm text-secondary">No tags recorded</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary mb-1">Setup Description</p>
                    <p className="text-sm text-secondary whitespace-pre-wrap">{trade.setupDescription || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary mb-1">Decision Notes</p>
                    <p className="text-sm text-secondary whitespace-pre-wrap">{trade.decisionNotes || 'No notes'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-border bg-surface-0/50 backdrop-blur-md sticky bottom-0 z-10 flex gap-3">
              {onEdit && (
                <Button variant="secondary" className="flex-1" onClick={() => onEdit(trade)}>
                  <Edit2 className="h-4 w-4" />
                  Edit Trade
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" className="flex-1" onClick={() => {
                  if (window.confirm('Are you sure you want to delete this trade?')) {
                    onDelete(trade.id);
                  }
                }}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
