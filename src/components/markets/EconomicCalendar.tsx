import React from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

const EVENTS = [
  { id: 1, time: '14:30', country: 'US', title: 'Core CPI (MoM)', importance: 'high', expected: '0.2%', previous: '0.3%' },
  { id: 2, time: '14:30', country: 'US', title: 'CPI (YoY)', importance: 'high', expected: '3.1%', previous: '3.2%' },
  { id: 3, time: '19:00', country: 'US', title: 'Fed Chair Powell Speaks', importance: 'high', expected: '-', previous: '-' },
  { id: 4, time: '18:00', country: 'IN', title: 'India Industrial Production', importance: 'medium', expected: '4.5%', previous: '3.8%' },
  { id: 5, time: '20:00', country: 'US', title: 'Crude Oil Inventories', importance: 'medium', expected: '-1.2M', previous: '2.1M' },
];

export default function EconomicCalendar() {
  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-accent" />
        <h3 className="font-display font-bold text-primary">Economic Calendar</h3>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
        {EVENTS.map((evt) => (
          <div key={evt.id} className="p-3 bg-surface-1 rounded-xl border border-border group hover:border-border-hover transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded text-secondary flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {evt.time}
                </span>
                <span className="text-[10px] font-bold text-tertiary bg-surface-2 px-1.5 py-0.5 rounded">
                  {evt.country}
                </span>
              </div>
              {evt.importance === 'high' && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" /> High Impact
                </span>
              )}
            </div>
            
            <h4 className="text-sm font-bold text-primary mb-2 line-clamp-1">{evt.title}</h4>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-tertiary">Expected</span>
                <span className="font-mono text-secondary font-semibold">{evt.expected}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-tertiary">Previous</span>
                <span className="font-mono text-tertiary">{evt.previous}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-xs font-bold text-secondary hover:text-primary transition-colors border border-border rounded-lg hover:bg-surface-1">
        View Full Calendar
      </button>
    </div>
  );
}
