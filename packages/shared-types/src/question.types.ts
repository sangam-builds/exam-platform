export type QuestionType = 'MCQ' | 'SUBJECTIVE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  topic?: string;
  difficulty: DifficultyLevel;
  points: number;
}
