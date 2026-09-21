import { AxiosInstance } from 'axios';
import { Topic, CreateTopicDto, UpdateTopicDto } from '@exam-platform/shared-types';

export const createTopicEndpoints = (client: AxiosInstance) => ({
  getTopics: async (): Promise<Topic[]> => {
    const { data } = await client.get<Topic[]>('/topics');
    return data;
  },

  getTopic: async (id: string): Promise<Topic> => {
    const { data } = await client.get<Topic>(`/topics/${id}`);
    return data;
  },

  createTopic: async (dto: CreateTopicDto): Promise<Topic> => {
    const { data } = await client.post<Topic>('/topics', dto);
    return data;
  },

  updateTopic: async (id: string, dto: UpdateTopicDto): Promise<Topic> => {
    const { data } = await client.patch<Topic>(`/topics/${id}`, dto);
    return data;
  },

  deleteTopic: async (id: string): Promise<{ success: boolean; id: string }> => {
    const { data } = await client.delete<{ success: boolean; id: string }>(`/topics/${id}`);
    return data;
  },
});
