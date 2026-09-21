import { Question } from './question.types';
import { User } from './user.types';

export interface Exam {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  startTime?: string | null;
  endTime?: string | null;
  isPublished: boolean;
  isAdaptive: boolean;
  teacherId: string;
  teacher?: Pick<User, 'id' | 'name' | 'email'>;
  questions?: Question[];
  _count?: {
    questions?: number;
    attempts?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamDto {
  title: string;
  description?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  isAdaptive?: boolean;
}

export interface UpdateExamDto {
  title?: string;
  description?: string;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  isPublished?: boolean;
  isAdaptive?: boolean;
}
