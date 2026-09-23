'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Input, Button, Badge } from '@exam-platform/ui';
import { api } from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';

function SetPasswordContent() {
  const router = useRouter();
  const { login } = useAuthStore();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ email: string; role: string } | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token found in link. Please verify your invitation URL.');
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        setLoading(true);
        const res = await api.invites.validateToken(token);
        if (res.valid && res.email && res.role) {
          setTokenInfo({ email: res.email, role: res.role });
        } else {
          setError(res.message || 'Invalid or expired invitation token.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to validate invitation token.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const authRes = await api.invites.redeemInvite({
        token,
        name: name.trim(),
        password,
      });

      login(authRes.accessToken, authRes.user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to activate account.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Verifying invitation token...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Student Registration</h1>
        <p className="text-sm text-slate-400 mt-1">Set up your student account to access assigned assessments</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {tokenInfo && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs text-slate-400">Student Account:</div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">{tokenInfo.email}</span>
              <Badge variant="success" size="sm">{tokenInfo.role}</Badge>
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Create Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-semibold"
            isLoading={submitting}
          >
            Activate Account & Open Portal
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-slate-500">
        Already have an account?{' '}
        <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Sign In
        </a>
      </div>
    </div>
  );
}

export default function StudentSetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-600/30">
            EP
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800 shadow-xl p-6 sm:p-8">
          <Suspense fallback={<div className="text-center text-slate-400 py-8">Loading...</div>}>
            <SetPasswordContent />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
