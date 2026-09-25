import { AxiosInstance } from 'axios';
import { AttemptTopicAnalytics } from '@exam-platform/shared-types';

export const createAnalyticsEndpoints = (client: AxiosInstance) => ({
  getAttemptTopicAnalytics: async (attemptId: string): Promise<AttemptTopicAnalytics> => {
    const response = await client.get<AttemptTopicAnalytics>(`/analytics/attempts/${attemptId}/topics`);
    return response.data;
  },

  getExamTopicAnalytics: async (examId: string): Promise<any> => {
    const response = await client.get(`/analytics/exams/${examId}/topics`);
    return response.data;
  },
});
