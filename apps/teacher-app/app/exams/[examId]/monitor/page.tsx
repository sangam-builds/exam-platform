'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../components/common/Header';
import { Card, Button, Badge } from '@exam-platform/ui';
import { api, getStoredUser } from '../../../../lib/apiClient';
import { ExamAttendanceResponse } from '@exam-platform/shared-types';

export default function ExamMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const [data, setData] = useState<ExamAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAttendance = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const res = await api.attempts.getExamAttendance(examId);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
      setError(err.response?.data?.message || 'Failed to load student attendance roster.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadAttendance();
  }, [router, loadAttendance]);

  const filteredStudents = data?.students.filter((s) => {
    const matchName = s.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmail = s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchEmail;
  }) || [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 mb-2"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{data?.exam.title || 'Exam Attendance & Results'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live tracking of student attendance, session start/end timestamps, and score performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadAttendance}
              isLoading={loading}
              className="text-xs h-10"
            >
              ↻ Refresh Live Data
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/exams/${examId}/edit`)}
              className="text-xs h-10 font-semibold"
            >
              ✏️ Edit Assessment
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Total Students Attended
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.totalAttended ?? 0}
            </div>
            <div className="mt-2 text-xs text-slate-500">Distinct student attempts</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Completed / Submitted
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {data?.submittedCount ?? 0}
            </div>
            <div className="mt-2 text-xs text-slate-500">Finalized examinations</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              In Progress
            </div>
            <div className="text-3xl font-extrabold text-amber-400">
              {data?.inProgressCount ?? 0}
            </div>
            <div className="mt-2 text-xs text-slate-500">Currently taking the test</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Average Score
            </div>
            <div className="text-3xl font-extrabold text-indigo-400">
              {data?.averageScore !== null && data?.averageScore !== undefined
                ? `${data.averageScore} pts`
                : '—'}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Out of {data?.exam.totalPoints ?? 0} total points
            </div>
          </Card>
        </div>

        {/* Attendance & Timestamps Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Student Attendance & Session Log</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each attendee&apos;s start time, submission time, duration, and score breakdown.
              </p>
            </div>
            <div className="max-w-xs w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by student name or email..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Loading student attendance...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
                👥
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No students attended yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When students start and complete this exam, their attendance records, start timestamps, and end timestamps will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Start Time</th>
                    <th className="p-4">End Time</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Answers</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Score / Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                  {filteredStudents.map((s) => {
                    const startDate = new Date(s.startedAt);
                    const endDate = s.submittedAt ? new Date(s.submittedAt) : null;
                    const isCompleted = s.status === 'SUBMITTED' || s.status === 'GRADED';

                    return (
                      <tr key={s.attemptId} className="hover:bg-slate-800/30 transition-colors">
                        {/* Student Name & Email */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-100">{s.studentName}</div>
                          <div className="text-[11px] text-slate-400">{s.studentEmail}</div>
                        </td>

                        {/* Start Time */}
                        <td className="p-4 font-mono">
                          <div className="text-slate-200">
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {startDate.toLocaleDateString()}
                          </div>
                        </td>

                        {/* End Time */}
                        <td className="p-4 font-mono">
                          {endDate ? (
                            <>
                              <div className="text-slate-200">
                                {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {endDate.toLocaleDateString()}
                              </div>
                            </>
                          ) : (
                            <span className="text-amber-400 text-xs italic">In Progress</span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="p-4 text-slate-300 font-mono">
                          {endDate
                            ? formatDuration(Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000)))
                            : formatDuration(s.timeSpentSeconds)}
                        </td>

                        {/* Questions Answered */}
                        <td className="p-4 text-slate-300">
                          <span className="font-semibold text-slate-100">{s.answeredCount}</span> / {s.totalQuestions}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {isCompleted ? (
                            <Badge variant="success" size="sm">
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              In Progress
                            </Badge>
                          )}
                        </td>

                        {/* Score (Teacher View) */}
                        <td className="p-4 text-right font-mono">
                          {isCompleted && s.score !== null ? (
                            <div>
                              <span className="font-bold text-emerald-400 text-sm">
                                {s.score} / {s.totalPoints} pts
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1.5 font-sans">
                                ({s.percentage}%)
                              </span>
                            </div>
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
          )}
        </div>
      </main>
    </div>
  );
}
