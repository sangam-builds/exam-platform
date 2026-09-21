import { AxiosInstance } from 'axios';
import {
  Organization,
  OrganizationWithStats,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  CreateOrgUserDto,
  BatchCreateOrgUsersDto,
  BatchCreateOrgUsersResponse,
  GeneratedUserCredential,
} from '@exam-platform/shared-types';

export const createOrganizationEndpoints = (client: AxiosInstance) => ({
  getOrganizations: async (): Promise<OrganizationWithStats[]> => {
    const { data } = await client.get<OrganizationWithStats[]>('/organizations');
    return data;
  },

  getOrganization: async (id: string): Promise<Organization & { teachersCount: number; studentsCount: number }> => {
    const { data } = await client.get<Organization & { teachersCount: number; studentsCount: number }>(`/organizations/${id}`);
    return data;
  },

  createOrganization: async (dto: CreateOrganizationDto): Promise<Organization> => {
    const { data } = await client.post<Organization>('/organizations', dto);
    return data;
  },

  updateOrganization: async (id: string, dto: UpdateOrganizationDto): Promise<Organization> => {
    const { data } = await client.patch<Organization>(`/organizations/${id}`, dto);
    return data;
  },

  deleteOrganization: async (id: string): Promise<{ success: boolean; id: string }> => {
    const { data } = await client.delete<{ success: boolean; id: string }>(`/organizations/${id}`);
    return data;
  },

  createUserUnderOrg: async (orgId: string, dto: CreateOrgUserDto): Promise<GeneratedUserCredential> => {
    const { data } = await client.post<GeneratedUserCredential>(`/organizations/${orgId}/users`, dto);
    return data;
  },

  batchCreateUsersUnderOrg: async (
    orgId: string,
    dto: BatchCreateOrgUsersDto,
  ): Promise<BatchCreateOrgUsersResponse> => {
    const { data } = await client.post<BatchCreateOrgUsersResponse>(`/organizations/${orgId}/users/batch`, dto);
    return data;
  },

  resetMemberPassword: async (
    orgId: string,
    userId: string,
  ): Promise<GeneratedUserCredential> => {
    const { data } = await client.post<GeneratedUserCredential>(
      `/organizations/${orgId}/users/${userId}/reset-password`,
    );
    return data;
  },

  deleteMember: async (
    orgId: string,
    userId: string,
  ): Promise<{ success: boolean; id: string }> => {
    const { data } = await client.delete<{ success: boolean; id: string }>(
      `/organizations/${orgId}/users/${userId}`,
    );
    return data;
  },

  toggleMemberStatus: async (
    orgId: string,
    userId: string,
    isActive?: boolean,
  ): Promise<{ id: string; isActive: boolean; name: string; email: string }> => {
    const { data } = await client.patch<{ id: string; isActive: boolean; name: string; email: string }>(
      `/organizations/${orgId}/users/${userId}/status`,
      { isActive },
    );
    return data;
  },
});
