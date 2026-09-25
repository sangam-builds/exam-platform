'use client';

import React, { useState, useRef } from 'react';
import { Button, Card, Badge } from '@exam-platform/ui';
import { CreateQuestionDto } from '@exam-platform/shared-types';
import { api } from '../../lib/apiClient';

export interface BulkUploadProps {
  examId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({
  examId,
  onSuccess,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<Omit<CreateQuestionDto, 'examId'>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setParsing(true);

    try {
      const res = await api.uploads.parseCsv(file);
      setParsedQuestions(res.questions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse CSV file.');
      setParsedQuestions([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      await api.questions.bulkCreateQuestions({
        examId,
        questions: parsedQuestions,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import questions to exam.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">Bulk Import Questions from CSV</h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload a CSV file containing columns: <code className="text-indigo-300">text, type, options, correctAnswer, difficulty, points, rubric</code>.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* File Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="text-2xl mb-2">📄</div>
        <p className="text-sm font-medium text-white">
          {fileName ? fileName : 'Click to select CSV file'}
        </p>
        <p className="text-xs text-slate-500 mt-1">Accepts standard .csv formatted spreadsheets</p>
      </div>

      {parsing && (
        <div className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          Parsing question data...
        </div>
      )}

      {/* Preview Section */}
      {parsedQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              Parsed Questions ({parsedQuestions.length})
            </span>
            <Badge variant="success" size="sm">Valid CSV Structure</Badge>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {parsedQuestions.slice(0, 10).map((q, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-white line-clamp-1">{idx + 1}. {q.text}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Type: <span className="text-slate-200">{q.type}</span> | Diff: <span className="text-slate-200">{q.difficulty}</span> | Pts: <span className="text-slate-200">{q.points}</span>
                  </div>
                </div>
                <Badge variant={q.type === 'MCQ' ? 'info' : 'purple'} size="sm">
                  {q.type}
                </Badge>
              </div>
            ))}
            {parsedQuestions.length > 10 && (
              <p className="text-center text-xs text-slate-500 italic">
                + {parsedQuestions.length - 10} more questions ready to import...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={parsedQuestions.length === 0}
          isLoading={saving}
          type="button"
        >
          Import {parsedQuestions.length > 0 ? `${parsedQuestions.length} Questions` : 'Questions'}
        </Button>
      </div>
    </div>
  );
};

export default BulkUpload;
