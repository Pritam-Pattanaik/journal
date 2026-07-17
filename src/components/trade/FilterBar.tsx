import React, { useState } from 'react';
import { Search, CalendarDays, Command, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

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

const markets = ['All', 'NSE', 'F&O', 'BSE', 'MCX', 'Crypto'];
const statuses = ['All', 'WIN', 'LOSS', 'BREAKEVEN', 'OPEN'];
const dateRanges = [
  { value: 'all',        label: 'All Time' },
  { value: 'today',      label: 'Today' },
  { value: 'week',       label: 'This Week' },
  { value: 'month',      label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
];

function SegmentedControl({ 
  options, 
  activeValue, 
  onChange, 
  layoutIdPrefix 
}: { 
  options: string[]; 
  activeValue: string; 
  onChange: (val: string) => void;
  layoutIdPrefix: string;
}) {
  return (
    <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 shadow-inner">
      {options.map((opt) => {
        const isActive = activeValue === opt;
        
        let activeColorClass = "bg-primary text-canvas shadow-sm";
        if (isActive && opt === 'WIN') activeColorClass = "bg-success text-canvas shadow-sm";
        if (isActive && opt === 'LOSS') activeColorClass = "bg-danger text-canvas shadow-sm";
        
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "relative px-4 py-1.5 text-xs font-bold rounded-lg transition-colors outline-none whitespace-nowrap",
              isActive ? "text-canvas" : "text-secondary hover:text-primary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`segment-${layoutIdPrefix}`}
                className={cn("absolute inset-0 rounded-lg", activeColorClass)}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{opt === 'All' && layoutIdPrefix === 'status' ? 'All Outcomes' : opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  marketFilter,
  onMarketChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
}: FilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="flex flex-col xl:flex-row gap-4 w-full glass-panel p-4 rounded-2xl items-start xl:items-center justify-between">
      
      {/* Left: Search Bar (Raycast style) */}
      <div 
        className={cn(
          "relative flex items-center w-full xl:max-w-md h-12 bg-surface-1 border rounded-xl overflow-hidden transition-all duration-300",
          isSearchFocused 
            ? "border-accent ring-4 ring-accent/10 shadow-md" 
            : "border-black/10 dark:border-white/10 shadow-sm hover:border-black/20 dark:hover:border-white/20"
        )}
      >
        <Search className="absolute left-4 w-4 h-4 text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search by symbol, tag, or notes..."
          className="w-full h-full bg-transparent pl-11 pr-14 text-sm font-medium text-primary placeholder:text-tertiary outline-none"
        />
        <div className="absolute right-3 flex items-center gap-1 opacity-50 pointer-events-none hidden sm:flex">
          <kbd className="h-5 px-1.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-[10px] font-mono flex items-center justify-center">
            <Command className="w-3 h-3" />
          </kbd>
          <kbd className="h-5 px-1.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-[10px] font-mono flex items-center justify-center">
            K
          </kbd>
        </div>
      </div>

      {/* Right: Filters */}
      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
        
        {/* Date Dropdown */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <CalendarDays className="w-4 h-4 text-tertiary group-hover:text-secondary transition-colors" />
          </div>
          <select
            value={dateFilter}
            onChange={e => onDateChange(e.target.value)}
            className="h-10 pl-9 pr-8 bg-surface-1 border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold text-secondary appearance-none cursor-pointer outline-none hover:border-black/20 dark:hover:border-white/20 transition-colors focus:ring-2 focus:ring-accent/20 focus:border-accent shadow-sm"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronDown className="w-3 h-3 text-tertiary group-hover:text-secondary transition-colors" />
          </div>
        </div>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 hidden sm:block" />

        <SegmentedControl 
          options={markets} 
          activeValue={marketFilter} 
          onChange={onMarketChange}
          layoutIdPrefix="market"
        />

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 hidden sm:block" />

        <SegmentedControl 
          options={statuses} 
          activeValue={statusFilter} 
          onChange={onStatusChange}
          layoutIdPrefix="status"
        />

      </div>
    </div>
  );
}
