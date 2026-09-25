export type FlagType = 'TAB_SWITCH' | 'TIME_ANOMALY' | 'SIMILARITY_MATCH' | 'RAPID_GUESS';

export interface IntegrityFlag {
  id: string;
  attemptId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  flagType: FlagType;
  details?: Record<string, any> | null;
  createdAt: string;
}

export interface RecordFlagDto {
  attemptId: string;
  flagType: FlagType;
  details?: Record<string, any>;
}

export interface ExamIntegritySummary {
  examId: string;
  totalFlags: number;
  flaggedStudentsCount: number;
  flagsByType: Record<FlagType, number>;
  recentFlags: IntegrityFlag[];
}
