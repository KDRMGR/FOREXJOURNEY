'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/dashboard/signals', label: 'Signals', icon: '◎' },
  { href: '/dashboard/courses', label: 'Courses', icon: '◉' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◐' },
];

const adminItems = [
  { href: '/admin', label: 'Admin Overview', icon: '◆' },
  { href: '/admin/signals', label: 'Manage Signals', icon: '◇' },
  { href: '/admin/courses', label: 'Manage Courses', icon: '◈' },
  { href: '/admin/users', label: 'Manage Users', icon: '◉' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            TradePro
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Trading</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {isAdmin() && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-6">Admin</p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between px-3 py-1 mb-1">
            <span className="text-xs text-gray-500">Account</span>
            <NotificationBell />
          </div>
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
              <span className="text-xs text-blue-400 uppercase font-semibold">{user.subscription_tier}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
