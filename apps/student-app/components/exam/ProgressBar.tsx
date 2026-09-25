'use client';

import React from 'react';

interface ProgressBarProps {
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalQuestions,
  answeredCount,
  flaggedCount,
}) => {
  const percentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span>
            Progress:{' '}
            <strong className="text-slate-200">
              {answeredCount}/{totalQuestions}
            </strong>{' '}
            answered
          </span>
          {flaggedCount > 0 && (
            <span className="text-amber-400">
              ({flaggedCount} for review)
            </span>
          )}
        </div>
        <span className="font-semibold text-indigo-400">{percentage}%</span>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
