import { AxiosInstance } from 'axios';
import { User, Role } from '@exam-platform/shared-types';

export interface GetUsersParams {
  role?: Role;
  search?: string;
  page?: number;
  limit?: number;
}

export const createUserEndpoints = (client: AxiosInstance) => ({
  getUsers: async (params?: GetUsersParams): Promise<User[]> => {
    const { data } = await client.get<User[]>('/users', { params });
    return data;
  },
  getUserById: async (id: string): Promise<User> => {
    const { data } = await client.get<User>(`/users/${id}`);
    return data;
  },
  toggleStatus: async (id: string, isActive: boolean): Promise<User> => {
    const { data } = await client.patch<User>(`/users/${id}/status`, { isActive });
    return data;
  },
});
