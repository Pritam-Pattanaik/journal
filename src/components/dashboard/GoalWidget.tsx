import React, { useEffect } from 'react';
import { useGoalStore } from '../../stores/goalStore';
import { Target, CheckCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { getLocalYYYYMMDD } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';

export default function GoalWidget() {
  const { goals, loading, fetchGoals, completeGoal } = useGoalStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleComplete = async (goalId: string) => {
    const today = getLocalYYYYMMDD(new Date());
    await completeGoal(goalId, today, true);
  };

  const today = getLocalYYYYMMDD(new Date());

  if (loading) {
    return <div className="card p-6 flex justify-center items-center h-[200px]"><Loader2 className="animate-spin text-tertiary" /></div>;
  }

  return (
    <div className="card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-secondary">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Daily & Weekly Goals</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/goals')}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border">
        {goals.length === 0 ? (
          <div className="text-center py-6 text-tertiary text-sm">No goals set yet.</div>
        ) : (
          goals.slice(0, 5).map(goal => {
            const isCompletedToday = goal.completions?.some((c: any) => c.date.startsWith(today));
            return (
              <div key={goal.id} className="bg-surface-1 border border-border-subtle hover:border-border hover:bg-surface-2 p-3 rounded-xl flex items-center justify-between group transition-all">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-tertiary bg-surface-2 px-1.5 py-0.5 rounded">
                      {goal.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-primary truncate group-hover:text-accent transition-colors">
                    {goal.description}
                  </h4>
                  {goal.target && <p className="text-[10px] text-tertiary mt-0.5">Target: {goal.target}</p>}
                </div>
                
                <Button 
                  variant={isCompletedToday ? "ghost" : "secondary"}
                  size="sm"
                  disabled={isCompletedToday}
                  onClick={() => handleComplete(goal.id)}
                  className="shrink-0 text-[10px] py-1 h-auto"
                >
                  {isCompletedToday ? (
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                  ) : (
                    'Done'
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
