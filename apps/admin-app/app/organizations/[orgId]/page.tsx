'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/common/Header';
import { Card, Button, Badge, Modal } from '@exam-platform/ui';
import CreateOrgUserModal from '../../../components/organizations/CreateOrgUserModal';
import { api, getStoredUser } from '../../../lib/apiClient';
import { OrganizationWithStats, GeneratedUserCredential } from '@exam-platform/shared-types';

interface OrgDetailMember {
  id: string;
  name: string;
  email: string;
  role: string;
  initialPassword?: string | null;
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

  // Password visibility states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Password reset states
  const [resetModalData, setResetModalData] = useState<GeneratedUserCredential | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

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

  const togglePassword = (memberId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const toggleAllPasswords = () => {
    const nextState = !showAllPasswords;
    setShowAllPasswords(nextState);
    if (org?.users) {
      const updated: Record<string, boolean> = {};
      org.users.forEach((u) => {
        updated[u.id] = nextState;
      });
      setVisiblePasswords(updated);
    }
  };

  const copyPassword = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetPassword = async (member: OrgDetailMember) => {
    if (!confirm(`Are you sure you want to regenerate an 8-character password for ${member.name} (${member.email})?`)) {
      return;
    }

    try {
      setResettingId(member.id);
      const result = await api.organizations.resetMemberPassword(orgId, member.id);
      setResetModalData(result);
      await loadOrg();
      // Auto-show the newly generated password
      setVisiblePasswords((prev) => ({ ...prev, [member.id]: true }));
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

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
              <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
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

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={toggleAllPasswords}
                    className="text-xs h-8 px-3 border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
                  >
                    {showAllPasswords ? '🙈 Hide Passwords' : '👁️ Show All Passwords'}
                  </Button>

                  <div className="max-w-xs w-full">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or email..."
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
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
                        <th className="px-6 py-3.5">Password</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredMembers.map((member) => {
                        const isVisible = visiblePasswords[member.id] || showAllPasswords;
                        const pwd = member.initialPassword || 'Password123!';
                        const isCopied = copiedId === member.id;

                        return (
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

                            {/* Password Column with Show/Hide & Copy */}
                            <td className="px-6 py-4">
                              <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                                <code
                                  className={`font-mono font-bold select-all ${
                                    isVisible ? 'text-amber-300' : 'text-slate-500 tracking-widest'
                                  }`}
                                >
                                  {isVisible ? pwd : '••••••••'}
                                </code>

                                <button
                                  type="button"
                                  onClick={() => togglePassword(member.id)}
                                  title={isVisible ? 'Hide Password' : 'Show Password'}
                                  className="text-slate-400 hover:text-white transition-colors p-0.5"
                                >
                                  {isVisible ? '🙈' : '👁️'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => copyPassword(member.id, pwd)}
                                  title="Copy Password"
                                  className={`transition-colors p-0.5 text-xs ${
                                    isCopied ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {isCopied ? '✓' : '📋'}
                                </button>
                              </div>
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

                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="outline"
                                isLoading={resettingId === member.id}
                                onClick={() => handleResetPassword(member)}
                                className="text-[11px] h-7 px-2.5 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300"
                              >
                                🔄 Reset
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* Reset Password Success Modal */}
      {resetModalData && (
        <Modal
          isOpen={!!resetModalData}
          onClose={() => setResetModalData(null)}
          title="Password Reset Successful"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <span>✓</span> New 8-Character Password Generated!
              </div>
              <p className="text-xs text-slate-300">
                The member can immediately use this new password to sign into their portal.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Member Name</span>
                <div className="text-sm font-semibold text-white">{resetModalData.name}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Login Email</span>
                <code className="text-xs font-mono text-indigo-300 select-all">{resetModalData.email}</code>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">New Password</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-base font-mono font-bold text-amber-300 select-all bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    {resetModalData.rawPassword}
                  </code>
                  <Button
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() => copyPassword('modal', resetModalData.rawPassword)}
                  >
                    {copiedId === 'modal' ? '✓ Copied' : '📋 Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="primary" onClick={() => setResetModalData(null)} className="text-xs">
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
