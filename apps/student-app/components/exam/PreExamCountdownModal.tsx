'use client';

import React, { useEffect, useState } from 'react';
import { Exam } from '@exam-platform/shared-types';

interface PreExamCountdownModalProps {
  isOpen: boolean;
  exam: Exam;
  isFullscreen: boolean;
  onEnterFullscreen: () => Promise<boolean>;
  onComplete: () => void;
  onCancel: () => void;
  initialSeconds?: number;
}

export const PreExamCountdownModal: React.FC<PreExamCountdownModalProps> = ({
  isOpen,
  exam,
  isFullscreen,
  onEnterFullscreen,
  onComplete,
  onCancel,
  initialSeconds = 30,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
      setHasStarted(false);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen) return;

    if (secondsLeft <= 0) {
      if (!hasStarted) {
        setHasStarted(true);
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsLeft, hasStarted, onComplete]);

  if (!isOpen) return null;

  // Calculate SVG circular progress values (radius = 56, circumference = 2 * PI * 56 ≈ 351.86)
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsLeft / initialSeconds));
  const strokeDashoffset = circumference - progress * circumference;
  const isUrgent = secondsLeft <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 overflow-hidden flex flex-col items-center text-center space-y-6">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>Exam Starting Preparation</span>
        </div>

        {/* Exam Title & Details */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {exam.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Please prepare your workspace. Your secure exam session is launching automatically.
          </p>
        </div>

        {/* Circular 30-Second Countdown Display */}
        <div className="relative flex items-center justify-center my-2">
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className={`transition-all duration-1000 ease-linear ${
                isUrgent ? 'stroke-rose-500' : 'stroke-indigo-500'
              }`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Countdown Number */}
          <div className="absolute flex flex-col items-center justify-center">
            <span
              className={`text-4xl font-extrabold font-mono transition-transform duration-300 ${
                isUrgent ? 'text-rose-400 scale-110 animate-pulse' : 'text-indigo-200'
              }`}
            >
              {secondsLeft}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              seconds
            </span>
          </div>
        </div>

        {/* Fullscreen & Integrity Status Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Fullscreen Status */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
              isFullscreen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span className="text-lg">{isFullscreen ? '🖥️' : '⚠️'}</span>
              <div>
                <div className="text-xs font-bold">
                  {isFullscreen ? 'Full Screen Enabled' : 'Full Screen Required'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isFullscreen
                    ? 'Browser locked to full screen'
                    : 'Click to engage full screen'}
                </div>
              </div>
            </div>
            {!isFullscreen && (
              <button
                type="button"
                onClick={onEnterFullscreen}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition-colors"
              >
                Engage
              </button>
            )}
          </div>

          {/* Secure Session Status */}
          <div className="p-3.5 rounded-2xl border bg-slate-800/60 border-slate-700/60 text-slate-200 flex items-center space-x-2.5">
            <span className="text-lg">🔒</span>
            <div>
              <div className="text-xs font-bold">Integrity Guard Ready</div>
              <div className="text-[11px] text-slate-400">
                Tab & focus tracking armed
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Brief */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1.5 text-left">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold">
            <span>ℹ️</span>
            <span>Important reminders before the timer completes:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400 pl-1">
            <li>Do not close or minimize the browser window.</li>
            <li>Exiting full screen or switching tabs will trigger an alert.</li>
            <li>Answers will be saved automatically throughout your test.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="w-full flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel & Exit
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!isFullscreen) {
                await onEnterFullscreen();
              }
              onComplete();
            }}
            className="flex-1 py-2.5 px-5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>Start Now ({secondsLeft}s)</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
