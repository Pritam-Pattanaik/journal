import React from 'react';

interface DisciplineRaterProps {
  value: number; // 1 to 5
  onChange?: (val: number) => void;
  interactive?: boolean;
}

export default function DisciplineRater({
  value,
  onChange,
  interactive = false
}: DisciplineRaterProps) {
  
  // Filled dot/square color logic based on total score value
  const getColor = (score: number) => {
    if (score >= 4) return '#10d990'; // Green
    if (score === 3) return '#f59e0b'; // Gold
    return '#ff4b6e'; // Red
  };

  const activeColor = getColor(value);

  if (interactive) {
    return (
      <div className="flex gap-2 select-none">
        {[1, 2, 3, 4, 5].map((num) => {
          const isSelected = num <= value;
          const boxColor = isSelected ? getColor(value) : 'transparent';
          
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange && onChange(num)}
              className="h-9 w-9 border rounded flex items-center justify-center font-mono text-tv-sm font-semibold transition-all duration-150 active:scale-95"
              style={{
                borderColor: isSelected ? activeColor : 'rgba(99, 102, 241, 0.12)',
                backgroundColor: isSelected ? `${boxColor}15` : 'transparent',
                color: isSelected ? activeColor : '#475569'
              }}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  }

  // Display mode (dot row)
  return (
    <div className="flex gap-[2px] items-center select-none" title={`Discipline: ${value}/5`}>
      {[1, 2, 3, 4, 5].map((num) => {
        const isFilled = num <= value;
        return (
          <div
            key={num}
            className="h-2 w-2 rounded-[2px]"
            style={{
              backgroundColor: isFilled ? activeColor : 'rgba(99, 102, 241, 0.12)'
            }}
          />
        );
      })}
    </div>
  );
}
