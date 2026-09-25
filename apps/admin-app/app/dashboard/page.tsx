'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/common/Header';
import { Card, Button, Badge } from '@exam-platform/ui';
import UserTable from '../../components/access/UserTable';
import AddUserModal from '../../components/access/AddUserModal';
import { api, getStoredUser } from '../../lib/apiClient';
import { User, Role } from '@exam-platform/shared-types';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    pendingInvites: 0,
    activeExams: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.admin.getStats().catch(() => ({
          totalUsers: 0,
          totalTeachers: 0,
          totalStudents: 0,
          totalAdmins: 0,
          pendingInvites: 0,
          activeExams: 0,
        })),
        api.users.getUsers({ limit: 10, search: searchQuery || undefined }).catch(() => []),
      ]);

      setStats(statsData);
      setRecentUsers(usersData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">System Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Overview of platform activity, user rosters, and access invitations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadData}
              className="text-xs h-10"
              isLoading={loading}
            >
              ↻ Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsInviteModalOpen(true)}
              className="h-10 text-xs font-semibold shadow-lg shadow-indigo-600/20"
            >
              + Invite New User
            </Button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="relative overflow-hidden border-slate-800 bg-slate-900/90">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Total Accounts
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.totalUsers}</div>
            <div className="mt-2 text-xs text-slate-500">All registered system users</div>
          </Card>

          <Card className="relative overflow-hidden border-slate-800 bg-slate-900/90">
            <div className="text-xs font-medium text-sky-400 uppercase tracking-wider mb-2">
              Teachers / Instructors
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.totalTeachers}</div>
            <div className="mt-2 text-xs text-slate-500">Exam authors & evaluators</div>
          </Card>

          <Card className="relative overflow-hidden border-slate-800 bg-slate-900/90">
            <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">
              Active Students
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.totalStudents}</div>
            <div className="mt-2 text-xs text-slate-500">Enrolled test candidates</div>
          </Card>

          <Card className="relative overflow-hidden border-slate-800 bg-slate-900/90">
            <div className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">
              Pending Invites
            </div>
            <div className="text-3xl font-extrabold text-amber-400">{stats.pendingInvites}</div>
            <div className="mt-2 text-xs text-slate-500">Awaiting account activation</div>
          </Card>
        </div>

        {/* User Roster Table Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Recent Users & System Roster</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button variant="secondary" onClick={loadData} className="text-xs px-3 py-1.5 h-8">
                Search
              </Button>
            </div>
          </div>

          <UserTable
            users={recentUsers}
            isLoading={loading}
            onRefresh={loadData}
          />
        </div>
      </main>

      {/* Add User Invite Modal */}
      <AddUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onUserAdded={loadData}
      />
    </div>
  );
}
