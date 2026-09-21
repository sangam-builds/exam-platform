'use client';

import React, { useEffect, useState } from 'react';
import Header from '../../../components/common/Header';
import UserTable from '../../../components/access/UserTable';
import AddUserModal from '../../../components/access/AddUserModal';
import { Button } from '@exam-platform/ui';
import { api } from '../../../lib/apiClient';
import { User, Role } from '@exam-platform/shared-types';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getUsers({ role: Role.TEACHER, search: search || undefined });
      setTeachers(data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Teacher Roster</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage instructors, authoring permissions, and account activation states.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsInviteModalOpen(true)}
              className="text-xs h-9 font-semibold"
            >
              + Invite Teacher
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search teachers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTeachers()}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button variant="secondary" onClick={loadTeachers} className="text-xs px-3 py-2 h-9">
            Filter
          </Button>
        </div>

        <UserTable
          users={teachers}
          isLoading={loading}
          onRefresh={loadTeachers}
          title="All Teachers"
          roleFilter={Role.TEACHER}
        />
      </main>

      <AddUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        defaultRole={Role.TEACHER}
        onUserAdded={loadTeachers}
      />
    </div>
  );
}
