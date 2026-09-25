'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../store/authStore';
import { Header } from '../../../../components/common/Header';
import { useScheduledCountdown } from '../../../../hooks/useScheduledCountdown';
import { useFullscreen } from '../../../../hooks/useFullscreen';
import { PreExamCountdownModal } from '../../../../components/exam/PreExamCountdownModal';
import { api } from '../../../../lib/apiClient';
import { Exam } from '@exam-platform/shared-types';

export default function ExamInstructionsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const [exam, setExam] = useState<Exam | null>(null);
  const [isExamLoading, setIsExamLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      try {
        setIsExamLoading(true);
        const data = await api.exams.findOne(examId);
        setExam(data);
      } catch (err: any) {
        console.error('Failed to load exam instructions:', err);
        setError('Unable to load exam details. Please try again.');
      } finally {
        setIsExamLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchExam();
    }
  }, [examId, isAuthenticated]);

  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [showCountdown, setShowCountdown] = useState(false);

  const { isLocked, formattedCountdown } = useScheduledCountdown({
    startTime: exam?.startTime,
  });

  const handleInitiateExam = async () => {
    if (!agreementChecked || isStarting || isLocked) return;
    setError(null);
    // Request fullscreen upon user gesture
    await enterFullscreen();
    // Open 30-second preparation countdown window
    setShowCountdown(true);
  };

  const handleConfirmStartExam = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);

    try {
      // Ensure full screen is engaged
      if (!isFullscreen) {
        await enterFullscreen();
      }
      // Start or resume attempt via backend
      await api.attempts.start({ examId });
      router.push(`/exam/${examId}/take`);
    } catch (err: any) {
      console.error('Failed to start exam:', err);
      const msg = err.response?.data?.message || 'Failed to start examination. Please try again.';
      setError(msg);
      setIsStarting(false);
      setShowCountdown(false);
    }
  };

  const handleCancelCountdown = () => {
    setShowCountdown(false);
    setIsStarting(false);
  };

  if (isLoading || isExamLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-xl font-bold">Exam Not Found</h2>
          <p className="text-sm text-slate-400">
            The examination you requested could not be located or may no longer be published.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4"
          >
            <span>&larr; Back to Dashboard</span>
          </Link>
          <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Exam Instructions
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            {exam.title}
          </h1>
        </div>

        {/* Scheduled Start Time Alert Banner */}
        {isLocked && (
          <div className="p-5 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  Scheduled Examination
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  This test is set to open at{' '}
                  <strong className="text-amber-200">
                    {new Date(exam.startTime!).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({new Date(exam.startTime!).toLocaleDateString()})
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl px-4 py-2 text-center self-start sm:self-auto">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                Opens In
              </span>
              <span className="text-lg font-mono font-extrabold text-amber-300">
                {formattedCountdown}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Quick Specs Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Duration
            </span>
            <div className="text-base sm:text-lg font-bold text-indigo-400 mt-0.5">
              {exam.durationMinutes} Minutes
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Questions
            </span>
            <div className="text-base sm:text-lg font-bold text-slate-200 mt-0.5">
              {(exam as any).questions?.length ?? 'Standard'} Questions
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Format
            </span>
            <div className="text-base sm:text-lg font-bold text-slate-200 mt-0.5">
              Multiple Choice (MCQ)
            </div>
          </div>
        </div>

        {/* Description & Rules */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-sm">
          {exam.description && (
            <div className="space-y-2 pb-6 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Exam Overview
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {exam.description}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Rules & Guidelines
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  1
                </span>
                <span>
                  <strong>Timed Session:</strong> Once started, the timer runs continuously. It will not pause if you refresh or leave the tab.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  2
                </span>
                <span>
                  <strong>Automatic Progress Saving:</strong> Answers are automatically synchronized to the cloud in real-time.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  3
                </span>
                <span>
                  <strong>Academic Integrity:</strong> Stay in the test window. Leaving or switching browser tabs may be logged.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  4
                </span>
                <span>
                  <strong>Evaluation:</strong> Upon final submission, your responses are sealed and delivered to your instructor for evaluation.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs sm:text-sm text-slate-300 group-hover:text-slate-100 transition-colors select-none">
                I have read, understood, and agreed to the examination rules.
              </span>
            </label>
          </div>
        </div>

        {/* CTA Action */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!agreementChecked || isStarting || isLocked}
            onClick={handleInitiateExam}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Launching Exam...</span>
              </>
            ) : isLocked ? (
              <span>Locked (Opens in {formattedCountdown})</span>
            ) : (
              <span>Begin Examination &rarr;</span>
            )}
          </button>
        </div>
      </main>

      {/* 30-Second Pre-Exam Countdown & Fullscreen Modal */}
      {exam && (
        <PreExamCountdownModal
          isOpen={showCountdown}
          exam={exam}
          isFullscreen={isFullscreen}
          onEnterFullscreen={enterFullscreen}
          onComplete={handleConfirmStartExam}
          onCancel={handleCancelCountdown}
          initialSeconds={30}
        />
      )}
    </div>
  );
}
