export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';

export interface Attempt {
  id: string;
  studentId: string;
  examId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  score?: number | null;
  totalPoints?: number | null;
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
  score?: number | null;
  totalPoints?: number | null;
  percentage?: number | null;
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

export interface StudentAttendanceRecord {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  score?: number | null;
  totalPoints?: number | null;
  percentage?: number | null;
  answeredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
}

export interface ExamAttendanceResponse {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    startTime?: string | null;
    endTime?: string | null;
    totalQuestions: number;
    totalPoints: number;
  };
  totalAttended: number;
  submittedCount: number;
  inProgressCount: number;
  averageScore?: number | null;
  students: StudentAttendanceRecord[];
}

export interface StudentExamSummary {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    durationMinutes: number;
    startTime?: string | null;
    endTime?: string | null;
    questionCount: number;
    totalPoints: number;
  };
  attempt?: Attempt | null;
}
