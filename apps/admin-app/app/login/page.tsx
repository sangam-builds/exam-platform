'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@exam-platform/ui';
import { api, setStoredAuth } from '../../lib/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@examplatform.local');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.login({ email, password });
      if (response.user.role !== 'ADMIN') {
        setError('Access denied: Admin privileges required.');
        setLoading(false);
        return;
      }
      setStoredAuth(response.accessToken, response.user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-600 items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-600/30 mb-4">
            EP
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Exam Platform System Governance & User Access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@examplatform.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              Sign In to Admin Portal
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              Default Seed Account: <code className="text-indigo-400">admin@examplatform.local</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
