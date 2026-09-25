'use client';

import React from 'react';
import { LiveMonitorStats } from '@exam-platform/shared-types';

interface LiveStatsProps {
  stats: LiveMonitorStats | null;
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  isRefreshing: boolean;
  isPaused: boolean;
  secondsUntilNextPoll: number;
  lastPolledAt: Date | null;
  onRefresh: () => void;
  onTogglePause: () => void;
}

export const LiveStats: React.FC<LiveStatsProps> = ({
  stats,
  durationMinutes,
  totalQuestions,
  totalPoints,
  isRefreshing,
  isPaused,
  secondsUntilNextPoll,
  lastPolledAt,
  onRefresh,
  onTogglePause,
}) => {
  const activeCount = stats?.activeCount ?? 0;
  const submittedCount = stats?.submittedCount ?? 0;
  const flaggedCount = stats?.flaggedCount ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const averageScore = stats?.averageScore ?? null;
  const averageProgress = stats?.averageProgressPercent ?? 0;

  const formatLastPolled = (date: Date | null) => {
    if (!date) return 'Waiting for first sync...';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Live Polling Status & Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {!isPaused ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            )}
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {!isPaused ? 'Live Monitor Active' : 'Polling Paused'}
            </span>
          </div>

          <div className="hidden md:block h-4 w-px bg-slate-700" />

          <div className="text-xs text-slate-400">
            {!isPaused ? (
              <span>
                Auto-syncing every 20s &bull; Next update in{' '}
                <strong className="text-indigo-400 font-mono">{secondsUntilNextPoll}s</strong>
              </span>
            ) : (
              <span className="text-amber-400/90 font-medium">Automatic updates paused</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 text-[11px] hidden lg:inline mr-2">
            Last synced: <span className="font-mono text-slate-300">{formatLastPolled(lastPolledAt)}</span>
          </span>

          <button
            type="button"
            onClick={onTogglePause}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            {isPaused ? '▶ Resume Polling' : '⏸ Pause'}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
          >
            {isRefreshing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <span>↻</span>
                <span>Sync Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Cohort Attended */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Students
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {totalStudents}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500">
            {durationMinutes}m test window
          </div>
        </div>

        {/* Live Active in-progress */}
        <div className="bg-gradient-to-br from-amber-500/10 to-slate-900/90 border border-amber-500/20 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Currently Active
            </span>
            {activeCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
            {activeCount}
          </div>
          <div className="mt-1.5 text-[11px] text-amber-400/80">
            In progress now
          </div>
        </div>

        {/* Submissions Completed */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/90 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Submitted
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {submittedCount}
          </div>
          <div className="mt-1.5 text-[11px] text-emerald-400/80">
            {totalStudents > 0 ? `${Math.round((submittedCount / totalStudents) * 100)}% finalized` : 'Completed tests'}
          </div>
        </div>

        {/* Flagged Integrity Alerts */}
        <div className="bg-gradient-to-br from-rose-500/10 to-slate-900/90 border border-rose-500/20 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
              Flagged Students
            </span>
            {flaggedCount > 0 && (
              <span className="text-xs">⚠️</span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
            {flaggedCount}
          </div>
          <div className="mt-1.5 text-[11px] text-rose-400/80">
            {flaggedCount > 0 ? 'Review alerts below' : 'Clean session'}
          </div>
        </div>

        {/* Cohort Average Score & Progress */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Avg Score / Progress
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
            {averageScore !== null ? `${averageScore} pts` : `${averageProgress}%`}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            {averageScore !== null
              ? `Out of ${totalPoints} pts`
              : `Overall cohort progress`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
