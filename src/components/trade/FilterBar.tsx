import React from 'react';
import { Search, Calendar } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  marketFilter: string;
  onMarketChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  dateFilter: string;
  onDateChange: (val: string) => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  marketFilter,
  onMarketChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange
}: FilterBarProps) {
  const markets = ['All', 'NSE', 'F&O', 'BSE', 'MCX', 'Crypto'];
  const statuses = ['All', 'WIN', 'LOSS', 'BREAKEVEN', 'OPEN'];
  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
  ];

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full bg-surface/25 border border-tv-border rounded-tv-lg p-3">
      {/* Search Input */}
      <div className="flex-1 relative min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by symbol..."
          className="input-base pl-9 w-full"
        />
      </div>

      {/* Date Filter Dropdown */}
      <div className="relative shrink-0">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <select
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="input-base pl-9 pr-8 appearance-none cursor-pointer h-[38px] min-w-[140px]"
        >
          {dateRanges.map(range => (
            <option key={range.value} value={range.value} className="bg-base text-tv-base">
              {range.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 overflow-hidden">
        {/* Market Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar shrink-0">
          {markets.map((m) => {
            const isActive = marketFilter === m;
            return (
              <button
                key={m}
                onClick={() => onMarketChange(m)}
                className={`filter-pill whitespace-nowrap ${isActive ? 'active' : ''}`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar shrink-0">
          {statuses.map((s) => {
            const isActive = statusFilter === s;
            let activeClass = '';
            
            if (isActive) {
              if (s === 'WIN') activeClass = 'active-win';
              else if (s === 'LOSS') activeClass = 'active-loss';
              else activeClass = 'active';
            }

            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`filter-pill whitespace-nowrap ${isActive ? activeClass : ''}`}
              >
                {s === 'All' ? 'All Outcomes' : s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
