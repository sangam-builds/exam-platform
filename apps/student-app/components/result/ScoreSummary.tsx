'use client';

import React from 'react';
import Link from 'next/link';
import { AttemptResult } from '@exam-platform/shared-types';

interface ScoreSummaryProps {
  result: AttemptResult;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ result }) => {
  const isPassed = result.percentage >= 50;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Main Score Hero Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden text-center">
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isPassed ? 'bg-indigo-500' : 'bg-rose-500'
          }`}
        />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Examination Complete</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {result.examTitle}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Submitted on {new Date(result.submittedAt).toLocaleDateString()} at{' '}
              {new Date(result.submittedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Percentage Circle / Big Number */}
          <div className="py-4">
            <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full bg-slate-950/60 border-2 border-indigo-500/30 shadow-inner">
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">
                {result.percentage}%
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                Score
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-left">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 font-medium">Points Earned</span>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {result.score} / {result.totalPoints}
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 font-medium">Questions Answered</span>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {result.answeredCount} / {result.totalQuestions}
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <div className="text-lg font-bold mt-1 text-emerald-400">
                Graded
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center space-x-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
