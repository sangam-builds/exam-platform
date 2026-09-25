import { AxiosInstance } from 'axios';
import { LoginDto, AuthResponse, UserProfile } from '@exam-platform/shared-types';

export const createAuthEndpoints = (client: AxiosInstance) => ({
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/auth/login', dto);
    return data;
  },
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await client.get<UserProfile>('/auth/me');
    return data;
  },
});
