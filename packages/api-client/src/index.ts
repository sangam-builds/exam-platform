import axios, { AxiosInstance } from 'axios';
import {
  createAuthEndpoints,
  createUserEndpoints,
  createAdminEndpoints,
  createInviteEndpoints,
  createTopicEndpoints,
  createExamEndpoints,
  createQuestionEndpoints,
  createUploadEndpoints,
  createOrganizationEndpoints,
  createAttemptEndpoints,
  createAnalyticsEndpoints,
} from './endpoints';

export interface ExamPlatformSdk {
  client: AxiosInstance;
  auth: ReturnType<typeof createAuthEndpoints>;
  users: ReturnType<typeof createUserEndpoints>;
  admin: ReturnType<typeof createAdminEndpoints>;
  invites: ReturnType<typeof createInviteEndpoints>;
  topics: ReturnType<typeof createTopicEndpoints>;
  exams: ReturnType<typeof createExamEndpoints>;
  questions: ReturnType<typeof createQuestionEndpoints>;
  uploads: ReturnType<typeof createUploadEndpoints>;
  organizations: ReturnType<typeof createOrganizationEndpoints>;
  attempts: ReturnType<typeof createAttemptEndpoints>;
  analytics: ReturnType<typeof createAnalyticsEndpoints>;
  setToken: (token: string | null) => void;
}

export const createSdk = (baseURL: string): ExamPlatformSdk => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  return {
    client,
    auth: createAuthEndpoints(client),
    users: createUserEndpoints(client),
    admin: createAdminEndpoints(client),
    invites: createInviteEndpoints(client),
    topics: createTopicEndpoints(client),
    exams: createExamEndpoints(client),
    questions: createQuestionEndpoints(client),
    uploads: createUploadEndpoints(client),
    organizations: createOrganizationEndpoints(client),
    attempts: createAttemptEndpoints(client),
    analytics: createAnalyticsEndpoints(client),
    setToken: (token: string | null) => {
      if (token) {
        client.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
        delete client.defaults.headers.common.Authorization;
      }
    },
  };
};

export * from './endpoints';
