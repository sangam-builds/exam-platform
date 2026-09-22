'use client';

import { useEffect, useRef } from 'react';
import { useExamStore } from '../store/examStore';
import { api } from '../lib/apiClient';

export const useAutosave = () => {
  const attempt = useExamStore((state) => state.attempt);
  const answers = useExamStore((state) => state.answers);
  const markAnswerSaved = useExamStore((state) => state.markAnswerSaved);
  const setSaveStatus = useExamStore((state) => state.setSaveStatus);

  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!attempt || !attempt.id || attempt.status !== 'IN_PROGRESS') {
      return;
    }

    const dirtyEntries = Object.values(answers).filter((a) => a.isDirty);
    if (dirtyEntries.length === 0) {
      return;
    }

    const timer = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        for (const ans of dirtyEntries) {
          await api.attempts.saveAnswer(attempt.id, {
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer ?? undefined,
            textAnswer: ans.textAnswer ?? undefined,
            timeSpentSeconds: ans.timeSpentSeconds,
            changeCount: ans.changeCount,
            isFlagged: ans.isFlagged,
          });
          markAnswerSaved(ans.questionId);
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [answers, attempt, markAnswerSaved, setSaveStatus]);
};
