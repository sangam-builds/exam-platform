'use client';

import React, { useState } from 'react';
import { Modal, Input, Button, Badge } from '@exam-platform/ui';
import { Role } from '@exam-platform/shared-types';
import { api } from '../../lib/apiClient';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: Role;
  onUserAdded?: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  defaultRole = Role.TEACHER,
  onUserAdded,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ token: string; email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const invite = await api.invites.createInvite({
        email: email.trim().toLowerCase(),
        role,
      });

      setSuccessResult({
        token: invite.token,
        email: invite.email,
      });

      if (onUserAdded) {
        onUserAdded();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch invite';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite New User">
      {successResult ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <span>✓</span> Invitation Dispatched!
            </div>
            <p className="text-xs text-slate-300">
              An invitation email has been queued for <strong className="text-white">{successResult.email}</strong>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 font-medium block mb-1">Direct Redemption Token:</span>
            <code className="text-xs font-mono text-indigo-300 break-all select-all">
              {successResult.token}
            </code>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSuccessResult(null);
                setEmail('');
              }}
            >
              Invite Another
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@institution.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assign Platform Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole(Role.TEACHER)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === Role.TEACHER
                    ? 'bg-indigo-950/40 border-indigo-600 ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-white">Teacher</span>
                  <Badge variant="info" size="sm">Instructor</Badge>
                </div>
                <p className="text-xs text-slate-400">Can create questions, author exams, and review student grades.</p>
              </button>

              <button
                type="button"
                onClick={() => setRole(Role.STUDENT)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === Role.STUDENT
                    ? 'bg-indigo-950/40 border-indigo-600 ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-white">Student</span>
                  <Badge variant="success" size="sm">Candidate</Badge>
                </div>
                <p className="text-xs text-slate-400">Can take assigned exams, review attempts and performance analytics.</p>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AddUserModal;
