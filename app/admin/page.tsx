'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Stats {
  totalUsers: number;
  activeSignals: number;
  publishedCourses: number;
  totalTrades: number;
  totalRevenue: number;
  winRate: number;
}

interface TierDist { tier: string; count: number; }
interface SignalPerf { label: string; count: number; }

const TIER_COLORS: Record<string, string> = {
  free: '#6b7280',
  basic: '#3b82f6',
  premium: '#a855f7',
  vip: '#eab308',
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeSignals: 0, publishedCourses: 0,
    totalTrades: 0, totalRevenue: 0, winRate: 0,
  });
  const [tierDist, setTierDist] = useState<TierDist[]>([]);
  const [signalPerf, setSignalPerf] = useState<SignalPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [users, signals, courses, trades, payments, allSignals] = await Promise.all([
      supabase.from('profiles').select('id, subscription_tier'),
      supabase.from('trading_signals').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('user_trades').select('id, profit_loss, status'),
      supabase.from('payments').select('amount').eq('status', 'completed'),
      supabase.from('trading_signals').select('status'),
    ]);

    const allUsers = users.data ?? [];
    const allTrades = trades.data ?? [];
    const closedTrades = allTrades.filter((t) => t.status === 'closed');
    const wins = closedTrades.filter((t) => t.profit_loss > 0).length;

    // Tier distribution
    const tierCounts: Record<string, number> = { free: 0, basic: 0, premium: 0, vip: 0 };
    allUsers.forEach((u) => { tierCounts[u.subscription_tier] = (tierCounts[u.subscription_tier] ?? 0) + 1; });
    setTierDist(Object.entries(tierCounts).map(([tier, count]) => ({ tier, count })));

    // Signal performance
    const sigData = allSignals.data ?? [];
    setSignalPerf([
      { label: 'Active', count: sigData.filter((s) => s.status === 'active').length },
      { label: 'TP Hit', count: sigData.filter((s) => s.status === 'hit_tp').length },
      { label: 'SL Hit', count: sigData.filter((s) => s.status === 'hit_sl').length },
      { label: 'Expired', count: sigData.filter((s) => s.status === 'expired').length },
    ]);

    const totalRevenue = (payments.data ?? []).reduce((s, p) => s + p.amount, 0);

    setStats({
      totalUsers: allUsers.length,
      activeSignals: signals.count ?? 0,
      publishedCourses: courses.count ?? 0,
      totalTrades: allTrades.length,
      totalRevenue,
      winRate: closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0,
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), href: '/admin/users', color: 'from-blue-600 to-blue-700' },
    { label: 'Active Signals', value: String(stats.activeSignals), href: '/admin/signals', color: 'from-green-600 to-green-700' },
    { label: 'Published Courses', value: String(stats.publishedCourses), href: '/admin/courses', color: 'from-purple-600 to-purple-700' },
    { label: 'Total Trades', value: stats.totalTrades.toLocaleString(), href: '/dashboard', color: 'from-orange-600 to-orange-700' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, href: '#', color: 'from-emerald-600 to-emerald-700' },
    { label: 'Signal Win Rate', value: `${stats.winRate}%`, href: '/admin/signals', color: 'from-cyan-600 to-cyan-700' },
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className={`bg-gradient-to-br ${card.color} rounded-xl p-5 hover:opacity-90 transition cursor-pointer`}>
                <div className="text-xs font-medium text-white/80 mb-1">{card.label}</div>
                <div className="text-3xl font-bold text-white">
                  {loading ? '—' : card.value}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {/* User tier distribution */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Users by Tier</h2>
            {tierDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={tierDist} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={80} label={(props) => `${(props as unknown as TierDist).tier}: ${(props as unknown as TierDist).count}`}>
                    {tierDist.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend formatter={(value) => <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-500">No user data yet</div>
            )}
          </div>

          {/* Signal performance */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Signal Performance</h2>
            {signalPerf.some((s) => s.count > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={signalPerf} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {signalPerf.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={
                          entry.label === 'TP Hit' ? '#22c55e' :
                          entry.label === 'SL Hit' ? '#ef4444' :
                          entry.label === 'Active' ? '#3b82f6' : '#6b7280'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-500">No signal data yet</div>
            )}
          </div>
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
