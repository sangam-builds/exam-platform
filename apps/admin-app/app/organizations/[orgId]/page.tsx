'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/common/Header';
import { Card, Button, Badge } from '@exam-platform/ui';
import CreateOrgUserModal from '../../../components/organizations/CreateOrgUserModal';
import { api, getStoredUser } from '../../../lib/apiClient';
import { OrganizationWithStats } from '@exam-platform/shared-types';

interface OrgDetailMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface OrgDetail extends Omit<OrganizationWithStats, 'users'> {
  users?: OrgDetailMember[];
}

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params?.orgId as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'TEACHER' | 'STUDENT'>('all');
  const [search, setSearch] = useState('');
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  const loadOrg = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await api.organizations.getOrganization(orgId);
      setOrg(data as OrgDetail);
    } catch (err) {
      console.error('Failed to load organization:', err);
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
    loadOrg();
  }, [orgId, router]);

  const members = org?.users || [];
  const filteredMembers = members.filter((m) => {
    const matchesTab = activeTab === 'all' || m.role === activeTab;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => router.push('/organizations')}
            className="hover:text-indigo-400 transition-colors"
          >
            ← Back to Organizations
          </button>
          <span>/</span>
          <span className="text-slate-200 font-medium">{org?.name || 'Loading...'}</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Loading organization details and member roster...</p>
          </div>
        ) : !org ? (
          <div className="p-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-sm font-semibold text-rose-400">Organization not found</p>
            <Button
              variant="outline"
              onClick={() => router.push('/organizations')}
              className="mt-4 text-xs"
            >
              Return to Directory
            </Button>
          </div>
        ) : (
          <>
            {/* Header Hero */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{org.name}</h1>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold">
                      @{org.slug}.io
                    </span>
                  </div>
                  {org.description && (
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">{org.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Joined on {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" onClick={loadOrg} className="text-xs h-10">
                    ↻ Refresh
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsCredentialModalOpen(true)}
                    className="h-10 text-xs font-semibold shadow-lg shadow-indigo-600/20"
                  >
                    + Generate Credentials
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Total Members
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">{members.length}</div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Teachers
                  </div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">
                    {org.teachersCount || members.filter((m) => m.role === 'TEACHER').length}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Students
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {org.studentsCount || members.filter((m) => m.role === 'STUDENT').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Roster Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              {/* Controls bar */}
              <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    All Members ({members.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('TEACHER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'TEACHER'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Teachers ({members.filter((m) => m.role === 'TEACHER').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('STUDENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'STUDENT'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Students ({members.filter((m) => m.role === 'STUDENT').length})
                  </button>
                </div>

                <div className="max-w-xs w-full">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Roster Table */}
              {filteredMembers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
                    👥
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">No members found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                    Generate login credentials for teachers or students to populate this roster.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setIsCredentialModalOpen(true)}
                    className="text-xs"
                  >
                    + Generate Credentials
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Login Email</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                          <td className="px-6 py-4 font-mono text-indigo-300 select-all">
                            {member.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                member.role === 'TEACHER'
                                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                              }`}
                            >
                              {member.role === 'TEACHER' ? '👨‍🏫 Teacher' : '🎓 Student'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                member.isActive
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950/40 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {member.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {org && (
        <CreateOrgUserModal
          isOpen={isCredentialModalOpen}
          onClose={() => setIsCredentialModalOpen(false)}
          orgId={org.id}
          orgName={org.name}
          orgSlug={org.slug}
          onSuccess={loadOrg}
        />
      )}
    </div>
  );
}
