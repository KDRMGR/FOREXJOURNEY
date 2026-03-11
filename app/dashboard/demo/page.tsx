'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { DemoTrade } from '@/lib/types/database';

const CRYPTO_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];
const DISPLAY: Record<string, string> = {
  BTCUSDT: 'BTC/USDT', ETHUSDT: 'ETH/USDT', SOLUSDT: 'SOL/USDT',
  BNBUSDT: 'BNB/USDT', XRPUSDT: 'XRP/USDT', ADAUSDT: 'ADA/USDT', DOGEUSDT: 'DOGE/USDT',
};

interface Price { symbol: string; price: number; change: number; }

export default function DemoTradingPage() {
  const { user, setUser } = useAuthStore();
  const [prices, setPrices] = useState<Price[]>([]);
  const [trades, setTrades] = useState<DemoTrade[]>([]);
  const [virtualBalance, setVirtualBalance] = useState<number>(10000);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ symbol: 'BTCUSDT', type: 'buy' as 'buy' | 'sell', quantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ name: string; pnl: number; trades: number }[]>([]);
  const [tab, setTab] = useState<'trade' | 'history' | 'leaderboard'>('trade');

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(CRYPTO_PAIRS)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setPrices(data.map((d: { symbol: string; lastPrice: string; priceChangePercent: string }) => ({
          symbol: d.symbol,
          price: parseFloat(d.lastPrice),
          change: parseFloat(d.priceChangePercent),
        })));
      }
    } catch { /* network error */ }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    if (user) {
      fetchTrades();
      fetchLeaderboard();
      setVirtualBalance(user.virtual_balance ?? 10000);
    }
  }, [user]);

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('demo_trades').select('*').eq('user_id', user!.id)
      .order('opened_at', { ascending: false });
    if (data) setTrades(data as DemoTrade[]);
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    // Get users with their demo trade P&L
    const { data } = await supabase
      .from('demo_trades')
      .select('user_id, profit_loss, profiles(full_name, email)')
      .eq('status', 'closed');
    if (data) {
      const map: Record<string, { name: string; pnl: number; trades: number }> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.forEach((t: any) => {
        const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
        if (!map[t.user_id]) map[t.user_id] = { name: profile?.full_name || profile?.email?.split('@')[0] || 'Trader', pnl: 0, trades: 0 };
        map[t.user_id].pnl += t.profit_loss;
        map[t.user_id].trades += 1;
      });
      const sorted = Object.values(map).sort((a, b) => b.pnl - a.pnl).slice(0, 10);
      setLeaderboard(sorted);
    }
  };

  const currentPrice = (symbol: string) => prices.find((p) => p.symbol === symbol)?.price ?? 0;

  const openTrade = async () => {
    const qty = parseFloat(form.quantity);
    if (!qty || qty <= 0 || !user) return;
    const price = currentPrice(form.symbol);
    if (!price) return;

    const cost = price * qty;
    if (cost > virtualBalance) {
      alert('Insufficient virtual balance');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('demo_trades').insert({
      user_id: user.id,
      pair: DISPLAY[form.symbol],
      trade_type: form.type,
      entry_price: price,
      quantity: qty,
      profit_loss: 0,
      status: 'open',
    });

    if (!error) {
      const newBalance = virtualBalance - (form.type === 'buy' ? cost : 0);
      await supabase.from('profiles').update({ virtual_balance: newBalance }).eq('id', user.id);
      setVirtualBalance(newBalance);
      setUser({ ...user, virtual_balance: newBalance });
      setForm({ ...form, quantity: '' });
      fetchTrades();
    }
    setSubmitting(false);
  };

  const closeTrade = async (trade: DemoTrade) => {
    const exitPrice = currentPrice(CRYPTO_PAIRS.find((s) => DISPLAY[s] === trade.pair) ?? '') || trade.entry_price;
    const pnl = trade.trade_type === 'buy'
      ? (exitPrice - trade.entry_price) * trade.quantity
      : (trade.entry_price - exitPrice) * trade.quantity;

    const newBalance = virtualBalance + trade.entry_price * trade.quantity * (trade.trade_type === 'buy' ? 1 : 0) + pnl;

    await supabase.from('demo_trades').update({
      exit_price: exitPrice, profit_loss: pnl, status: 'closed', closed_at: new Date().toISOString(),
    }).eq('id', trade.id);

    await supabase.from('profiles').update({ virtual_balance: newBalance }).eq('id', user!.id);
    setVirtualBalance(newBalance);
    if (user) setUser({ ...user, virtual_balance: newBalance });
    setClosingId(null);
    fetchTrades();
  };

  const resetBalance = async () => {
    if (!confirm('Reset virtual balance to $10,000? This cannot be undone.')) return;
    await supabase.from('demo_trades').delete().eq('user_id', user!.id);
    await supabase.from('profiles').update({ virtual_balance: 10000 }).eq('id', user!.id);
    setVirtualBalance(10000);
    setTrades([]);
  };

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const totalPnL = closedTrades.reduce((s, t) => s + t.profit_loss, 0);
  const wins = closedTrades.filter((t) => t.profit_loss > 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
  const selectedPrice = currentPrice(form.symbol);
  const estimatedCost = selectedPrice * parseFloat(form.quantity || '0');

  return (
    <div className="p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Demo Trading</h1>
          <p className="text-gray-400">Practice with virtual funds. Real prices, zero risk.</p>
        </div>
        <button onClick={resetBalance} className="text-xs text-gray-500 hover:text-red-400 transition">Reset balance</button>
      </div>

      {/* Balance + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-white/70 mb-1">Virtual Balance</p>
          <p className="text-2xl font-bold text-white">${virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total P&L</p>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Win Rate</p>
          <p className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>{winRate}%</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Open Trades</p>
          <p className="text-2xl font-bold text-blue-400">{openTrades.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['trade', 'history', 'leaderboard'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'trade' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trade form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Open Position</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Asset</label>
                <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500">
                  {CRYPTO_PAIRS.map((s) => {
                    const p = prices.find((pr) => pr.symbol === s);
                    return <option key={s} value={s}>{DISPLAY[s]} — ${p ? p.price.toLocaleString() : '...'}</option>;
                  })}
                </select>
              </div>

              {/* Current price */}
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-xs text-gray-400">Market Price</p>
                <p className="text-2xl font-bold text-white font-mono">
                  ${selectedPrice ? selectedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </p>
                {prices.find((p) => p.symbol === form.symbol) && (
                  <p className={`text-sm ${(prices.find((p) => p.symbol === form.symbol)?.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(prices.find((p) => p.symbol === form.symbol)?.change ?? 0) >= 0 ? '▲' : '▼'}
                    {Math.abs(prices.find((p) => p.symbol === form.symbol)?.change ?? 0).toFixed(2)}%
                  </p>
                )}
              </div>

              {/* Direction */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setForm({ ...form, type: 'buy' })}
                  className={`py-2.5 rounded-lg font-bold text-sm transition ${form.type === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}>
                  BUY / Long
                </button>
                <button onClick={() => setForm({ ...form, type: 'sell' })}
                  className={`py-2.5 rounded-lg font-bold text-sm transition ${form.type === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}>
                  SELL / Short
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Quantity</label>
                <input type="number" step="any" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 0.01"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>

              {form.quantity && selectedPrice > 0 && (
                <div className="bg-gray-900 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated cost</span>
                    <span className="text-white font-semibold">${estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">After balance</span>
                    <span className={estimatedCost > virtualBalance ? 'text-red-400' : 'text-green-400'}>
                      ${(virtualBalance - (form.type === 'buy' ? estimatedCost : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button onClick={openTrade} disabled={submitting || !form.quantity || parseFloat(form.quantity) <= 0}
                className={`w-full py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${form.type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {submitting ? 'Opening...' : `${form.type === 'buy' ? 'BUY' : 'SELL'} ${DISPLAY[form.symbol]?.split('/')[0]}`}
              </button>
            </div>
          </div>

          {/* Open positions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-4">Open Positions ({openTrades.length})</h2>
            {openTrades.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center text-gray-400">
                <p>No open positions.</p>
                <p className="text-sm mt-1">Open a trade to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openTrades.map((trade) => {
                  const symbol = CRYPTO_PAIRS.find((s) => DISPLAY[s] === trade.pair);
                  const livePrice = symbol ? currentPrice(symbol) : 0;
                  const unrealizedPnL = livePrice
                    ? trade.trade_type === 'buy'
                      ? (livePrice - trade.entry_price) * trade.quantity
                      : (trade.entry_price - livePrice) * trade.quantity
                    : 0;

                  return (
                    <div key={trade.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${trade.trade_type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {trade.trade_type}
                            </span>
                            <span className="font-bold text-white">{trade.pair}</span>
                          </div>
                          <p className="text-xs text-gray-400">{trade.quantity} units · Entry ${trade.entry_price.toLocaleString()}</p>
                          {livePrice > 0 && <p className="text-xs text-gray-400 mt-0.5">Live ${livePrice.toLocaleString()}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">unrealized</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        {closingId === trade.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Close at live price ${livePrice.toLocaleString()}?</span>
                            <button onClick={() => closeTrade(trade)} className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition">Confirm</button>
                            <button onClick={() => setClosingId(null)} className="text-xs bg-gray-700 px-3 py-1.5 rounded-lg transition">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setClosingId(trade.id)} className="text-sm text-gray-400 hover:text-white transition font-medium">
                            Close position →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Trade History ({closedTrades.length})</h2>
          {closedTrades.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No closed trades yet.</div>
          ) : (
            <div className="space-y-2">
              {closedTrades.map((trade) => (
                <div key={trade.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${trade.trade_type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trade.trade_type}
                    </span>
                    <div>
                      <span className="font-medium text-white">{trade.pair}</span>
                      <p className="text-xs text-gray-400">{trade.quantity} units · Entry ${trade.entry_price.toLocaleString()} → Exit ${trade.exit_price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Demo Trading Leaderboard 🏆</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Trader</th>
                  <th className="px-5 py-3 text-left font-semibold">Trades</th>
                  <th className="px-5 py-3 text-right font-semibold">Total P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No trading data yet.</td></tr>
                ) : leaderboard.map((entry, i) => (
                  <tr key={i} className={`transition ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-5 py-3">
                      <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{entry.name}</td>
                    <td className="px-5 py-3 text-gray-400">{entry.trades}</td>
                    <td className={`px-5 py-3 text-right font-bold ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
