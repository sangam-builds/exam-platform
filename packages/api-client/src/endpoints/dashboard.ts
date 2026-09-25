import { AxiosInstance } from 'axios';
import { LiveExamMonitorResponse } from '@exam-platform/shared-types';

export const createDashboardEndpoints = (client: AxiosInstance) => ({
  getExamLiveMonitor: async (examId: string): Promise<LiveExamMonitorResponse> => {
    const res = await client.get<LiveExamMonitorResponse>(`/dashboard/exam/${examId}/live-monitor`);
    return res.data;
  },
});
