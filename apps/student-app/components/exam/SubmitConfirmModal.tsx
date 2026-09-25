'use client';

import React from 'react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  totalQuestions,
  answeredCount,
  flaggedCount,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <svg
              className="w-5 h-5"
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
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Submit Examination?
            </h3>
            <p className="text-xs text-slate-400">
              Please review your summary before finalizing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
          <div>
            <div className="text-xl font-bold text-emerald-400">
              {answeredCount}
            </div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">
              Answered
            </div>
          </div>
          <div>
            <div
              className={`text-xl font-bold ${
                unansweredCount > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {unansweredCount}
            </div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">
              Unanswered
            </div>
          </div>
          <div>
            <div
              className={`text-xl font-bold ${
                flaggedCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {flaggedCount}
            </div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">
              Flagged
            </div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
            <svg
              className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              You still have <strong>{unansweredCount}</strong> unanswered questions. Unanswered questions will receive 0 points.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Review Questions
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Confirm & Submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
