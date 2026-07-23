import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Target, Loader2 } from 'lucide-react';
import { useStrategyStore } from '../../stores/strategyStore';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

export function StrategyFormModal({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const { fetchStrategies } = useStrategyStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timeframe: '5m'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/strategies', formData);
      await fetchStrategies();
      onOpenChange(false);
      setFormData({ name: '', description: '', timeframe: '5m' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 border border-border shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-iris/10 text-iris">
                <Target size={18} />
              </div>
              <Dialog.Title className="text-lg font-bold text-primary">New Strategy</Dialog.Title>
            </div>
            <Dialog.Close className="text-tertiary hover:text-primary transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Strategy Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-accent outline-none"
                placeholder="e.g. ORB, Trend Following"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-accent outline-none min-h-[80px]"
                placeholder="Rules and setup criteria..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Timeframe</label>
              <input
                type="text"
                value={formData.timeframe}
                onChange={e => setFormData({ ...formData, timeframe: e.target.value })}
                className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-accent outline-none"
                placeholder="e.g. 5m, 1h, Daily"
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Strategy'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
