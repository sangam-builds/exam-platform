'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/common/Header';
import { Card, Input, Button } from '@exam-platform/ui';
import { api } from '../../../lib/apiClient';

export default function CreateExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an exam title');
      return;
    }

    if (durationMinutes <= 0) {
      setError('Duration must be at least 1 minute');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await api.exams.createExam({
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        isAdaptive,
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      });

      router.push(`/exams/${created.id}/edit`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create exam';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a href="/dashboard" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
            ← Back to Dashboard
          </a>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Create New Assessment</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure examination properties, duration, and testing modality.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-slate-900 border-slate-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Exam Title"
              type="text"
              placeholder="e.g. Midterm Physics: Mechanics & Optics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Description / Student Instructions
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include guidelines, allowed calculators, formulas, or topic coverage notes..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Duration (Minutes)"
                type="number"
                min="1"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                required
              />

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Assessment Mode</label>
                <button
                  type="button"
                  onClick={() => setIsAdaptive(!isAdaptive)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                    isAdaptive
                      ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {isAdaptive ? '⚡ Adaptive Testing Engine' : '📋 Standard Fixed Assessment'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isAdaptive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {isAdaptive ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isAdaptive
                      ? 'Dynamic difficulty adjusting based on student answers.'
                      : 'All students receive questions in identical standard order.'}
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Available From (Optional)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Create Exam & Proceed to Questions →
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
