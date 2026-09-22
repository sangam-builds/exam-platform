import { AxiosInstance } from 'axios';
import {
  StartAttemptDto,
  AnswerSubmissionDto,
  AttemptDetailResponse,
  AttemptResult,
  Attempt,
} from '@exam-platform/shared-types';

export const createAttemptEndpoints = (client: AxiosInstance) => ({
  start: async (data: StartAttemptDto): Promise<AttemptDetailResponse> => {
    const res = await client.post<AttemptDetailResponse>('/attempts/start', data);
    return res.data;
  },

  getAttempt: async (attemptId: string): Promise<AttemptDetailResponse> => {
    const res = await client.get<AttemptDetailResponse>(`/attempts/${attemptId}`);
    return res.data;
  },

  getAttemptByExam: async (examId: string): Promise<AttemptDetailResponse | null> => {
    const res = await client.get<AttemptDetailResponse | null>(`/attempts/exam/${examId}`);
    return res.data;
  },

  saveAnswer: async (attemptId: string, data: AnswerSubmissionDto): Promise<{ success: boolean }> => {
    const res = await client.post<{ success: boolean }>(`/attempts/${attemptId}/answers`, data);
    return res.data;
  },

  submit: async (attemptId: string): Promise<AttemptResult> => {
    const res = await client.post<AttemptResult>(`/attempts/${attemptId}/submit`);
    return res.data;
  },

  getResult: async (attemptId: string): Promise<AttemptResult> => {
    const res = await client.get<AttemptResult>(`/attempts/${attemptId}/result`);
    return res.data;
  },

  getMyAttempts: async (): Promise<Attempt[]> => {
    const res = await client.get<Attempt[]>('/attempts/my-attempts');
    return res.data;
  },
});
