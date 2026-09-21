import { Topic } from './topic.types';

export type QuestionType = 'MCQ' | 'SUBJECTIVE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Question {
  id: string;
  examId: string;
  topicId?: string | null;
  topic?: Topic | null;
  text: string;
  type: QuestionType;
  options?: string[] | null;
  correctAnswer?: string | null;
  rubric?: string | null;
  difficulty: DifficultyLevel;
  points: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionDto {
  examId: string;
  topicId?: string;
  text: string;
  type?: QuestionType;
  options?: string[];
  correctAnswer?: string;
  rubric?: string;
  difficulty?: DifficultyLevel;
  points?: number;
  orderIndex?: number;
}

export interface UpdateQuestionDto {
  topicId?: string;
  text?: string;
  type?: QuestionType;
  options?: string[];
  correctAnswer?: string;
  rubric?: string;
  difficulty?: DifficultyLevel;
  points?: number;
  orderIndex?: number;
}

export interface BulkCreateQuestionsDto {
  examId: string;
  questions: Omit<CreateQuestionDto, 'examId'>[];
}
