'use client';

import React, { useState } from 'react';
import { IntegrityFlag, ExamIntegritySummary, FlagType } from '@exam-platform/shared-types';

interface IntegrityAlertsProps {
  summary?: ExamIntegritySummary | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const IntegrityAlerts: React.FC<IntegrityAlertsProps> = ({
  summary,
  isLoading = false,
  onRefresh,
}) => {
  const [selectedType, setSelectedType] = useState<FlagType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const flags = summary?.recentFlags || [];

  const filteredFlags = flags.filter((f) => {
    const matchType = selectedType === 'ALL' || f.flagType === selectedType;
    const matchSearch =
      !searchTerm ||
      (f.studentName && f.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.studentEmail && f.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchType && matchSearch;
  });

  const getFlagBadge = (type: FlagType) => {
    switch (type) {
      case 'TAB_SWITCH':
        return {
          label: 'Tab Switch',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: '🔄',
        };
      case 'RAPID_GUESS':
        return {
          label: 'Rapid Guess',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: '⚡',
        };
      case 'TIME_ANOMALY':
        return {
          label: 'Time Anomaly',
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: '⏱️',
        };
      case 'SIMILARITY_MATCH':
        return {
          label: 'Similarity Match',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: '🔍',
        };
      default:
        return {
          label: type,
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: '⚠️',
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            🛡️
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Anti-Cheating & Integrity Alerts</span>
              {summary && summary.totalFlags > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold">
                  {summary.totalFlags} flagged
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live monitoring of tab navigation, unordinary time intervals, and browser blur incidents.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
            >
              <span className={isLoading ? 'animate-spin' : ''}>↻</span>
              <span>Sync Flags</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Flagged Events
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary?.totalFlags ?? 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Flagged Students
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {summary?.flaggedStudentsCount ?? 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Tab Switches
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {summary?.flagsByType?.TAB_SWITCH ?? 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Anomalies / Rapid
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {(summary?.flagsByType?.RAPID_GUESS ?? 0) + (summary?.flagsByType?.TIME_ANOMALY ?? 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1 rounded-xl transition-all font-medium ${
              selectedType === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Types ({flags.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('TAB_SWITCH')}
            className={`px-3 py-1 rounded-xl transition-all font-medium ${
              selectedType === 'TAB_SWITCH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Tab Switches ({summary?.flagsByType?.TAB_SWITCH ?? 0})
          </button>
        </div>

        <div className="max-w-xs w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or email..."
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Flagged Events List */}
      <div className="px-6 pb-6">
        {isLoading && flags.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading integrity logs...
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <div className="text-xl mb-1">✅</div>
            No integrity violations or tab switches detected.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredFlags.map((flag) => {
              const badge = getFlagBadge(flag.flagType);
              const date = new Date(flag.createdAt);

              return (
                <div
                  key={flag.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{badge.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-100 text-xs">
                          {flag.studentName || 'Student'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({flag.studentEmail || flag.studentId})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{date.toLocaleDateString()}</span>
                        {flag.details && flag.details.switchCount && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400 font-semibold">
                              Switch #{flag.details.switchCount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrityAlerts;
