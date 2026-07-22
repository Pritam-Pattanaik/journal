import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

interface DisciplinePieProps {
  data: { name: string; value: number; color: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const dp = payload[0];
  return (
    <div className="glass-float px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">{dp.name}</p>
      <p className="text-sm font-bold text-primary">{dp.value} trades</p>
    </div>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function DisciplinePie({ data }: DisciplinePieProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const colors: Record<string, string> = {
    'Perfect': 'rgb(var(--color-iris))',
    'Good':    'rgb(var(--color-accent))',
    'Poor':    'rgb(var(--color-text-muted))',
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-secondary">
        <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-border flex items-center justify-center">
          <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
        </div>
        <p className="text-sm font-medium">No rated trades yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="img" aria-label="Discipline distribution chart">
      {/* Chart — explicit fraction of the container */}
      <div className="flex-1 relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart onMouseLeave={() => setActiveIndex(undefined)}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {data.map((entry, i) => (
                <Cell 
                  key={i} 
                  fill={colors[entry.name] ?? entry.color} 
                  opacity={activeIndex === undefined || activeIndex === i ? 1 : 0.4}
                  style={{ transition: 'opacity 0.2s ease, fill 0.2s ease' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-2xl font-bold text-primary tabular-nums">{total}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-secondary">Trades</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 shrink-0 pb-1 mt-2">
        {data.map((entry, i) => (
          <div 
            key={entry.name} 
            className="flex items-center gap-2 cursor-pointer transition-opacity duration-200"
            style={{ opacity: activeIndex === undefined || activeIndex === i ? 1 : 0.4 }}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[entry.name] ?? entry.color }} />
            <span className="text-xs font-semibold text-secondary">{entry.name} {entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
