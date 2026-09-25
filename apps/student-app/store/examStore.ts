import { create } from 'zustand';
import {
  Attempt,
  StudentQuestion,
  AttemptDetailResponse,
  SavedAnswer,
} from '@exam-platform/shared-types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface LocalAnswer {
  questionId: string;
  selectedAnswer?: string | null;
  textAnswer?: string | null;
  timeSpentSeconds: number;
  changeCount: number;
  isFlagged: boolean;
  isDirty?: boolean;
}

interface ExamState {
  exam: AttemptDetailResponse['exam'] | null;
  attempt: Attempt | null;
  questions: StudentQuestion[];
  currentIndex: number;
  answers: Record<string, LocalAnswer>;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;

  setAttemptData: (data: AttemptDetailResponse) => void;
  selectOption: (questionId: string, option: string) => void;
  setTextAnswer: (questionId: string, text: string) => void;
  toggleFlag: (questionId: string) => void;
  incrementTimeSpent: (questionId: string, seconds?: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  markAnswerSaved: (questionId: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  resetExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  exam: null,
  attempt: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  saveStatus: 'idle',
  lastSavedAt: null,

  setAttemptData: (data: AttemptDetailResponse) => {
    const initialAnswers: Record<string, LocalAnswer> = {};

    // Initialize all questions with empty or saved state
    data.questions.forEach((q) => {
      initialAnswers[q.id] = {
        questionId: q.id,
        selectedAnswer: null,
        textAnswer: null,
        timeSpentSeconds: 0,
        changeCount: 0,
        isFlagged: false,
        isDirty: false,
      };
    });

    // Populate from saved answers if any
    data.answers.forEach((a: SavedAnswer) => {
      if (initialAnswers[a.questionId]) {
        initialAnswers[a.questionId] = {
          ...initialAnswers[a.questionId],
          selectedAnswer: a.selectedAnswer ?? null,
          textAnswer: a.textAnswer ?? null,
          timeSpentSeconds: a.timeSpentSeconds ?? 0,
          changeCount: a.changeCount ?? 0,
          isFlagged: a.isFlagged ?? false,
          isDirty: false,
        };
      }
    });

    set({
      exam: data.exam,
      attempt: data.attempt,
      questions: data.questions,
      currentIndex: 0,
      answers: initialAnswers,
      saveStatus: 'idle',
      lastSavedAt: new Date().toISOString(),
    });
  },

  selectOption: (questionId: string, option: string) => {
    const current = get().answers[questionId] || {
      questionId,
      timeSpentSeconds: 0,
      changeCount: 0,
      isFlagged: false,
    };

    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...current,
          selectedAnswer: option,
          changeCount: current.changeCount + 1,
          isDirty: true,
        },
      },
    }));
  },

  setTextAnswer: (questionId: string, text: string) => {
    const current = get().answers[questionId] || {
      questionId,
      timeSpentSeconds: 0,
      changeCount: 0,
      isFlagged: false,
    };

    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...current,
          textAnswer: text,
          changeCount: current.changeCount + 1,
          isDirty: true,
        },
      },
    }));
  },

  toggleFlag: (questionId: string) => {
    const current = get().answers[questionId];
    if (!current) return;

    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...current,
          isFlagged: !current.isFlagged,
          isDirty: true,
        },
      },
    }));
  },

  incrementTimeSpent: (questionId: string, seconds = 1) => {
    const current = get().answers[questionId];
    if (!current) return;

    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...current,
          timeSpentSeconds: (current.timeSpentSeconds || 0) + seconds,
        },
      },
    }));
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  goToQuestion: (index: number) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentIndex: index });
    }
  },

  markAnswerSaved: (questionId: string) => {
    set((state) => {
      const ans = state.answers[questionId];
      if (!ans) return state;
      return {
        answers: {
          ...state.answers,
          [questionId]: {
            ...ans,
            isDirty: false,
          },
        },
        saveStatus: 'saved',
        lastSavedAt: new Date().toISOString(),
      };
    });
  },

  setSaveStatus: (status: SaveStatus) => set({ saveStatus: status }),

  resetExam: () =>
    set({
      exam: null,
      attempt: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      saveStatus: 'idle',
      lastSavedAt: null,
    }),
}));
