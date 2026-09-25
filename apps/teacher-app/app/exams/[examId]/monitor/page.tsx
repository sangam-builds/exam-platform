'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../components/common/Header';
import { Button } from '@exam-platform/ui';
import { api, getStoredUser } from '../../../../lib/apiClient';
import { LiveExamMonitorResponse, ExamIntegritySummary } from '@exam-platform/shared-types';
import { usePolling } from '../../../../hooks/usePolling';
import LiveStats from '../../../../components/monitor/LiveStats';
import StudentGrid from '../../../../components/monitor/StudentGrid';
import IntegrityAlerts from '../../../../components/monitor/IntegrityAlerts';

export default function ExamMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const [integrityData, setIntegrityData] = useState<ExamIntegritySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'FLAGGED'>('ALL');
  const [activeTab, setActiveTab] = useState<'live-grid' | 'integrity-log'>('live-grid');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const fetchLiveMonitorData = useCallback(async (): Promise<LiveExamMonitorResponse> => {
    if (!examId) throw new Error('Exam ID is required');

    const [monitorRes, integrityRes] = await Promise.all([
      api.dashboard.getExamLiveMonitor(examId),
      api.integrity.getExamFlags(examId).catch(() => null),
    ]);

    if (integrityRes) {
      setIntegrityData(integrityRes);
    }
    return monitorRes;
  }, [examId]);

  const {
    data,
    isLoading,
    isRefreshing,
    error,
    lastPolledAt,
    isPaused,
    secondsUntilNextPoll,
    refresh,
    togglePause,
  } = usePolling<LiveExamMonitorResponse>({
    fetcher: fetchLiveMonitorData,
    intervalMs: 20000,
    enabled: !!examId,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
              <span>{data?.exam.title || 'Live Assessment Monitor'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live proctoring stream &bull; Real-time student progress, submission scoring, and anti-cheating signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={refresh}
              isLoading={isRefreshing}
              className="text-xs h-10"
            >
              ↻ Refresh Now
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
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl">
            {error}
          </div>
        )}

        {/* Live Metrics & Polling Controls */}
        <LiveStats
          stats={data?.stats || null}
          durationMinutes={data?.exam.durationMinutes || 0}
          totalQuestions={data?.exam.totalQuestions || 0}
          totalPoints={data?.exam.totalPoints || 0}
          isRefreshing={isRefreshing}
          isPaused={isPaused}
          secondsUntilNextPoll={secondsUntilNextPoll}
          lastPolledAt={lastPolledAt}
          onRefresh={refresh}
          onTogglePause={togglePause}
        />

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('live-grid')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'live-grid'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            👥 Live Student Grid & Attendance ({data?.students.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrity-log')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'integrity-log'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>🛡️ Integrity & Flagged Alerts</span>
            {(data?.stats.flaggedCount ?? 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 text-[10px] font-bold">
                {data?.stats.flaggedCount}
              </span>
            )}
          </button>
        </div>

        {/* Main Content Areas */}
        {isLoading && !data ? (
          <div className="p-16 text-center text-slate-400">
            <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs uppercase tracking-wider font-semibold">Connecting to live examination monitor...</p>
          </div>
        ) : (
          <>
            {activeTab === 'live-grid' && (
              <StudentGrid
                students={data?.students || []}
                totalQuestions={data?.exam.totalQuestions || 0}
                totalPoints={data?.exam.totalPoints || 0}
                examDurationMinutes={data?.exam.durationMinutes || 0}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            )}

            {activeTab === 'integrity-log' && (
              <IntegrityAlerts
                summary={integrityData}
                isLoading={isRefreshing}
                onRefresh={refresh}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
