'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/common/Header';
import { Card, Button, Input } from '@exam-platform/ui';
import UserTable from '../../components/access/UserTable';
import AddUserModal from '../../components/access/AddUserModal';
import { api, getStoredUser } from '../../lib/apiClient';
import { User, Role } from '@exam-platform/shared-types';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getUsers({
        role: selectedRole === 'ALL' ? undefined : selectedRole,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [selectedRole, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">User Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage platform administrators, teachers, and student accounts.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
            className="h-10 text-xs font-semibold shadow-lg shadow-indigo-600/20"
          >
            + Invite New User
          </Button>
        </div>

        {/* Filters and Search Toolbar */}
        <Card className="p-4 mb-6 bg-slate-900 border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setSelectedRole('ALL')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedRole === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setSelectedRole(Role.TEACHER)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedRole === Role.TEACHER
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Teachers
              </button>
              <button
                onClick={() => setSelectedRole(Role.STUDENT)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedRole === Role.STUDENT
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setSelectedRole(Role.ADMIN)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedRole === Role.ADMIN
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admins
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-9 bg-slate-950"
              />
              <Button type="submit" variant="secondary" className="h-9 text-xs">
                Search
              </Button>
            </form>
          </div>
        </Card>

        {/* User Table */}
        <UserTable
          users={users}
          isLoading={loading}
          onRefresh={fetchUsers}
          title={selectedRole === 'ALL' ? 'All Registered Accounts' : `${selectedRole} Accounts`}
        />
      </main>

      <AddUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onUserAdded={fetchUsers}
      />
    </div>
  );
}
