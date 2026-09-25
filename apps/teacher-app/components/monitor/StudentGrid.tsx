'use client';

import React, { useState } from 'react';
import { LiveStudentStatus } from '@exam-platform/shared-types';
import { Badge } from '@exam-platform/ui';

interface StudentGridProps {
  students: LiveStudentStatus[];
  totalQuestions: number;
  totalPoints: number;
  examDurationMinutes: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: 'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'FLAGGED';
  onStatusFilterChange: (filter: 'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'FLAGGED') => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  totalQuestions,
  totalPoints,
  examDurationMinutes,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<LiveStudentStatus | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'IN_PROGRESS') return s.status === 'IN_PROGRESS';
    if (statusFilter === 'SUBMITTED') return s.status === 'SUBMITTED' || s.status === 'GRADED';
    if (statusFilter === 'FLAGGED') return s.isFlagged;
    return true;
  });

  const countInProgress = students.filter((s) => s.status === 'IN_PROGRESS').length;
  const countSubmitted = students.filter((s) => s.status === 'SUBMITTED' || s.status === 'GRADED').length;
  const countFlagged = students.filter((s) => s.isFlagged).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatTimeAgo = (isoString?: string | null) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Layout Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Students ({students.length})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Active ({countInProgress})</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('SUBMITTED')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'SUBMITTED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Submitted ({countSubmitted})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('FLAGGED')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
              statusFilter === 'FLAGGED'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>Flagged</span>
            {countFlagged > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-[10px] font-bold">
                {countFlagged}
              </span>
            )}
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search student name or email..."
              className="w-full px-3 py-1.5 pl-8 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Display */}
      {filteredStudents.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
            👥
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No students match current filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter tags above.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const isCompleted = student.status === 'SUBMITTED' || student.status === 'GRADED';
            const isActive = student.status === 'IN_PROGRESS';

            return (
              <div
                key={student.studentId}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all shadow-md hover:shadow-indigo-950/30 ${
                  student.isFlagged
                    ? 'border-rose-500/40 hover:border-rose-500/60'
                    : isActive
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Student Info & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
                      {student.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {student.studentName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {student.studentEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {isActive ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>In Progress</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-medium">
                        Not Started
                      </span>
                    )}

                    {student.isFlagged && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForModal(student)}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold hover:bg-rose-500/30 transition-colors"
                      >
                        <span>⚠️ {student.flagsCount} Flag{student.flagsCount > 1 ? 's' : ''}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Answered Count */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      Progress: <strong className="text-slate-200">{student.answeredCount}</strong> / {student.totalQuestions} Questions
                    </span>
                    <span className="font-bold text-indigo-400">{student.progressPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : student.isFlagged
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${student.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Row: Time Spent & Score */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Time Elapsed
                    </span>
                    <span className="font-mono text-slate-300 font-medium">
                      {formatDuration(student.timeSpentSeconds)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      {isCompleted ? 'Final Score' : 'Last Synced'}
                    </span>
                    {isCompleted && student.score !== null ? (
                      <span className="font-bold text-emerald-400 font-mono">
                        {student.score} / {student.totalPoints} pts ({student.percentage}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatTimeAgo(student.lastActivityAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Time Spent</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4">Integrity</th>
                  <th className="p-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredStudents.map((s) => {
                  const isCompleted = s.status === 'SUBMITTED' || s.status === 'GRADED';
                  const isActive = s.status === 'IN_PROGRESS';

                  return (
                    <tr key={s.studentId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{s.studentName}</div>
                        <div className="text-[11px] text-slate-400">{s.studentEmail}</div>
                      </td>

                      <td className="p-4">
                        {isActive ? (
                          <Badge variant="warning" size="sm">
                            In Progress
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="success" size="sm">
                            Submitted
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Not Started
                          </Badge>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-200">
                            {s.answeredCount}/{s.totalQuestions}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({s.progressPercentage}%)
                          </span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {formatDuration(s.timeSpentSeconds)}
                      </td>

                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {formatTimeAgo(s.lastActivityAt)}
                      </td>

                      <td className="p-4">
                        {s.isFlagged ? (
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForModal(s)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold hover:bg-rose-500/30 transition-colors"
                          >
                            <span>⚠️ {s.flagsCount} Alert{s.flagsCount > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs">✓ Clean</span>
                        )}
                      </td>

                      <td className="p-4 text-right font-mono">
                        {isCompleted && s.score !== null ? (
                          <span className="font-bold text-emerald-400">
                            {s.score} / {s.totalPoints} pts
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Flags Quick Inspection Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Integrity Alerts: {selectedStudentForModal.studentName}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedStudentForModal.studentEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedStudentForModal.recentFlags.map((flag, idx) => (
                <div
                  key={flag.id || idx}
                  className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                      {flag.flagType}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(flag.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {flag.details && (
                    <p className="text-slate-300 text-[11px]">
                      {typeof flag.details === 'object'
                        ? JSON.stringify(flag.details, null, 2)
                        : String(flag.details)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGrid;
