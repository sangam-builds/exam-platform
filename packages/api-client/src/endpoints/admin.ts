import { AxiosInstance } from 'axios';

export interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalAdmins: number;
  pendingInvites: number;
  activeExams: number;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface GetLogsParams {
  action?: string;
  entity?: string;
  limit?: number;
  page?: number;
}

export const createAdminEndpoints = (client: AxiosInstance) => ({
  getStats: async (): Promise<AdminStats> => {
    const { data } = await client.get<AdminStats>('/admin/stats');
    return data;
  },
  getAuditLogs: async (params?: GetLogsParams): Promise<AuditLogItem[]> => {
    const { data } = await client.get<AuditLogItem[]>('/admin/logs', { params });
    return data;
  },
});
