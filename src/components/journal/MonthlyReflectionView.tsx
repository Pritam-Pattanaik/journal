import React, { useEffect, useState } from 'react';
import { useReflectionStore } from '../../stores/reflectionStore';
import { Button } from '../ui/Button';

export default function MonthlyReflectionView() {
  const { monthlyReflections, fetchMonthly, addMonthly, loading } = useReflectionStore();
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState('');
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });

  useEffect(() => {
    fetchMonthly();
  }, [fetchMonthly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMonthly(month, answers);
    setShowForm(false);
    setMonth('');
    setAnswers({ q1: '', q2: '', q3: '' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-primary">Monthly Reflection</h2>
          <p className="text-secondary text-sm">Deep self-reflection at the end of each month.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Reflection'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <input required type="month" className="input-base w-full max-w-xs" value={month} onChange={e => setMonth(e.target.value)} />
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-secondary">What was your biggest lesson this month?</label>
            <textarea required rows={3} className="input-base" value={answers.q1} onChange={e => setAnswers({...answers, q1: e.target.value})}></textarea>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-secondary">Did you adhere to your risk management rules?</label>
            <textarea required rows={3} className="input-base" value={answers.q2} onChange={e => setAnswers({...answers, q2: e.target.value})}></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-secondary">What is your primary goal for next month?</label>
            <textarea required rows={3} className="input-base" value={answers.q3} onChange={e => setAnswers({...answers, q3: e.target.value})}></textarea>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Reflection</Button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {monthlyReflections.map(r => (
          <div key={r.id} className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg text-primary mb-4">{r.month}</h3>
            <div className="space-y-4 text-sm text-secondary">
              <div><strong className="text-primary block mb-1">Biggest lesson:</strong> {r.answers.q1}</div>
              <div><strong className="text-primary block mb-1">Risk adherence:</strong> {r.answers.q2}</div>
              <div><strong className="text-primary block mb-1">Next month's goal:</strong> {r.answers.q3}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
