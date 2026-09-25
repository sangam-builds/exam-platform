import { AxiosInstance } from 'axios';
import {
  IntegrityFlag,
  RecordFlagDto,
  ExamIntegritySummary,
} from '@exam-platform/shared-types';

export const createIntegrityEndpoints = (client: AxiosInstance) => ({
  recordFlag: async (dto: RecordFlagDto): Promise<IntegrityFlag> => {
    const response = await client.post<IntegrityFlag>('/integrity/flags', dto);
    return response.data;
  },

  getExamFlags: async (examId: string): Promise<ExamIntegritySummary> => {
    const response = await client.get<ExamIntegritySummary>(`/integrity/flags/exam/${examId}`);
    return response.data;
  },

  getAttemptFlags: async (attemptId: string): Promise<IntegrityFlag[]> => {
    const response = await client.get<IntegrityFlag[]>(`/integrity/flags/attempt/${attemptId}`);
    return response.data;
  },
});
