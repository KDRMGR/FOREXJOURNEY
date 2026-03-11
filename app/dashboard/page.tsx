'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { TradingSignal } from '@/lib/types/database';
import TradingChart from '@/components/trading/TradingChart';
import SignalCard from '@/components/trading/SignalCard';

interface DashboardStats {
  totalPnl: number;
  activeTrades: number;
  tradesInProfit: number;
  winRate: number;
  totalTrades: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPnl: 0, activeTrades: 0, tradesInProfit: 0, winRate: 0, totalTrades: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) { fetchSignals(); fetchStats(); }
  }, [user]);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setSignals(data);
  };

  const fetchStats = async () => {
    if (!user) return;
    const { data: trades } = await supabase
      .from('user_trades')
      .select('profit_loss, status')
      .eq('user_id', user.id);

    if (trades) {
      const closed = trades.filter((t) => t.status === 'closed');
      const active = trades.filter((t) => t.status === 'open');
      const winners = closed.filter((t) => t.profit_loss > 0);
      setStats({
        totalPnl: closed.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
        activeTrades: active.length,
        tradesInProfit: active.filter((t) => t.profit_loss > 0).length,
        winRate: closed.length > 0 ? Math.round((winners.length / closed.length) * 100) : 0,
        totalTrades: closed.length,
      });
    }
    setStatsLoading(false);
  };

  if (isLoading || !user) return null;

  const pnlPositive = stats.totalPnl >= 0;

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {user.full_name || user.email}</p>
        </div>
        <Link href="/dashboard/signals" className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition">
          View All Signals
        </Link>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total P&L',
            value: statsLoading ? null : `${pnlPositive ? '+' : ''}$${stats.totalPnl.toFixed(2)}`,
            sub: `${stats.totalTrades} closed trade${stats.totalTrades !== 1 ? 's' : ''}`,
            color: pnlPositive ? 'text-green-400' : 'text-red-400',
          },
          {
            label: 'Active Trades',
            value: statsLoading ? null : String(stats.activeTrades),
            sub: `${stats.tradesInProfit} in profit`,
            color: 'text-white',
          },
          {
            label: 'Win Rate',
            value: statsLoading ? null : `${stats.winRate}%`,
            sub: stats.totalTrades > 0 ? `Last ${stats.totalTrades} trades` : 'No closed trades yet',
            color: stats.winRate >= 50 ? 'text-green-400' : 'text-red-400',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
            {stat.value === null ? (
              <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
            ) : (
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Signals */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Live Chart</h2>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
                <option value="SOLUSDT">SOL/USDT</option>
                <option value="BNBUSDT">BNB/USDT</option>
                <option value="XRPUSDT">XRP/USDT</option>
              </select>
            </div>
            <TradingChart symbol={selectedPair} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Latest Signals</h2>
              <Link href="/dashboard/signals" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            <div className="space-y-3">
              {signals.length > 0 ? (
                signals.map((signal) => <SignalCard key={signal.id} signal={signal} />)
              ) : (
                <div className="text-center text-gray-400 py-10 text-sm">No active signals</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { href: '/dashboard/signals', label: 'Trading Signals', desc: 'View live signals', border: 'hover:border-green-500' },
          { href: '/dashboard/courses', label: 'Courses', desc: 'Continue learning', border: 'hover:border-purple-500' },
          { href: '/dashboard/profile', label: 'API Keys', desc: 'Connect Binance', border: 'hover:border-yellow-500' },
          { href: '/dashboard/profile', label: 'Upgrade Plan', desc: 'Unlock more features', border: 'hover:border-blue-500' },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className={`bg-gray-800 rounded-xl border border-gray-700 p-4 transition cursor-pointer ${item.border}`}>
              <div className="font-semibold text-sm text-white">{item.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
