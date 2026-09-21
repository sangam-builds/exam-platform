'use client';

import React, { useState, useRef } from 'react';
import {
  Question,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionType,
  DifficultyLevel,
} from '@exam-platform/shared-types';
import { Button, Input } from '@exam-platform/ui';
import TopicTagSelector from './TopicTagSelector';
import DifficultySelector from './DifficultySelector';
import { api } from '../../lib/apiClient';

export interface QuestionFormProps {
  examId: string;
  initialData?: Question;
  onSuccess: (question: Question) => void;
  onCancel: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  examId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [type, setType] = useState<QuestionType>(initialData?.type || 'MCQ');
  const [options, setOptions] = useState<string[]>(
    initialData?.options && initialData.options.length > 0
      ? initialData.options
      : ['', '', '', '']
  );
  const [correctAnswer, setCorrectAnswer] = useState<string>(initialData?.correctAnswer || '');
  const [rubric, setRubric] = useState<string>(initialData?.rubric || '');
  const [topicId, setTopicId] = useState<string | undefined>(initialData?.topicId || undefined);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialData?.difficulty || 'MEDIUM');
  const [points, setPoints] = useState<number>(initialData?.points || 1.0);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const optToRemove = options[index];
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctAnswer === optToRemove) {
      setCorrectAnswer('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.uploads.uploadImage(file);
      setText((prev) => `${prev}\n\n![Image](${res.url})\n`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please enter question text');
      return;
    }

    if (type === 'MCQ') {
      const validOptions = options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError('MCQ questions require at least 2 non-empty options');
        return;
      }
      if (!correctAnswer) {
        setError('Please select or specify the correct answer option');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let saved: Question;
      if (initialData) {
        saved = await api.questions.updateQuestion(initialData.id, {
          text: text.trim(),
          type,
          options: type === 'MCQ' ? options.map((o) => o.trim()).filter(Boolean) : undefined,
          correctAnswer: type === 'MCQ' ? correctAnswer : undefined,
          rubric: type === 'SUBJECTIVE' ? rubric.trim() : undefined,
          topicId,
          difficulty,
          points,
        });
      } else {
        saved = await api.questions.createQuestion({
          examId,
          text: text.trim(),
          type,
          options: type === 'MCQ' ? options.map((o) => o.trim()).filter(Boolean) : undefined,
          correctAnswer: type === 'MCQ' ? correctAnswer : undefined,
          rubric: type === 'SUBJECTIVE' ? rubric.trim() : undefined,
          topicId,
          difficulty,
          points,
        });
      }
      onSuccess(saved);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Question Type Toggle */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Question Format</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('MCQ')}
            className={`p-3 rounded-lg border text-left transition-all ${
              type === 'MCQ'
                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-xs text-white">Multiple Choice (MCQ)</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Fixed options with auto-scoring</p>
          </button>

          <button
            type="button"
            onClick={() => setType('SUBJECTIVE')}
            className={`p-3 rounded-lg border text-left transition-all ${
              type === 'SUBJECTIVE'
                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-xs text-white">Subjective / Essay</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Open text answer with AI rubric grading</p>
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-300">Question Content</label>
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              {uploadingImage ? 'Uploading Image...' : '🖼️ Attach Image'}
            </button>
          </div>
        </div>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your question statement here..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* MCQ Options */}
      {type === 'MCQ' ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Answer Options & Correct Answer</label>
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              + Add Choice
            </button>
          </div>

          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswerRadio"
                  checked={correctAnswer === opt && opt.trim() !== ''}
                  onChange={() => setCorrectAnswer(opt)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900 cursor-pointer"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-xs text-slate-500 hover:text-rose-400 px-1"
                    title="Remove choice"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Select the radio button next to the choice that is correct.
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Grading Rubric / Criteria (For AI Assisted Evaluation)
          </label>
          <textarea
            rows={2}
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            placeholder="Key concepts, keywords, or points required in the candidate's explanation..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Metadata: Topic & Difficulty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TopicTagSelector selectedTopicId={topicId} onChange={setTopicId} />
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
      </div>

      {/* Points */}
      <div className="w-32">
        <Input
          label="Points / Weight"
          type="number"
          step="0.5"
          min="0.5"
          value={points}
          onChange={(e) => setPoints(parseFloat(e.target.value) || 1.0)}
          className="text-xs h-9"
          required
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" isLoading={loading}>
          {initialData ? 'Update Question' : 'Save Question'}
        </Button>
      </div>
    </form>
  );
};

export default QuestionForm;
