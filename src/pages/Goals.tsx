import React, { useEffect, useState } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { Target, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getLocalYYYYMMDD } from '../lib/dateUtils';

export default function Goals() {
  const { goals, loading, fetchGoals, addGoal, completeGoal } = useGoalStore();
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('daily');
  const [target, setTarget] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGoal({ description: desc, type, target: target ? parseInt(target) : null });
    setShowForm(false);
    setDesc('');
    setTarget('');
  };

  const handleComplete = async (goalId: string) => {
    const today = getLocalYYYYMMDD(new Date());
    await completeGoal(goalId, today, true);
  };

  const today = getLocalYYYYMMDD(new Date());

  return (
    <div className="flex flex-col gap-6 w-full pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">Goals & Habits</h1>
          <p className="text-secondary mt-1">Track your daily and weekly trading habits.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAdd} className="space-y-4">
            <input required type="text" placeholder="Goal Description" className="input-base" value={desc} onChange={e => setDesc(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <select className="input-base" value={type} onChange={e => setType(e.target.value)}>
                <option value="daily">Daily Habit</option>
                <option value="weekly">Weekly Target</option>
              </select>
              <input type="number" placeholder="Target (e.g. 5 trades max)" className="input-base" value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Goal</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tertiary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const isCompletedToday = goal.completions?.some((c: any) => c.date.startsWith(today));
            return (
              <div key={goal.id} className="bg-surface border border-border p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary">{goal.type}</span>
                  </div>
                  <h3 className="font-bold text-primary text-lg">{goal.description}</h3>
                  {goal.target && <p className="text-sm text-tertiary mt-1">Target: {goal.target}</p>}
                </div>
                
                <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div className="text-xs text-tertiary font-medium">
                    {goal.completions?.length || 0} Completions
                  </div>
                  <Button 
                    variant={isCompletedToday ? "secondary" : "primary"}
                    size="sm"
                    disabled={isCompletedToday}
                    onClick={() => handleComplete(goal.id)}
                  >
                    {isCompletedToday ? (
                      <><CheckCircle className="w-4 h-4 mr-1.5 text-success" /> Done Today</>
                    ) : (
                      'Mark Complete'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
          {!loading && goals.length === 0 && (
            <div className="col-span-full p-10 text-center text-tertiary">No goals set yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
