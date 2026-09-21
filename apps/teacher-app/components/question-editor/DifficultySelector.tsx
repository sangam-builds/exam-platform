'use client';

import React from 'react';
import { DifficultyLevel } from '@exam-platform/shared-types';

export interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (value: DifficultyLevel) => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ value, onChange }) => {
  const options: { level: DifficultyLevel; label: string; activeClass: string }[] = [
    {
      level: 'EASY',
      label: 'Easy',
      activeClass: 'bg-emerald-950/70 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500',
    },
    {
      level: 'MEDIUM',
      label: 'Medium',
      activeClass: 'bg-amber-950/70 border-amber-500 text-amber-300 ring-1 ring-amber-500',
    },
    {
      level: 'HARD',
      label: 'Hard',
      activeClass: 'bg-rose-950/70 border-rose-500 text-rose-300 ring-1 ring-rose-500',
    },
  ];

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulty Level</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => onChange(opt.level)}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                isSelected
                  ? opt.activeClass
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultySelector;
