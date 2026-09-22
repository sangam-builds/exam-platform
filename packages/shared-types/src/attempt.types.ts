export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';

export interface Attempt {
  id: string;
  studentId: string;
  examId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  totalPoints?: number;
}

export interface StartAttemptDto {
  examId: string;
}

export interface AnswerSubmissionDto {
  questionId: string;
  selectedAnswer?: string;
  textAnswer?: string;
  timeSpentSeconds?: number;
  changeCount?: number;
  isFlagged?: boolean;
}

export interface StudentQuestion {
  id: string;
  examId: string;
  topicId?: string | null;
  topic?: {
    id: string;
    name: string;
  } | null;
  text: string;
  type: 'MCQ' | 'SUBJECTIVE';
  options?: string[] | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  orderIndex: number;
}

export interface SavedAnswer {
  id?: string;
  questionId: string;
  selectedAnswer?: string | null;
  textAnswer?: string | null;
  timeSpentSeconds?: number;
  changeCount?: number;
  isFlagged?: boolean;
}

export interface AttemptDetailResponse {
  attempt: Attempt;
  exam: {
    id: string;
    title: string;
    description?: string | null;
    durationMinutes: number;
    startTime?: string | null;
    endTime?: string | null;
    isAdaptive: boolean;
  };
  questions: StudentQuestion[];
  answers: SavedAnswer[];
}

export interface AttemptResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  status: AttemptStatus;
  score: number;
  totalPoints: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  totalQuestions: number;
  answeredCount: number;
  topicBreakdown?: Array<{
    topicId: string;
    topicName: string;
    correctCount: number;
    totalCount: number;
    percentage: number;
  }>;
}

export interface StudentExamSummary {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    durationMinutes: number;
    questionCount: number;
    totalPoints: number;
  };
  attempt?: Attempt | null;
}
