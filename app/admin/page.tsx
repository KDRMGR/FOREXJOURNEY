'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  activeSignals: number;
  publishedCourses: number;
  totalTrades: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeSignals: 0, publishedCourses: 0, totalTrades: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [users, signals, courses, trades] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('trading_signals').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('user_trades').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalUsers: users.count ?? 0,
      activeSignals: signals.count ?? 0,
      publishedCourses: courses.count ?? 0,
      totalTrades: trades.count ?? 0,
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, href: '/admin/users', color: 'from-blue-600 to-blue-700' },
    { label: 'Active Signals', value: stats.activeSignals, href: '/admin/signals', color: 'from-green-600 to-green-700' },
    { label: 'Published Courses', value: stats.publishedCourses, href: '/admin/courses', color: 'from-purple-600 to-purple-700' },
    { label: 'Total Trades', value: stats.totalTrades, href: '/dashboard', color: 'from-orange-600 to-orange-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-400 text-sm">Platform management and analytics</p>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className={`bg-gradient-to-br ${card.color} rounded-xl p-6 hover:opacity-90 transition cursor-pointer`}>
                <div className="text-sm font-medium text-white/80 mb-1">{card.label}</div>
                <div className="text-4xl font-bold text-white">
                  {loading ? '—' : card.value.toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="text-xl font-bold mb-5">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/signals">
            <div className="bg-gray-800 border border-gray-700 hover:border-green-500 rounded-xl p-6 transition cursor-pointer">
              <div className="text-2xl mb-3">◎</div>
              <h3 className="text-lg font-bold mb-1">Push Signal</h3>
              <p className="text-sm text-gray-400">Create and broadcast a new trading signal to all users</p>
            </div>
          </Link>
          <Link href="/admin/courses">
            <div className="bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-6 transition cursor-pointer">
              <div className="text-2xl mb-3">◉</div>
              <h3 className="text-lg font-bold mb-1">Manage Courses</h3>
              <p className="text-sm text-gray-400">Create and publish educational content and lessons</p>
            </div>
          </Link>
          <Link href="/admin/users">
            <div className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl p-6 transition cursor-pointer">
              <div className="text-2xl mb-3">◐</div>
              <h3 className="text-lg font-bold mb-1">Manage Users</h3>
              <p className="text-sm text-gray-400">View users, manage roles and subscription tiers</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
