'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button } from '@exam-platform/ui';
import { api } from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.login({ email, password });
      if (response.user.role !== 'STUDENT') {
        setError('Access denied: Student account required.');
        setLoading(false);
        return;
      }
      login(response.accessToken, response.user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-600 items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-600/30 mb-4">
            EP
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Assessment Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Access assigned exams, take timed assessments, and review feedback
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Student Email"
              type="email"
              placeholder="student@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" className="w-full h-11 text-sm font-semibold" isLoading={loading}>
              Sign In to Student Portal
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Need an account?{' '}
            <span className="text-indigo-400 font-medium">Contact your teacher or test administrator for an invite</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
