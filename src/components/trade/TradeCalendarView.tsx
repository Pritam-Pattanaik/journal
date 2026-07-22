import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Trade } from '../../types';
import { formatCurrency } from '../../lib/analytics';
import { getLocalYYYYMMDD } from '../../lib/dateUtils';
import { cn } from '../../lib/cn';

interface TradeCalendarViewProps {
  trades: Trade[];
  onDayClick: (dateStr: string) => void;
}

export default function TradeCalendarView({ trades, onDayClick }: TradeCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week of first day (0 = Sunday, 1 = Monday, etc.)
    let startDayOfWeek = firstDay.getDay();
    // Adjust to Monday start
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysInMonth = lastDay.getDate();
    
    const weeks: { days: { date: Date, dateStr: string, isCurrentMonth: boolean, pnl: number, count: number }[], weeklyPnl: number }[] = [];
    
    let currentWeek: any[] = [];
    
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      currentWeek.push({ date: d, dateStr: getLocalYYYYMMDD(d), isCurrentMonth: false, pnl: 0, count: 0 });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      currentWeek.push({ date: d, dateStr: getLocalYYYYMMDD(d), isCurrentMonth: true, pnl: 0, count: 0 });
      
      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek, weeklyPnl: 0 });
        currentWeek = [];
      }
    }
    
    // Next month padding
    let nextMonthDay = 1;
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      const d = new Date(year, month + 1, nextMonthDay++);
      currentWeek.push({ date: d, dateStr: getLocalYYYYMMDD(d), isCurrentMonth: false, pnl: 0, count: 0 });
    }
    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek, weeklyPnl: 0 });
    }

    // Map trades to days
    let monthlyTotalPnl = 0;
    
    trades.forEach(t => {
      const dateStr = getLocalYYYYMMDD(new Date(t.isCarryForward && t.exitTime ? t.exitTime : t.date));
      for (const week of weeks) {
        const day = week.days.find(d => d.dateStr === dateStr);
        if (day) {
          day.pnl += t.netPnl;
          day.count++;
          if (day.isCurrentMonth) {
            monthlyTotalPnl += t.netPnl;
          }
          break;
        }
      }
    });

    // Calculate weekly totals
    for (const week of weeks) {
      week.weeklyPnl = week.days.reduce((sum, d) => sum + (d.isCurrentMonth ? d.pnl : 0), 0);
    }

    return { weeks, monthlyTotalPnl };
  }, [currentMonth, trades]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Heatmap color logic
  const getHeatmapColor = (pnl: number, count: number) => {
    if (count === 0) return 'bg-transparent border-transparent hover:border-border-subtle';
    if (pnl > 0) {
      if (pnl > 500) return 'bg-success/30 border-success/40 text-success shadow-inner';
      if (pnl > 100) return 'bg-success/20 border-success/30 text-success shadow-inner';
      return 'bg-success/10 border-success/20 text-success shadow-inner';
    }
    if (pnl < 0) {
      if (pnl < -500) return 'bg-danger/30 border-danger/40 text-danger shadow-inner';
      if (pnl < -100) return 'bg-danger/20 border-danger/30 text-danger shadow-inner';
      return 'bg-danger/10 border-danger/20 text-danger shadow-inner';
    }
    return 'bg-surface-2 border-border-subtle text-primary shadow-inner';
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-1/50">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-surface-2 rounded-xl transition-colors text-tertiary hover:text-primary border border-transparent hover:border-border-subtle shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-primary w-40 text-center">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-surface-2 rounded-xl transition-colors text-tertiary hover:text-primary border border-transparent hover:border-border-subtle shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Monthly Total</div>
          <div className={cn("font-mono text-xl font-bold tabular-nums tracking-tight", calendarData.monthlyTotalPnl >= 0 ? "text-success" : "text-danger")}>
            {calendarData.monthlyTotalPnl >= 0 ? '+' : ''}{formatCurrency(calendarData.monthlyTotalPnl)}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Grid Header */}
        <div className="grid grid-cols-8 gap-4 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-tertiary text-center">
              {day}
            </div>
          ))}
          <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary text-right pr-4">
            Weekly P&L
          </div>
        </div>

        {/* Calendar Weeks */}
        <div className="space-y-4">
          {calendarData.weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-8 gap-4">
              {week.days.map((day, dIdx) => (
                <button
                  key={dIdx}
                  onClick={() => day.count > 0 && onDayClick(day.dateStr)}
                  disabled={day.count === 0}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all h-20 outline-none focus:ring-2 focus:ring-accent/50",
                    day.isCurrentMonth ? getHeatmapColor(day.pnl, day.count) : "opacity-20 pointer-events-none",
                    day.count > 0 ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : "cursor-default"
                  )}
                >
                  <span className="text-xs font-bold mb-1 opacity-70">{day.date.getDate()}</span>
                  {day.count > 0 && (
                    <span className="font-mono text-[11px] font-bold tabular-nums tracking-tight">
                      {day.pnl >= 0 ? '+' : ''}{formatCurrency(day.pnl)}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Weekly Total Column */}
              <div className="flex items-center justify-end pr-4 h-20">
                <span className={cn(
                  "font-mono text-sm font-bold tabular-nums tracking-tight",
                  week.weeklyPnl >= 0 ? "text-success" : "text-danger"
                )}>
                  {week.weeklyPnl !== 0 ? (week.weeklyPnl > 0 ? '+' : '') + formatCurrency(week.weeklyPnl) : '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
