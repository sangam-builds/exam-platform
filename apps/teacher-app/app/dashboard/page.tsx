'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/common/Header';
import { Card, Button, Badge } from '@exam-platform/ui';
import { api, getStoredUser } from '../../lib/apiClient';
import { Exam } from '@exam-platform/shared-types';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      const data = await api.exams.getExams({
        teacherId: user?.id,
        search: search.trim() || undefined,
      });
      setExams(data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadExams();
  }, [router]);

  const handleTogglePublish = async (exam: Exam) => {
    try {
      setTogglingId(exam.id);
      const updated = await api.exams.togglePublish(exam.id, !exam.isPublished);
      setExams((prev) => prev.map((e) => (e.id === exam.id ? updated : e)));
    } catch (err) {
      console.error('Failed to toggle publish state:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam? All associated questions will be removed.')) {
      return;
    }

    try {
      await api.exams.deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  const totalQuestions = exams.reduce((acc, e) => acc + (e._count?.questions || 0), 0);
  const publishedExams = exams.filter((e) => e.isPublished).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Teacher Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create and manage exams, build question banks, and monitor student assessments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadExams} isLoading={loading} className="text-xs h-10">
              ↻ Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/exams/create')}
              className="h-10 text-xs font-semibold shadow-lg shadow-indigo-600/20"
            >
              + Create New Exam
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Authored Exams
            </div>
            <div className="text-3xl font-extrabold text-white">{exams.length}</div>
            <div className="mt-2 text-xs text-slate-500">Total assessments in your workspace</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Live / Published
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{publishedExams}</div>
            <div className="mt-2 text-xs text-slate-500">Accessible for assigned students</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Total Questions
            </div>
            <div className="text-3xl font-extrabold text-indigo-400">{totalQuestions}</div>
            <div className="mt-2 text-xs text-slate-500">MCQ and Subjective items authored</div>
          </Card>
        </div>

        {/* Exams Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-white">Your Assessments</h2>
            <div className="max-w-xs w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadExams()}
                placeholder="Search exams..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs">Loading authored exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
                📝
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No exams created yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                Get started by creating your first assessment with custom questions, topics, and difficulty tags.
              </p>
              <Button variant="primary" onClick={() => router.push('/exams/create')} className="text-xs">
                Create First Exam
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-6 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white hover:text-indigo-400 cursor-pointer" onClick={() => router.push(`/exams/${exam.id}/edit`)}>
                        {exam.title}
                      </h3>
                      {exam.isPublished ? (
                        <Badge variant="success" size="sm">Live / Published</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Draft</Badge>
                      )}
                      {exam.isAdaptive && (
                        <Badge variant="purple" size="sm">Adaptive Engine</Badge>
                      )}
                    </div>
                    {exam.description && (
                      <p className="text-xs text-slate-400 max-w-2xl line-clamp-1">
                        {exam.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>⏱️ {exam.durationMinutes} minutes</span>
                      <span>❓ {exam._count?.questions || 0} questions</span>
                      <span>📅 Created {new Date(exam.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      className="text-xs h-8 px-3"
                      onClick={() => router.push(`/exams/${exam.id}/edit`)}
                    >
                      ✏️ Edit / Questions
                    </Button>
                    <Button
                      variant={exam.isPublished ? 'secondary' : 'primary'}
                      className="text-xs h-8 px-3"
                      isLoading={togglingId === exam.id}
                      onClick={() => handleTogglePublish(exam)}
                    >
                      {exam.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="danger"
                      className="text-xs h-8 px-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300"
                      onClick={() => handleDeleteExam(exam.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
