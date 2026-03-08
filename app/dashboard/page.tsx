'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { TradingSignal } from '@/lib/types/database';
import TradingChart from '@/components/trading/TradingChart';
import SignalCard from '@/components/trading/SignalCard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSignals();
    }
  }, [user]);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setSignals(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                TradePro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {user.email}
              </span>
              <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-semibold uppercase">
                {user.subscription_tier}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Trading Dashboard</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Live Chart</h2>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                >
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                  <option value="SOLUSDT">SOL/USDT</option>
                  <option value="BNBUSDT">BNB/USDT</option>
                </select>
              </div>
              <TradingChart symbol={selectedPair} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="text-gray-400 text-sm mb-1">Total Profit</div>
                <div className="text-2xl font-bold text-green-500">+$2,450.00</div>
                <div className="text-xs text-gray-500 mt-1">+12.5% this month</div>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="text-gray-400 text-sm mb-1">Active Trades</div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-xs text-gray-500 mt-1">3 in profit</div>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="text-gray-400 text-sm mb-1">Win Rate</div>
                <div className="text-2xl font-bold">68%</div>
                <div className="text-xs text-gray-500 mt-1">Last 30 trades</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">Latest Signals</h2>
              <div className="space-y-4">
                {signals.length > 0 ? (
                  signals.map((signal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No active signals
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
