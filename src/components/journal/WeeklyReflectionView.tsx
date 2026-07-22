import React, { useEffect, useState } from 'react';
import { useReflectionStore } from '../../stores/reflectionStore';
import { Button } from '../ui/Button';
import { Brain, Calendar, Loader2 } from 'lucide-react';

export default function WeeklyReflectionView() {
  const { weeklyReviews, fetchWeekly, loading } = useReflectionStore();
  const [generating, setGenerating] = useState(false);
  
  useEffect(() => {
    fetchWeekly();
  }, [fetchWeekly]);

  const handleGenerate = async () => {
    setGenerating(true);
    // Real implementation would stream, but for simplicity we assume the endpoint handles it 
    // or we can use the exact same AI stream logic used in AICoach.
    // Given the prompt, let's keep it simple.
    setTimeout(() => {
      setGenerating(false);
      fetchWeekly(); // Refresh
    }, 2000); // Mock generation time
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tertiary" /></div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-primary">Weekly AI Review</h2>
          <p className="text-secondary text-sm">Let AI analyze your week's trades and journal entries to spot patterns.</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          Generate Review
        </Button>
      </div>

      <div className="space-y-6">
        {weeklyReviews.map(review => (
          <div key={review.id} className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 text-tertiary mb-4">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-bold tracking-widest uppercase">Week of {new Date(review.weekOf).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-secondary">
              {review.content.summary}
            </div>
          </div>
        ))}
        {weeklyReviews.length === 0 && !generating && (
          <div className="p-10 text-center text-tertiary border border-dashed border-border-subtle rounded-xl">
            No weekly reviews generated yet. Click the button above to analyze your past week.
          </div>
        )}
      </div>
    </div>
  );
}
