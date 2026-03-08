'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TradingSignal } from '@/lib/types/database';
import SignalCard from '@/components/trading/SignalCard';

type StatusFilter = 'active' | 'hit_tp' | 'hit_sl' | 'expired' | 'all';

export default function SignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('active');

  useEffect(() => {
    fetchSignals();

    // Real-time subscription for new signals
    const channel = supabase
      .channel('trading_signals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trading_signals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSignals((prev) => [payload.new as TradingSignal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSignals((prev) =>
              prev.map((s) => s.id === payload.new.id ? payload.new as TradingSignal : s)
            );
          } else if (payload.eventType === 'DELETE') {
            setSignals((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
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

  const filtered = filter === 'all' ? signals : signals.filter((s) => s.status === filter);

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
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(['active', 'hit_tp', 'hit_sl', 'expired'] as const).map((status) => {
          const { label, cls } = statusLabel(status);
          return (
            <div key={status} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="text-gray-400 text-xs mb-1">{label}</div>
              <div className="text-2xl font-bold text-white">{counts[status]}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'hit_tp', 'hit_sl', 'expired'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {s === 'hit_tp' ? 'TP Hit' : s === 'hit_sl' ? 'SL Hit' : s.charAt(0).toUpperCase() + s.slice(1)}
            {' '}
            <span className="text-xs opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No signals in this category.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((signal) => (
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
      )}
    </div>
  );
}
