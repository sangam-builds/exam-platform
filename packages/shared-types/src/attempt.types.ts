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

export interface AnswerSubmissionDto {
  questionId: string;
  selectedAnswer?: string;
  textAnswer?: string;
  timeSpentSeconds?: number;
  changeCount?: number;
}

export interface AttemptResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  topicBreakdown?: Array<{
    topicId: string;
    topicName: string;
    correctCount: number;
    totalCount: number;
    percentage: number;
  }>;
}
