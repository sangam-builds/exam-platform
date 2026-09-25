import { AxiosInstance } from 'axios';
import { Exam, CreateExamDto, UpdateExamDto } from '@exam-platform/shared-types';

export interface GetExamsQuery {
  teacherId?: string;
  isPublished?: boolean;
  search?: string;
}

export const createExamEndpoints = (client: AxiosInstance) => {
  const getExams = async (query?: GetExamsQuery): Promise<Exam[]> => {
    const { data } = await client.get<Exam[]>('/exams', { params: query });
    return data;
  };

  const getExam = async (id: string): Promise<Exam> => {
    const { data } = await client.get<Exam>(`/exams/${id}`);
    return data;
  };

  return {
    getExams,
    findAll: getExams,
    getExam,
    findOne: getExam,

    createExam: async (dto: CreateExamDto): Promise<Exam> => {
      const { data } = await client.post<Exam>('/exams', dto);
      return data;
    },

    updateExam: async (id: string, dto: UpdateExamDto): Promise<Exam> => {
      const { data } = await client.patch<Exam>(`/exams/${id}`, dto);
      return data;
    },

    togglePublish: async (id: string, isPublished: boolean): Promise<Exam> => {
      const { data } = await client.patch<Exam>(`/exams/${id}/publish`, { isPublished });
      return data;
    },

    deleteExam: async (id: string): Promise<{ success: boolean; id: string }> => {
      const { data } = await client.delete<{ success: boolean; id: string }>(`/exams/${id}`);
      return data;
    },
  };
};
