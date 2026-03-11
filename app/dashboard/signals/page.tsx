'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { TradingSignal } from '@/lib/types/database';
import SignalCard from '@/components/trading/SignalCard';
import { UpgradeGate } from '@/components/ui/UpgradeGate';

type StatusFilter = 'active' | 'hit_tp' | 'hit_sl' | 'expired' | 'all';

// Free users see 3 signals max; basic+ see all
const FREE_SIGNAL_LIMIT = 3;

export default function SignalsPage() {
  const { user } = useAuthStore();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('active');

  const tier = user?.subscription_tier ?? 'free';
  const isLimited = tier === 'free';

  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel('trading_signals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_signals' }, (payload) => {
        if (payload.eventType === 'INSERT') setSignals((prev) => [payload.new as TradingSignal, ...prev]);
        else if (payload.eventType === 'UPDATE') setSignals((prev) => prev.map((s) => s.id === payload.new.id ? payload.new as TradingSignal : s));
        else if (payload.eventType === 'DELETE') setSignals((prev) => prev.filter((s) => s.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setSignals(data);
    setLoading(false);
  };

  const allFiltered = filter === 'all' ? signals : signals.filter((s) => s.status === filter);
  // Free tier: only see first 3 active signals; rest are gated
  const visibleSignals = isLimited ? allFiltered.slice(0, FREE_SIGNAL_LIMIT) : allFiltered;
  const hiddenCount = isLimited ? Math.max(0, allFiltered.length - FREE_SIGNAL_LIMIT) : 0;

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', cls: 'bg-green-500/10 text-green-400 border-green-500/20' };
      case 'hit_tp': return { label: 'TP Hit', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'hit_sl': return { label: 'SL Hit', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
      case 'expired': return { label: 'Expired', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
      default: return { label: status, cls: '' };
    }
  };

  const counts = {
    all: signals.length,
    active: signals.filter((s) => s.status === 'active').length,
    hit_tp: signals.filter((s) => s.status === 'hit_tp').length,
    hit_sl: signals.filter((s) => s.status === 'hit_sl').length,
    expired: signals.filter((s) => s.status === 'expired').length,
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Trading Signals</h1>
            <p className="text-gray-400">Live signals from expert analysts — updates in real-time</p>
          </div>
          <span className="flex items-center gap-2 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Tier notice for free users */}
        {isLimited && (
          <div className="mt-4 flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-3">
            <span className="text-sm text-blue-300">
              Free plan: viewing {FREE_SIGNAL_LIMIT} of {counts.active} active signals
            </span>
            <Link href="/dashboard/profile" className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition">
              Upgrade for full access
            </Link>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['active', 'hit_tp', 'hit_sl', 'expired'] as const).map((status) => (
          <div key={status} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-gray-400 text-xs mb-1">{statusLabel(status).label}</div>
            <div className="text-2xl font-bold text-white">{counts[status]}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'hit_tp', 'hit_sl', 'expired'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {s === 'hit_tp' ? 'TP Hit' : s === 'hit_sl' ? 'SL Hit' : s.charAt(0).toUpperCase() + s.slice(1)}{' '}
            <span className="text-xs opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-48 animate-pulse" />)}
        </div>
      ) : allFiltered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No signals in this category.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSignals.map((signal) => (
              <div key={signal.id} className="relative">
                {signal.status !== 'active' && (
                  <div className={`absolute top-3 right-3 z-10 text-xs font-semibold px-2 py-0.5 rounded border ${statusLabel(signal.status).cls}`}>
                    {statusLabel(signal.status).label}
                  </div>
                )}
                <SignalCard signal={signal} />
              </div>
            ))}
          </div>

          {/* Upgrade gate for hidden signals */}
          {hiddenCount > 0 && user && (
            <div className="mt-6">
              <UpgradeGate currentTier={user.subscription_tier} requiredTier="basic" feature={`+${hiddenCount} more signals locked`}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allFiltered.slice(FREE_SIGNAL_LIMIT).map((signal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
              </UpgradeGate>
            </div>
          )}
        </>
      )}
    </div>
  );
}
