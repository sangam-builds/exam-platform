'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 tracking-tight text-lg">
                ExamPlatform
              </span>
              <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                Student Portal
              </span>
            </div>
          </Link>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-indigo-400">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
