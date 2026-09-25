'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '../lib/apiClient';

export default function StudentRootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === 'STUDENT') {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Redirecting to Student Portal...</p>
      </div>
    </div>
  );
}
