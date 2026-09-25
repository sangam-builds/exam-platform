'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/common/Header';
import { Card, Button, Badge } from '@exam-platform/ui';
import CreateOrgModal from '../../components/organizations/CreateOrgModal';
import { api, getStoredUser } from '../../lib/apiClient';
import { OrganizationWithStats } from '@exam-platform/shared-types';

export default function OrganizationsDirectoryPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const data = await api.organizations.getOrganizations();
      setOrgs(data);
    } catch (err) {
      console.error('Failed to load organizations:', err);
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
    loadOrgs();
  }, [router]);

  const handleDeleteOrg = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete organization "${name}"?`)) return;
    try {
      await api.organizations.deleteOrganization(id);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };

  const filteredOrgs = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalTeachers = orgs.reduce((acc, o) => acc + (o.teachersCount || 0), 0);
  const totalStudents = orgs.reduce((acc, o) => acc + (o.studentsCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Organizations & Institutions
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage multi-tenant school organizations and directly generate member login credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadOrgs} isLoading={loading} className="text-xs h-10">
              ↻ Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-10 text-xs font-semibold shadow-lg shadow-indigo-600/20"
            >
              + Create Organization
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Total Organizations
            </div>
            <div className="text-3xl font-extrabold text-white">{orgs.length}</div>
            <div className="mt-2 text-xs text-slate-500">Registered schools and academies</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Managed Teachers
            </div>
            <div className="text-3xl font-extrabold text-indigo-400">{totalTeachers}</div>
            <div className="mt-2 text-xs text-slate-500">Instructor accounts across all orgs</div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Managed Students
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{totalStudents}</div>
            <div className="mt-2 text-xs text-slate-500">Candidate accounts across all orgs</div>
          </Card>
        </div>

        {/* Organizations List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-white">Active Organizations ({orgs.length})</h2>
            <div className="max-w-xs w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations or domain..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs">Loading organizations...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
                🏫
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No organizations found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                Create your first institution to organize teachers, students, and formatted credentials.
              </p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="text-xs">
                + Create Organization
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredOrgs.map((org) => (
                <div
                  key={org.id}
                  className="p-6 hover:bg-slate-800/25 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3
                        className="text-base font-bold text-white hover:text-indigo-400 cursor-pointer"
                        onClick={() => router.push(`/organizations/${org.id}`)}
                      >
                        {org.name}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300">
                        @{org.slug}.io
                      </span>
                    </div>

                    {org.description && (
                      <p className="text-xs text-slate-400 max-w-2xl line-clamp-1">{org.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>👨‍🏫 {org.teachersCount || 0} Teachers</span>
                      <span>🎓 {org.studentsCount || 0} Students</span>
                      <span>📅 Created {new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      className="text-xs h-8 px-3"
                      onClick={() => router.push(`/organizations/${org.id}`)}
                    >
                      👥 View Roster & Credentials
                    </Button>
                    <Button
                      variant="danger"
                      className="text-xs h-8 px-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300"
                      onClick={() => handleDeleteOrg(org.id, org.name)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateOrgModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadOrgs}
      />
    </div>
  );
}
