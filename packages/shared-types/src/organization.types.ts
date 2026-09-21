import { Role, User } from './user.types';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  users?: User[];
  _count?: {
    users?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWithStats extends Organization {
  teachersCount: number;
  studentsCount: number;
}

export interface CreateOrganizationDto {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  description?: string;
}

export interface CreateOrgUserDto {
  role: Role.TEACHER | Role.STUDENT;
  name: string;
  customId?: string; // Optional custom identifier (e.g. "T101", "S501", "john")
}

export interface GeneratedUserCredential {
  id: string;
  name: string;
  email: string;
  role: Role;
  rawPassword: string; // The generated plaintext password for the admin to distribute/copy
  organizationId: string;
  organizationName: string;
}

export interface BatchCreateOrgUsersDto {
  role: Role.TEACHER | Role.STUDENT;
  count: number;
  prefix?: string; // e.g. "T" or "STU" -> T101, T102
  startNumber?: number; // e.g. 101
  names?: string[]; // Optional names list
}

export interface BatchCreateOrgUsersResponse {
  organizationId: string;
  organizationName: string;
  totalCreated: number;
  credentials: GeneratedUserCredential[];
}
