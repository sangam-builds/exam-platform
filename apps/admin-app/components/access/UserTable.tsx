'use client';

import React, { useState } from 'react';
import { User, Role } from '@exam-platform/shared-types';
import { Badge, Button } from '@exam-platform/ui';
import { api } from '../../lib/apiClient';

export interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  roleFilter?: Role;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  onRefresh,
  title,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleStatus = async (user: User) => {
    setUpdatingId(user.id);
    try {
      await api.users.toggleStatus(user.id, !user.isActive);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'purple';
      case Role.TEACHER:
        return 'info';
      case Role.STUDENT:
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-sm text-slate-400">Loading user roster...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {title && (
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <span className="text-xs text-slate-400">{users.length} registered</span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
            👥
          </div>
          <h4 className="text-sm font-semibold text-slate-300">No users found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No accounts match the current filter or have been registered yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name || 'Invited User'}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        Deactivated
                      </Badge>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {user.role !== Role.ADMIN && (
                      <Button
                        variant={user.isActive ? 'outline' : 'secondary'}
                        className="text-xs px-2.5 py-1 h-7"
                        isLoading={updatingId === user.id}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserTable;
