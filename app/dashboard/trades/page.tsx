'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { UserTrade } from '@/lib/types/database';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface PnLPoint { date: string; cumulative: number; }

export default function TradesPage() {
  const { user } = useAuthStore();
  const [trades, setTrades] = useState<UserTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitPrices, setExitPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchTrades();
  }, [user]);

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('user_trades')
      .select('*')
      .eq('user_id', user!.id)
      .order('opened_at', { ascending: false });
    if (data) setTrades(data as UserTrade[]);
    setLoading(false);
  };

  const closeTrade = async (trade: UserTrade) => {
    const exitPrice = parseFloat(exitPrices[trade.id] || '0');
    if (!exitPrice || exitPrice <= 0) return;

    const pnl =
      trade.trade_type === 'buy'
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity;

    await supabase
      .from('user_trades')
      .update({ exit_price: exitPrice, profit_loss: pnl, status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', trade.id);

    setClosingId(null);
    setExitPrices((prev) => { const n = { ...prev }; delete n[trade.id]; return n; });
    fetchTrades();
  };

  const filtered = filter === 'all' ? trades : trades.filter((t) => t.status === filter);

  // Build cumulative P&L for closed trades
  const pnlData: PnLPoint[] = (() => {
    const closed = [...trades]
      .filter((t) => t.status === 'closed' && t.closed_at)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());
    let cumulative = 0;
    return closed.map((t) => {
      cumulative += t.profit_loss;
      return { date: new Date(t.closed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  })();

  const totalPnL = trades.filter((t) => t.status === 'closed').reduce((s, t) => s + t.profit_loss, 0);
  const winCount = trades.filter((t) => t.status === 'closed' && t.profit_loss > 0).length;
  const closedCount = trades.filter((t) => t.status === 'closed').length;
  const winRate = closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 0;
  const openCount = trades.filter((t) => t.status === 'open').length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">My Trades</h1>
        <p className="text-gray-400">Track your open positions and trade history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total P&L" value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`} color={totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} />
        <StatCard label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? 'text-green-400' : 'text-yellow-400'} />
        <StatCard label="Open Trades" value={String(openCount)} color="text-blue-400" />
        <StatCard label="Closed Trades" value={String(closedCount)} color="text-gray-300" />
      </div>

      {/* P&L Chart */}
      {pnlData.length > 1 && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Cumulative P&L</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pnlData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cumulative P&L']}
              />
              <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} fill="url(#pnlGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'closed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No trades found.</p>
          <p className="text-sm mt-1">Go to Signals to execute your first trade.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => (
            <div key={trade.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                    trade.trade_type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.trade_type}
                  </span>
                  <div>
                    <span className="font-bold text-white">{trade.pair}</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {trade.quantity} units · Entry ${trade.entry_price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  {trade.status === 'closed' ? (
                    <>
                      <p className={`font-bold text-lg ${trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">Exit ${trade.exit_price?.toLocaleString()}</p>
                    </>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold">
                      Open
                    </span>
                  )}
                </div>
              </div>

              {/* Close trade form for open trades */}
              {trade.status === 'open' && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  {closingId === trade.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Exit price"
                        value={exitPrices[trade.id] || ''}
                        onChange={(e) => setExitPrices((prev) => ({ ...prev, [trade.id]: e.target.value }))}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        autoFocus
                      />
                      <button
                        onClick={() => closeTrade(trade)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setClosingId(null)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setClosingId(trade.id)}
                      className="text-sm text-gray-400 hover:text-white transition font-medium"
                    >
                      Close position →
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Opened {new Date(trade.opened_at).toLocaleString()}
                {trade.closed_at && ` · Closed ${new Date(trade.closed_at).toLocaleString()}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
