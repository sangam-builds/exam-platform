import { AxiosInstance } from 'axios';
import {
  Question,
  CreateQuestionDto,
  UpdateQuestionDto,
  BulkCreateQuestionsDto,
} from '@exam-platform/shared-types';

export const createQuestionEndpoints = (client: AxiosInstance) => ({
  getQuestionsByExam: async (examId: string): Promise<Question[]> => {
    const { data } = await client.get<Question[]>(`/questions/exam/${examId}`);
    return data;
  },

  getQuestion: async (id: string): Promise<Question> => {
    const { data } = await client.get<Question>(`/questions/${id}`);
    return data;
  },

  createQuestion: async (dto: CreateQuestionDto): Promise<Question> => {
    const { data } = await client.post<Question>('/questions', dto);
    return data;
  },

  bulkCreateQuestions: async (dto: BulkCreateQuestionsDto): Promise<{ count: number; questions: Question[] }> => {
    const { data } = await client.post<{ count: number; questions: Question[] }>('/questions/bulk', dto);
    return data;
  },

  updateQuestion: async (id: string, dto: UpdateQuestionDto): Promise<Question> => {
    const { data } = await client.patch<Question>(`/questions/${id}`, dto);
    return data;
  },

  deleteQuestion: async (id: string): Promise<{ success: boolean; id: string }> => {
    const { data } = await client.delete<{ success: boolean; id: string }>(`/questions/${id}`);
    return data;
  },
});
