'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import { useRouter, usePathname } from 'next/navigation';
import { Button, Badge } from '@exam-platform/ui';
import { getStoredUser, clearStoredAuth } from '../../lib/apiClient';

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    router.push('/login');
  };

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Create Exam', href: '/exams/create' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
              EP
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">Exam Platform</span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-400">Teacher Portal</span>
            </div>
          </a>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="h-6 w-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                {user.name ? user.name[0].toUpperCase() : 'T'}
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-slate-200">{user.name || user.email}</div>
                <div className="text-[10px] text-indigo-400 font-semibold uppercase">{user.role}</div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="text-xs h-9 px-3 border-slate-800 hover:border-slate-700 text-slate-300"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
