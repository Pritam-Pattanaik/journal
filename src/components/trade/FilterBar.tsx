import React from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  marketFilter: string;
  onMarketChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  marketFilter,
  onMarketChange,
  statusFilter,
  onStatusChange
}: FilterBarProps) {
  const markets = ['All', 'NSE', 'F&O', 'BSE', 'MCX', 'Crypto'];
  const statuses = ['All', 'WIN', 'LOSS', 'BREAKEVEN', 'OPEN'];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full bg-surface/25 border border-tv-border rounded-tv-lg p-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by symbol..."
          className="input-base pl-9"
        />
      </div>

      {/* Market Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
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
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
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
  );
}
