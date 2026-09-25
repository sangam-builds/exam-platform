export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  initialPassword?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends Omit<User, 'createdAt' | 'updatedAt'> {}
