import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DisciplineSegment {
  name: string;
  value: number;
  color: string;
}

interface DisciplinePieProps {
  data: DisciplineSegment[];
}

export default function DisciplinePie({ data }: DisciplinePieProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card flex-1 min-w-[240px] flex flex-col justify-between relative">
      <div>
        <span className="label-section">Discipline Distribution</span>
      </div>

      <div className="h-[130px] w-full relative flex items-center justify-center">
        {total === 0 ? (
          <div className="text-muted font-ui text-tv-sm">
            No rated trades
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
              <span className="text-tv-md font-mono font-semibold text-primary">
                {total}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted font-ui">
                Trades
              </span>
            </div>
          </>
        )}
      </div>

      {/* Custom Horizontal Legend */}
      {total > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-tv-xs font-ui">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-secondary select-none">{item.name.split(' ')[0]}</span>
              <span className="font-mono text-primary font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
