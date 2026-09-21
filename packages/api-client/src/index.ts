import { createApiClient } from './client';
import { createAuthEndpoints } from './endpoints/auth';
import { createInviteEndpoints } from './endpoints/invites';
import { createUserEndpoints } from './endpoints/users';
import { createAdminEndpoints } from './endpoints/admin';

export * from './client';
export * from './endpoints';

export const createSdk = (baseURL: string = '/api') => {
  const client = createApiClient(baseURL);
  return {
    client,
    auth: createAuthEndpoints(client),
    invites: createInviteEndpoints(client),
    users: createUserEndpoints(client),
    admin: createAdminEndpoints(client),
  };
};
