'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/common/Header';
import { api } from '../../lib/apiClient';
import { Exam, Attempt } from '@exam-platform/shared-types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      const [examsList, attemptsList] = await Promise.all([
        api.exams.getExams({ isPublished: true }),
        api.attempts.getMyAttempts().catch(() => []),
      ]);
      setExams(examsList);
      setAttempts(attemptsList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const attemptMap = new Map(attempts.map((a) => [a.examId, a]));
  const now = new Date();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Card */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-violet-900/30 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Welcome back
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Hello, {user?.name}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Review your scheduled tests, take assigned examinations, and check your submission statuses below.
            </p>
          </div>
        </div>

        {/* Available Exams Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Available Examinations
              </h2>
              <p className="text-xs text-slate-400">
                Published exams assigned to your class
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors text-xs flex items-center space-x-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {isDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 h-48 animate-pulse"
                />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                No Published Exams
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your teachers have not published any exams yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => {
                const attempt = attemptMap.get(exam.id);
                const isCompleted =
                  attempt &&
                  (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED');
                const isInProgress = attempt && attempt.status === 'IN_PROGRESS';
                const isScheduledFuture =
                  Boolean(exam.startTime && now < new Date(exam.startTime));

                return (
                  <div
                    key={exam.id}
                    className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 group backdrop-blur-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
                          {exam.durationMinutes} mins
                        </span>

                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full">
                            Submitted
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold rounded-full animate-pulse">
                            In Progress
                          </span>
                        ) : isScheduledFuture ? (
                          <span className="px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-semibold rounded-full">
                            Scheduled ({new Date(exam.startTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-[11px] font-medium rounded-full">
                            Ready
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {exam.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {exam.description || 'Standard timed examination.'}
                      </p>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-800/80">
                      {isCompleted ? (
                        <Link
                          href={`/exam/${exam.id}/result`}
                          className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                        >
                          View Submission
                        </Link>
                      ) : isInProgress ? (
                        <Link
                          href={`/exam/${exam.id}/take`}
                          className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/20 transition-all"
                        >
                          Resume Exam
                        </Link>
                      ) : (
                        <Link
                          href={`/exam/${exam.id}/instructions`}
                          className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                        >
                          {isScheduledFuture ? 'View Schedule & Rules' : 'Start Exam'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Attempt History Section */}
        {attempts.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">
              Exam History
            </h2>
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Exam</th>
                      <th className="p-4">Date Taken</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                    {attempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-semibold text-slate-100">
                          {(att as any).examTitle || 'Exam Attempt'}
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(att.startedAt).toLocaleDateString()} at{' '}
                          {new Date(att.startedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              att.status === 'SUBMITTED' || att.status === 'GRADED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {att.status === 'SUBMITTED' || att.status === 'GRADED'
                              ? 'Submitted'
                              : 'In Progress'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/exam/${att.examId}/result`}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
