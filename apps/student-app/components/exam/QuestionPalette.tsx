'use client';

import React from 'react';
import { StudentQuestion } from '@exam-platform/shared-types';
import { LocalAnswer } from '../../store/examStore';

interface QuestionPaletteProps {
  questions: StudentQuestion[];
  currentIndex: number;
  answers: Record<string, LocalAnswer>;
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  onSelectIndex,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Question Palette
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {questions.length} total
        </span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const isAnswered = Boolean(ans?.selectedAnswer || ans?.textAnswer);
          const isFlagged = Boolean(ans?.isFlagged);
          const isCurrent = currentIndex === idx;

          let btnClass = 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700';

          if (isCurrent) {
            btnClass =
              'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/40 font-bold';
          } else if (isFlagged && isAnswered) {
            btnClass =
              'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
          } else if (isFlagged) {
            btnClass =
              'bg-amber-500/10 text-amber-400 border-amber-500/30';
          } else if (isAnswered) {
            btnClass =
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-medium';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`h-10 rounded-xl border text-xs flex items-center justify-center relative transition-all duration-150 ${btnClass}`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
          <span>Answered</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40 relative">
            <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400" />
          </div>
          <span>Marked for Review</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-md bg-indigo-600 border border-indigo-400" />
          <span>Current Question</span>
        </div>
      </div>
    </div>
  );
};
