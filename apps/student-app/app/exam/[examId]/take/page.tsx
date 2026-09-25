'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../store/authStore';
import { useExamStore } from '../../../../store/examStore';
import { useAutosave } from '../../../../hooks/useAutosave';
import { useTabSwitchDetection } from '../../../../hooks/useTabSwitchDetection';
import { useFullscreen } from '../../../../hooks/useFullscreen';
import { api } from '../../../../lib/apiClient';
import { Timer } from '../../../../components/exam/Timer';
import { QuestionCard } from '../../../../components/exam/QuestionCard';
import { AnswerOptions } from '../../../../components/exam/AnswerOptions';
import { ProgressBar } from '../../../../components/exam/ProgressBar';
import { QuestionPalette } from '../../../../components/exam/QuestionPalette';
import { SubmitConfirmModal } from '../../../../components/exam/SubmitConfirmModal';

export default function ExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const { isAuthenticated, isLoading: isAuthLoading, initialize } = useAuthStore();

  const {
    exam,
    attempt,
    questions,
    currentIndex,
    answers,
    saveStatus,
    setAttemptData,
    selectOption,
    setTextAnswer,
    toggleFlag,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    incrementTimeSpent,
    resetExam,
  } = useExamStore();

  // Run autosave engine
  useAutosave();

  // Anti-cheating: Tab switch detection
  const { tabSwitchCount, isWarningOpen: isTabWarningOpen, dismissWarning: dismissTabWarning } = useTabSwitchDetection({
    attemptId: attempt?.id || null,
    enabled: !!attempt && attempt.status === 'IN_PROGRESS',
  });

  // Fullscreen mode management
  const { isFullscreen, enterFullscreen } = useFullscreen();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Load or resume attempt
  useEffect(() => {
    const initExamAttempt = async () => {
      if (!examId) return;
      try {
        setIsLoading(true);
        const data = await api.attempts.start({ examId });

        if (data.attempt.status === 'SUBMITTED' || data.attempt.status === 'GRADED') {
          router.push(`/exam/${examId}/result`);
          return;
        }

        setAttemptData(data);
      } catch (err: any) {
        console.error('Failed to initialize exam:', err);
        setError(err.response?.data?.message || 'Failed to load examination.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      initExamAttempt();
    }
  }, [examId, isAuthenticated, router, setAttemptData]);

  // Track time spent per current question
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;

  useEffect(() => {
    if (!currentQuestionId || !attempt || attempt.status !== 'IN_PROGRESS') return;

    const interval = setInterval(() => {
      incrementTimeSpent(currentQuestionId, 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionId, attempt, incrementTimeSpent]);

  // Final Submit Handler
  const handleSubmitConfirm = useCallback(async () => {
    if (!attempt?.id || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Perform submit
      await api.attempts.submit(attempt.id);

      // Reset local store & route to result
      resetExam();
      router.push(`/exam/${examId}/result`);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.response?.data?.message || 'Failed to submit exam. Please try again.');
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }
  }, [attempt, isSubmitting, resetExam, router, examId]);

  // Timer Expiration Handler
  const handleTimerExpire = useCallback(() => {
    handleSubmitConfirm();
  }, [handleSubmitConfirm]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-wider font-semibold">
          Setting up secure examination...
        </span>
      </div>
    );
  }

  if (error || !exam || !attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">Exam Initialization Notice</h2>
          <p className="text-xs text-slate-400">
            {error || 'No questions are available in this exam currently.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedAnswer || a.textAnswer,
  ).length;
  const flaggedCount = Object.values(answers).filter((a) => a.isFlagged).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Exam App Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {exam.title}
              </span>
              <span className="text-[11px] text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Autosave Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400">
              {saveStatus === 'saving' && (
                <span className="flex items-center space-x-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center space-x-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-rose-400">Sync error</span>
              )}
            </div>

            {/* Fullscreen Mode Button */}
            <button
              type="button"
              onClick={enterFullscreen}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isFullscreen
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}
              title={isFullscreen ? 'Full Screen Mode Active' : 'Click to Enter Full Screen'}
            >
              <span>{isFullscreen ? '⛶' : '⚠️'}</span>
              <span className="hidden sm:inline">
                {isFullscreen ? 'Full Screen' : 'Enter Full Screen'}
              </span>
            </button>

            {/* Timer */}
            <Timer
              durationMinutes={exam.durationMinutes}
              startedAt={attempt.startedAt}
              onExpire={handleTimerExpire}
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
            >
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Progress + Question Content + Navigation */}
        <div className="flex-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <ProgressBar
              totalQuestions={questions.length}
              answeredCount={answeredCount}
              flaggedCount={flaggedCount}
            />

            {currentQuestion && (
              <>
                <QuestionCard
                  question={currentQuestion}
                  index={currentIndex}
                  totalQuestions={questions.length}
                  isFlagged={Boolean(currentAnswer?.isFlagged)}
                  onToggleFlag={() => toggleFlag(currentQuestion.id)}
                />

                <AnswerOptions
                  question={currentQuestion}
                  selectedAnswer={currentAnswer?.selectedAnswer ?? null}
                  textAnswer={currentAnswer?.textAnswer ?? null}
                  onSelectOption={(option) =>
                    selectOption(currentQuestion.id, option)
                  }
                  onTextChange={(text) =>
                    setTextAnswer(currentQuestion.id, text)
                  }
                />
              </>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={prevQuestion}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>&larr; Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              {currentAnswer?.selectedAnswer && (
                <button
                  type="button"
                  onClick={() => selectOption(currentQuestion.id, '')}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={nextQuestion}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
              >
                <span>Next Question &rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2"
              >
                <span>Review & Finish</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Palette (Desktop & Drawer) */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectIndex={goToQuestion}
          />
        </div>
      </main>

      {/* Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        isSubmitting={isSubmitting}
        onCancel={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmitConfirm}
      />

      {/* Anti-Cheating: Tab Switch Warning Modal */}
      {isTabWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-center shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Tab Switch Detected</h3>
              <p className="text-xs sm:text-sm text-slate-300">
                You navigated away from your active exam window. This event has been recorded and flagged for your instructor.
              </p>
              <div className="inline-block px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                Recorded Switches: {tabSwitchCount}
              </div>
            </div>
            <button
              type="button"
              onClick={dismissTabWarning}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Required Overlay Modal */}
      {!isFullscreen && attempt && attempt.status === 'IN_PROGRESS' && !isTabWarningOpen && (
        <div className="fixed inset-0 z-45 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-center shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              🖥️
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Full Screen Mode Required</h3>
              <p className="text-xs sm:text-sm text-slate-300">
                To maintain examination integrity, full screen mode must remain active. Please return to full screen to continue your exam.
              </p>
            </div>
            <button
              type="button"
              onClick={enterFullscreen}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
            >
              <span>⛶ Return to Full Screen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
