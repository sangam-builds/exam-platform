'use client';

import React, { useEffect, useState } from 'react';
import Header from '../../components/common/Header';
import { Badge, Button } from '@exam-platform/ui';
import { api } from '../../lib/apiClient';
import { AuditLogItem } from '@exam-platform/api-client';

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAuditLogs({ limit: 50 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Audit Logs</h1>
            <p className="text-sm text-slate-400 mt-1">
              Immutable activity log tracking invitations, authentication, and security events.
            </p>
          </div>

          <Button variant="outline" onClick={loadLogs} className="text-xs h-9" isLoading={loading}>
            ↻ Refresh Logs
          </Button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 items-center justify-center text-slate-400 mb-3 text-lg">
                📜
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No audit events recorded</h4>
              <p className="text-xs text-slate-500 mt-1">Activity logs will automatically populate as actions are taken.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Entity</th>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-3.5 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-indigo-400">
                        {log.action}
                      </td>
                      <td className="px-6 py-3.5 text-slate-300">
                        {log.entity}
                      </td>
                      <td className="px-6 py-3.5 font-sans">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <span className="text-white">{log.user.name || log.user.email}</span>
                            <Badge variant="purple" size="sm">{log.user.role}</Badge>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">System / Anonymous</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
