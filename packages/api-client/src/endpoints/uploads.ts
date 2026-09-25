import { AxiosInstance } from 'axios';
import { CreateQuestionDto } from '@exam-platform/shared-types';

export const createUploadEndpoints = (client: AxiosInstance) => ({
  uploadImage: async (file: File | Blob): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.post<{ url: string; key: string }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  parseCsv: async (file: File | Blob): Promise<{ count: number; questions: Omit<CreateQuestionDto, 'examId'>[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.post<{ count: number; questions: Omit<CreateQuestionDto, 'examId'>[] }>(
      '/uploads/parse-csv',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data;
  },
});
