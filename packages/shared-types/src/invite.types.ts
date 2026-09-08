import { Role } from './user.types';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invite {
  id: string;
  email: string;
  role: Role;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  invitedById: string;
  createdAt: string;
}

export interface CreateInviteDto {
  email: string;
  role: Role;
}

export interface RedeemInviteDto {
  token: string;
  name: string;
  password: string;
}

export interface ValidateInviteResponse {
  valid: boolean;
  email?: string;
  role?: Role;
  message?: string;
}
