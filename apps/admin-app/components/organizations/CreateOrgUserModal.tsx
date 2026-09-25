'use client';

import React, { useState } from 'react';
import { Modal, Input, Button, Badge } from '@exam-platform/ui';
import { Role, GeneratedUserCredential } from '@exam-platform/shared-types';
import { api } from '../../lib/apiClient';

export interface CreateOrgUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  orgSlug: string;
  defaultRole?: Role.TEACHER | Role.STUDENT;
  onSuccess: () => void;
}

export const CreateOrgUserModal: React.FC<CreateOrgUserModalProps> = ({
  isOpen,
  onClose,
  orgId,
  orgName,
  orgSlug,
  defaultRole = Role.TEACHER,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'single' | 'batch'>('single');
  const [role, setRole] = useState<Role.TEACHER | Role.STUDENT>(defaultRole);
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [batchPrefix, setBatchPrefix] = useState(defaultRole === Role.TEACHER ? 'T' : 'S');
  const [startNumber, setStartNumber] = useState<number>(101);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedUserCredential[] | null>(null);
  const [copied, setCopied] = useState(false);

  const sanitizedId = customId.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const emailPreview = `${sanitizedId || (role === Role.TEACHER ? 'teacher_id' : 'student_id')}@${orgSlug}.io`;

  const handleRoleChange = (newRole: Role.TEACHER | Role.STUDENT) => {
    setRole(newRole);
    setBatchPrefix(newRole === Role.TEACHER ? 'T' : 'S');
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide user full name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cred = await api.organizations.createUserUnderOrg(orgId, {
        role,
        name: name.trim(),
        customId: customId.trim() || undefined,
      });

      setGeneratedCredentials([cred]);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create user credentials';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.organizations.batchCreateUsersUnderOrg(orgId, {
        role,
        count: batchCount,
        prefix: batchPrefix.trim() || undefined,
        startNumber,
      });

      setGeneratedCredentials(res.credentials);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to batch generate credentials';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedCredentials) return;
    const text = generatedCredentials
      .map(
        (c) =>
          `Role: ${c.role}\nName: ${c.name}\nEmail: ${c.email}\nPassword: ${c.rawPassword}\n---`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadCsv = () => {
    if (!generatedCredentials) return;
    const header = 'Role,Name,Email,Password,Organization\n';
    const rows = generatedCredentials
      .map((c) => `"${c.role}","${c.name}","${c.email}","${c.rawPassword}","${c.organizationName}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${orgSlug}_${role.toLowerCase()}_credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setName('');
    setCustomId('');
    setError(null);
    setGeneratedCredentials(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={generatedCredentials ? 'Generated Login Credentials' : `Generate Credentials — ${orgName}`}
    >
      {generatedCredentials ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <span>✓</span> {generatedCredentials.length} User Account(s) Ready!
            </div>
            <p className="text-xs text-slate-300">
              Users can immediately sign into their respective portal using these credentials.
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {generatedCredentials.map((c, i) => (
              <div
                key={c.id || i}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">{c.name}</span>
                  <Badge variant={c.role === Role.TEACHER ? 'info' : 'success'} size="sm">
                    {c.role}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Login Email</span>
                    <code className="text-indigo-300 font-mono font-medium">{c.email}</code>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Auto-Generated Password</span>
                    <code className="text-amber-300 font-mono font-bold select-all bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {c.rawPassword}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-xs h-8" onClick={copyToClipboard}>
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy All'}
              </Button>
              <Button variant="secondary" className="text-xs h-8" onClick={downloadCsv}>
                📥 Export CSV
              </Button>
            </div>
            <Button variant="primary" className="text-xs h-8" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab('single')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                tab === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single User
            </button>
            <button
              type="button"
              onClick={() => setTab('batch')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                tab === 'batch' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Batch Generate (N Users)
            </button>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange(Role.TEACHER)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === Role.TEACHER
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-white">Teacher</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Format: teacher_id@{orgSlug}.io</p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange(Role.STUDENT)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === Role.STUDENT
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-white">Student</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Format: student_id@{orgSlug}.io</p>
              </button>
            </div>
          </div>

          {tab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. Dr. Jane Smith or Alex Turner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />

              <div>
                <Input
                  label="Identifier / ID (Optional)"
                  placeholder={role === Role.TEACHER ? 'e.g. T101, prof_smith' : 'e.g. S501, john24'}
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                />
                <div className="mt-1.5 p-2 bg-slate-950 border border-slate-800 rounded-md text-xs">
                  <span className="text-slate-400">Generated Email: </span>
                  <code className="text-indigo-300 font-mono font-semibold">{emailPreview}</code>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1">
                <div className="text-slate-300 font-medium">🔑 Password Generation:</div>
                <p className="text-[11px] text-slate-400">
                  A random 8-character alphanumeric password will be generated automatically and shown upon creation.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Generate Credentials
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Count"
                  type="number"
                  min="1"
                  max="100"
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                  required
                />
                <Input
                  label="ID Prefix"
                  value={batchPrefix}
                  onChange={(e) => setBatchPrefix(e.target.value)}
                  placeholder="e.g. T or STU"
                  required
                />
                <Input
                  label="Start Number"
                  type="number"
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 101)}
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-md text-xs space-y-1">
                <span className="text-slate-400">Sample Generated Sequence:</span>
                <div className="font-mono text-[11px] text-indigo-300">
                  {batchPrefix.toLowerCase()}{startNumber}@{orgSlug}.io, {batchPrefix.toLowerCase()}{startNumber + 1}@{orgSlug}.io ...
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Generate {batchCount} Accounts
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};

export default CreateOrgUserModal;
