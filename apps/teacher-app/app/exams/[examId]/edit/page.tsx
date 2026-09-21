'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/common/Header';
import { Card, Button, Badge, Modal, Input } from '@exam-platform/ui';
import QuestionForm from '../../../../components/question-editor/QuestionForm';
import BulkUpload from '../../../../components/question-editor/BulkUpload';
import { api } from '../../../../lib/apiClient';
import { Exam, Question } from '@exam-platform/shared-types';

export default function ExamEditorPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);

  // Metadata form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const [examData, questionsData] = await Promise.all([
        api.exams.getExam(examId),
        api.questions.getQuestionsByExam(examId),
      ]);
      setExam(examData);
      setQuestions(questionsData);
      setTitle(examData.title);
      setDescription(examData.description || '');
      setDurationMinutes(examData.durationMinutes);
      setIsAdaptive(examData.isAdaptive);
    } catch (err) {
      console.error('Failed to load exam editor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  const handleTogglePublish = async () => {
    if (!exam) return;
    try {
      setTogglingPublish(true);
      const updated = await api.exams.togglePublish(exam.id, !exam.isPublished);
      setExam(updated);
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    } finally {
      setTogglingPublish(false);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    try {
      setSavingMeta(true);
      const updated = await api.exams.updateExam(exam.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        isAdaptive,
      });
      setExam(updated);
      setIsEditingMeta(false);
    } catch (err) {
      console.error('Failed to update exam metadata:', err);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.questions.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1.0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading assessment workspace...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Exam Not Found</h2>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation & Status Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <a href="/dashboard" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
              ← Back to Dashboard
            </a>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{exam.title}</h1>
              {exam.isPublished ? (
                <Badge variant="success" size="sm">Published / Live</Badge>
              ) : (
                <Badge variant="warning" size="sm">Draft</Badge>
              )}
              {exam.isAdaptive && (
                <Badge variant="purple" size="sm">Adaptive Engine</Badge>
              )}
            </div>
            {exam.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">{exam.description}</p>
            )}
          </div>

          {/* Exam Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-xs h-9 px-3"
              onClick={() => setIsEditingMeta(true)}
            >
              ⚙️ Settings
            </Button>
            <Button
              variant={exam.isPublished ? 'secondary' : 'primary'}
              className="text-xs h-9 px-4 font-semibold"
              isLoading={togglingPublish}
              onClick={handleTogglePublish}
            >
              {exam.isPublished ? 'Unpublish Exam' : '🚀 Publish Exam'}
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Duration</div>
            <div className="text-xl font-bold text-white mt-1">{exam.durationMinutes} min</div>
          </Card>
          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Questions</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">{questions.length}</div>
          </Card>
          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Points</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{totalPoints} pts</div>
          </Card>
          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Modality</div>
            <div className="text-xl font-bold text-white mt-1">{exam.isAdaptive ? 'Adaptive' : 'Fixed Linear'}</div>
          </Card>
        </div>

        {/* Question Bank Manager */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Question Items ({questions.length})</h2>
              <p className="text-xs text-slate-400 mt-0.5">Define single items or import via bulk CSV.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-xs h-9"
                onClick={() => setIsBulkUploadOpen(true)}
              >
                📥 Bulk CSV Import
              </Button>
              <Button
                variant="primary"
                className="text-xs h-9 font-semibold"
                onClick={() => {
                  setEditingQuestion(null);
                  setIsAddQuestionOpen(true);
                }}
              >
                + Add Question
              </Button>
            </div>
          </div>

          {/* Question List */}
          {questions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
                ❓
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No questions added yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                Add multiple choice or subjective questions to build this assessment.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" className="text-xs" onClick={() => setIsBulkUploadOpen(true)}>
                  Upload CSV
                </Button>
                <Button variant="primary" className="text-xs" onClick={() => setIsAddQuestionOpen(true)}>
                  + Add First Question
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-6 hover:bg-slate-800/20 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-white whitespace-pre-wrap">{q.text}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                          <Badge variant={q.type === 'MCQ' ? 'info' : 'purple'} size="sm">
                            {q.type}
                          </Badge>
                          {q.topic && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-indigo-300">
                              🏷️ {q.topic.name}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            q.difficulty === 'EASY'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                              : q.difficulty === 'HARD'
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">
                            ⚖️ {q.points} {q.points === 1 ? 'pt' : 'pts'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        className="text-xs h-7 px-2.5"
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsAddQuestionOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs h-7 px-2 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>

                  {/* Options display for MCQ */}
                  {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                    <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctAnswer === opt;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200 font-medium'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                              isCorrect ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && <span className="ml-auto text-[10px] text-emerald-400 font-semibold">✓ Correct</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rubric display for Subjective */}
                  {q.type === 'SUBJECTIVE' && q.rubric && (
                    <div className="ml-9 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Grading Rubric: </span>
                      {q.rubric}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isAddQuestionOpen}
        onClose={() => {
          setIsAddQuestionOpen(false);
          setEditingQuestion(null);
        }}
        title={editingQuestion ? 'Edit Question Item' : 'Add New Question'}
      >
        <QuestionForm
          examId={examId}
          initialData={editingQuestion || undefined}
          onSuccess={(saved) => {
            if (editingQuestion) {
              setQuestions((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
            } else {
              setQuestions((prev) => [...prev, saved]);
            }
            setIsAddQuestionOpen(false);
            setEditingQuestion(null);
          }}
          onCancel={() => {
            setIsAddQuestionOpen(false);
            setEditingQuestion(null);
          }}
        />
      </Modal>

      {/* Bulk CSV Upload Modal */}
      <Modal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        title="Bulk Import Questions"
      >
        <BulkUpload
          examId={examId}
          onSuccess={() => {
            setIsBulkUploadOpen(false);
            loadExamData();
          }}
          onCancel={() => setIsBulkUploadOpen(false)}
        />
      </Modal>

      {/* Exam Settings Modal */}
      <Modal
        isOpen={isEditingMeta}
        onClose={() => setIsEditingMeta(false)}
        title="Assessment Settings"
      >
        <form onSubmit={handleSaveMeta} className="space-y-4">
          <Input
            label="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Input
            label="Duration (Minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="adaptiveCheck"
              checked={isAdaptive}
              onChange={(e) => setIsAdaptive(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
            <label htmlFor="adaptiveCheck" className="text-xs font-medium text-slate-300 cursor-pointer">
              Enable Adaptive Difficulty Engine
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsEditingMeta(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingMeta}>
              Save Settings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
