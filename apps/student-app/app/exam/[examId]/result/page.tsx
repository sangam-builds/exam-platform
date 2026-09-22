'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../store/authStore';
import { Header } from '../../../../components/common/Header';
import { ScoreSummary } from '../../../../components/result/ScoreSummary';
import { api } from '../../../../lib/apiClient';
import { AttemptResult } from '@exam-platform/shared-types';

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const { isAuthenticated, isLoading: isAuthLoading, initialize } = useAuthStore();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchResult = async () => {
      if (!examId) return;
      try {
        setIsLoading(true);
        // Find attempt for this exam
        const attemptDetail = await api.attempts.getAttemptByExam(examId);

        if (!attemptDetail || !attemptDetail.attempt) {
          setError('No completed attempt found for this exam.');
          return;
        }

        const res = await api.attempts.getResult(attemptDetail.attempt.id);
        setResult(res);
      } catch (err: any) {
        console.error('Failed to load exam result:', err);
        setError(err.response?.data?.message || 'Could not load examination result.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchResult();
    }
  }, [examId, isAuthenticated]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Result Unavailable</h2>
          <p className="text-sm text-slate-400">
            {error || 'Your attempt result is not available yet.'}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ScoreSummary result={result} />
      </main>
    </div>
  );
}
