import { createApiClient } from './client';
import { createAuthEndpoints } from './endpoints/auth';
import { createInviteEndpoints } from './endpoints/invites';

export * from './client';
export * from './endpoints/auth';
export * from './endpoints/invites';

export const createSdk = (baseURL: string = '/api') => {
  const client = createApiClient(baseURL);
  return {
    client,
    auth: createAuthEndpoints(client),
    invites: createInviteEndpoints(client),
  };
};
