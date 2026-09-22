'use client';

import React from 'react';
import Link from 'next/link';
import { AttemptResult } from '@exam-platform/shared-types';

interface ScoreSummaryProps {
  result: AttemptResult;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ result }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Main Submission Confirmation Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none bg-emerald-500" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Submitted Successfully</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {result.examTitle}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your examination responses have been securely recorded and sealed.
            </p>
          </div>

          {/* Submission Badge Icon */}
          <div className="py-4">
            <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-950/60 border-2 border-emerald-500/30 shadow-inner text-emerald-400 mx-auto">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-left">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 font-medium">Questions Answered</span>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {result.answeredCount} / {result.totalQuestions}
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 font-medium">Submission Time</span>
              <div className="text-sm font-semibold text-slate-200 mt-1.5">
                {new Date(result.submittedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 font-medium">Evaluation</span>
              <div className="text-sm font-semibold text-indigo-400 mt-1.5">
                Sent to Instructor
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 text-left flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <strong className="text-slate-300 block mb-0.5">Instructor Evaluation</strong>
              Official scores and grading reports are managed directly by your course teacher. Please contact your instructor for grade inquiries.
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
