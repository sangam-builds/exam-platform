'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Button } from '@exam-platform/ui';
import { clearStoredAuth, getStoredUser } from '../../lib/apiClient';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/organizations', label: 'Organizations' },
    { href: '/users', label: 'All Users' },
    { href: '/users/teachers', label: 'Teachers' },
    { href: '/users/students', label: 'Students' },
    { href: '/logs', label: 'Audit Logs' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              EP
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 leading-none">ExamPlatform</span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                Admin Console
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="h-6 w-6 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-xs font-medium text-indigo-300">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span className="text-xs font-medium text-slate-300 max-w-[140px] truncate">
                {user.name || user.email}
              </span>
              <Badge variant="purple" size="sm">
                ADMIN
              </Badge>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} className="text-xs px-3 py-1.5 h-8">
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
