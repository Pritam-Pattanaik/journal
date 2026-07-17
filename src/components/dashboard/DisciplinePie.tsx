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
    <div
      style={{
        background: 'rgb(var(--color-surface))',
        border: '1px solid rgb(var(--color-border))',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 220,
      }}
    >
      {/* Header */}
      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          color: 'rgb(var(--color-text-tertiary))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 12,
        }}
      >
        Discipline Distribution
      </span>

      {/* Donut Chart */}
      <div
        style={{
          height: 130,
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {total === 0 ? (
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'rgb(var(--color-text-tertiary))',
            }}
          >
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
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-lg)',
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                  color: 'rgb(var(--color-text-primary))',
                  lineHeight: 1,
                }}
              >
                {total}
              </span>
              <span
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgb(var(--color-text-tertiary))',
                  marginTop: 2,
                }}
              >
                Trades
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      {total > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '4px 12px',
            marginTop: 12,
          }}
        >
          {data.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--text-xs)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: item.color,
                }}
              />
              <span style={{ color: 'rgb(var(--color-text-secondary))' }}>
                {item.name.split(' ')[0]}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 500,
                  color: 'rgb(var(--color-text-primary))',
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
