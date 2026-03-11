'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { TradingSignal } from '@/lib/types/database';

interface Props {
  signal: TradingSignal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExecuteTradeModal({ signal, onClose, onSuccess }: Props) {
  const { user } = useAuthStore();
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const riskUsd = quantity && signal.stop_loss
    ? Math.abs(signal.entry_price - signal.stop_loss) * parseFloat(quantity)
    : null;
  const potentialProfit = quantity && signal.take_profit
    ? Math.abs(signal.take_profit - signal.entry_price) * parseFloat(quantity)
    : null;
  const rr = riskUsd && potentialProfit ? (potentialProfit / riskUsd).toFixed(1) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quantity || parseFloat(quantity) <= 0) return;
    setSubmitting(true);
    setError('');

    const { error: err } = await supabase.from('user_trades').insert({
      user_id: user.id,
      signal_id: signal.id,
      pair: signal.pair,
      trade_type: signal.signal_type,
      entry_price: signal.entry_price,
      quantity: parseFloat(quantity),
      profit_loss: 0,
      status: 'open',
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Execute Trade</h2>
            <p className="text-sm text-gray-400">{signal.pair} · {signal.signal_type.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Signal summary */}
        <div className="p-6 bg-gray-800/50 border-b border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">Entry</div>
              <div className="font-bold text-white">${signal.entry_price.toLocaleString()}</div>
            </div>
            {signal.take_profit && (
              <div>
                <div className="text-gray-400 text-xs mb-1">Take Profit</div>
                <div className="font-bold text-green-400">${signal.take_profit.toLocaleString()}</div>
              </div>
            )}
            {signal.stop_loss && (
              <div>
                <div className="text-gray-400 text-xs mb-1">Stop Loss</div>
                <div className="font-bold text-red-400">${signal.stop_loss.toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Quantity ({signal.pair.split('/')[0]})
            </label>
            <input
              type="number"
              step="any"
              min="0.000001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="e.g. 0.01"
              autoFocus
            />
          </div>

          {/* Risk/Reward preview */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm border border-gray-700">
              <div className="font-semibold text-gray-300 mb-2">Trade Preview</div>
              <div className="flex justify-between">
                <span className="text-gray-400">Position size</span>
                <span className="text-white">{quantity} × ${signal.entry_price.toLocaleString()}</span>
              </div>
              {riskUsd && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Max risk</span>
                  <span className="text-red-400">-${riskUsd.toFixed(2)}</span>
                </div>
              )}
              {potentialProfit && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Potential profit</span>
                  <span className="text-green-400">+${potentialProfit.toFixed(2)}</span>
                </div>
              )}
              {rr && (
                <div className="flex justify-between pt-1 border-t border-gray-700">
                  <span className="text-gray-400">Risk/Reward</span>
                  <span className={`font-bold ${parseFloat(rr) >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                    1:{rr}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-semibold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !quantity}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 ${
                signal.signal_type === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Opening...' : `${signal.signal_type.toUpperCase()} ${signal.pair.split('/')[0]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
