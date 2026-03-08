'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TradingSignal } from '@/lib/types/database';

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT'];

const emptyForm = {
  pair: 'BTC/USDT',
  signal_type: 'buy' as 'buy' | 'sell',
  entry_price: '',
  stop_loss: '',
  take_profit: '',
  confidence_level: 'medium' as 'low' | 'medium' | 'high',
  notes: '',
};

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchSignals(); }, []);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSignals(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSubmitting(false); return; }

    const { error: err } = await supabase.from('trading_signals').insert({
      pair: form.pair,
      signal_type: form.signal_type,
      entry_price: parseFloat(form.entry_price),
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      confidence_level: form.confidence_level,
      notes: form.notes || null,
      created_by: user.id,
      status: 'active',
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess('Signal published successfully!');
      setForm(emptyForm);
      fetchSignals();
      setTimeout(() => setSuccess(''), 4000);
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('trading_signals').update({ status }).eq('id', id);
    setSignals((prev) => prev.map((s) => s.id === id ? { ...s, status: status as any } : s));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'hit_tp': return 'text-blue-400';
      case 'hit_sl': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Signal Management</h1>
          <p className="text-sm text-gray-400">Push live trading signals to subscribers</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Admin</Link>
      </div>

      <div className="p-8 grid lg:grid-cols-2 gap-8">
        {/* Create signal form */}
        <div>
          <h2 className="text-xl font-bold mb-5">Push New Signal</h2>
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Pair</label>
                <select
                  value={form.pair}
                  onChange={(e) => setForm({ ...form, pair: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAIRS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Direction</label>
                <select
                  value={form.signal_type}
                  onChange={(e) => setForm({ ...form, signal_type: e.target.value as 'buy' | 'sell' })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="buy">BUY</option>
                  <option value="sell">SELL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Entry Price *</label>
              <input
                type="number"
                step="any"
                required
                value={form.entry_price}
                onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 60200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={form.stop_loss}
                  onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 59800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  value={form.take_profit}
                  onChange={(e) => setForm({ ...form, take_profit: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 62000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Confidence</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm({ ...form, confidence_level: lvl })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                      form.confidence_level === lvl
                        ? lvl === 'high' ? 'bg-green-600 text-white' : lvl === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Optional analysis notes..."
              />
            </div>

            {error && <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">{error}</div>}
            {success && <div className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg p-3">{success}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-lg font-bold transition"
            >
              {submitting ? 'Publishing...' : 'Publish Signal'}
            </button>
          </form>
        </div>

        {/* Recent signals */}
        <div>
          <h2 className="text-xl font-bold mb-5">Recent Signals</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div key={signal.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{signal.pair}</span>
                        <span className={`text-xs font-semibold uppercase ${signal.signal_type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {signal.signal_type}
                        </span>
                        <span className={`text-xs font-semibold ${statusColor(signal.status)}`}>
                          • {signal.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Entry: ${signal.entry_price}
                        {signal.stop_loss && ` · SL: $${signal.stop_loss}`}
                        {signal.take_profit && ` · TP: $${signal.take_profit}`}
                      </div>
                    </div>
                    {signal.status === 'active' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(signal.id, 'hit_tp')}
                          className="text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-2 py-1 rounded transition"
                        >
                          TP
                        </button>
                        <button
                          onClick={() => updateStatus(signal.id, 'hit_sl')}
                          className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1 rounded transition"
                        >
                          SL
                        </button>
                        <button
                          onClick={() => updateStatus(signal.id, 'expired')}
                          className="text-xs bg-gray-600/20 hover:bg-gray-600 text-gray-400 hover:text-white px-2 py-1 rounded transition"
                        >
                          Expire
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
