'use client';

import React from 'react';
import { StudentQuestion } from '@exam-platform/shared-types';

interface QuestionCardProps {
  question: StudentQuestion;
  index: number;
  totalQuestions: number;
  isFlagged: boolean;
  onToggleFlag: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  isFlagged,
  onToggleFlag,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HARD':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MEDIUM':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider">
            Question {index + 1} of {totalQuestions}
          </span>
          <span
            className={`px-2.5 py-0.5 border text-xs font-medium rounded-full ${getDifficultyBadge(
              question.difficulty,
            )}`}
          >
            {question.difficulty}
          </span>
          {question.topic && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-full border border-slate-700">
              {question.topic.name}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-400">
            {question.points} {question.points === 1 ? 'pt' : 'pts'}
          </span>

          <button
            type="button"
            onClick={onToggleFlag}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isFlagged
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
            <span>{isFlagged ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
        {question.text}
      </div>
    </div>
  );
};
