import { AxiosInstance } from 'axios';
import { CreateInviteDto, Invite, RedeemInviteDto, ValidateInviteResponse, AuthResponse } from '@exam-platform/shared-types';

export const createInviteEndpoints = (client: AxiosInstance) => ({
  createInvite: async (dto: CreateInviteDto): Promise<Invite> => {
    const { data } = await client.post<Invite>('/invites', dto);
    return data;
  },
  validateInvite: async (token: string): Promise<ValidateInviteResponse> => {
    const { data } = await client.get<ValidateInviteResponse>(`/invites/validate/${token}`);
    return data;
  },
  redeemInvite: async (dto: RedeemInviteDto): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/invites/redeem', dto);
    return data;
  },
});
