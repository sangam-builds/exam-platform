'use client';

import React from 'react';
import { useExamTimer } from '../../hooks/useExamTimer';

interface TimerProps {
  durationMinutes: number;
  startedAt: string;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  durationMinutes,
  startedAt,
  onExpire,
}) => {
  const { formattedTime, isWarning, isCritical } = useExamTimer({
    durationMinutes,
    startedAt,
    onExpire,
  });

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border font-mono font-semibold text-sm transition-all duration-300 ${
        isCritical
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
          : isWarning
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-slate-800/80 border-slate-700 text-slate-200'
      }`}
    >
      <svg
        className={`w-4 h-4 ${
          isCritical
            ? 'text-rose-400 animate-spin'
            : isWarning
              ? 'text-amber-400'
              : 'text-indigo-400'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{formattedTime}</span>
    </div>
  );
};
