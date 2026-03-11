'use client';

import { useState } from 'react';
import { TradingSignal } from '@/lib/types/database';
import ExecuteTradeModal from './ExecuteTradeModal';

interface SignalCardProps {
  signal: TradingSignal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const [showModal, setShowModal] = useState(false);

  const getSignalTypeColor = (type: string) => {
    return type === 'buy' ? 'text-green-500' : 'text-red-500';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{signal.pair}</span>
            <span className={`text-sm font-semibold uppercase ${getSignalTypeColor(signal.signal_type)}`}>
              {signal.signal_type}
            </span>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(signal.confidence_level)}`}>
            {signal.confidence_level}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Entry:</span>
            <span className="font-semibold">${signal.entry_price.toFixed(2)}</span>
          </div>

          {signal.take_profit && (
            <div className="flex justify-between">
              <span className="text-gray-400">Take Profit:</span>
              <span className="font-semibold text-green-500">${signal.take_profit.toFixed(2)}</span>
            </div>
          )}

          {signal.stop_loss && (
            <div className="flex justify-between">
              <span className="text-gray-400">Stop Loss:</span>
              <span className="font-semibold text-red-500">${signal.stop_loss.toFixed(2)}</span>
            </div>
          )}
        </div>

        {signal.notes && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400">{signal.notes}</p>
          </div>
        )}

        <div className="mt-3">
          {signal.status === 'active' ? (
            <button
              onClick={() => setShowModal(true)}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                signal.signal_type === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {signal.signal_type === 'buy' ? 'BUY' : 'SELL'} {signal.pair.split('/')[0]}
            </button>
          ) : (
            <div className="w-full py-2 rounded-lg text-sm font-semibold text-center bg-gray-700 text-gray-500 cursor-not-allowed">
              Signal Closed
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ExecuteTradeModal
          signal={signal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
}
