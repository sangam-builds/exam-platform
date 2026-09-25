import { AttemptStatus } from './attempt.types';
import { IntegrityFlag } from './integrity.types';

export interface LiveStudentStatus {
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptId: string | null;
  status: AttemptStatus | 'NOT_STARTED';
  startedAt?: string | null;
  submittedAt?: string | null;
  lastActivityAt?: string | null;
  answeredCount: number;
  totalQuestions: number;
  progressPercentage: number;
  timeSpentSeconds: number;
  score?: number | null;
  totalPoints?: number | null;
  percentage?: number | null;
  isFlagged: boolean;
  flagsCount: number;
  recentFlags: IntegrityFlag[];
}

export interface LiveMonitorStats {
  totalStudents: number;
  activeCount: number;
  submittedCount: number;
  notStartedCount: number;
  flaggedCount: number;
  averageScore?: number | null;
  averageProgressPercent: number;
}

export interface LiveExamMonitorResponse {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    startTime?: string | null;
    endTime?: string | null;
    totalQuestions: number;
    totalPoints: number;
  };
  stats: LiveMonitorStats;
  students: LiveStudentStatus[];
  timestamp: string;
}
