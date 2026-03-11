'use client';

import { useEffect, useState } from 'react';

interface Price {
  symbol: string;
  price: string;
  change: number;
}

const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];

const LABELS: Record<string, string> = {
  BTCUSDT: 'BTC/USDT',
  ETHUSDT: 'ETH/USDT',
  SOLUSDT: 'SOL/USDT',
  BNBUSDT: 'BNB/USDT',
  XRPUSDT: 'XRP/USDT',
  ADAUSDT: 'ADA/USDT',
};

export default function PriceTicker() {
  const [prices, setPrices] = useState<Price[]>([]);

  useEffect(() => {
    // Fetch initial 24hr stats
    const fetchPrices = async () => {
      try {
        const results = await Promise.all(
          PAIRS.map(async (symbol) => {
            const res = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
            );
            const data = await res.json();
            return {
              symbol,
              price: parseFloat(data.lastPrice).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              }),
              change: parseFloat(data.priceChangePercent),
            };
          })
        );
        setPrices(results);
      } catch {
        // Silently fail — ticker is decorative
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) {
    return (
      <div className="bg-gray-900 border-b border-gray-800 h-10 flex items-center px-4">
        <div className="flex gap-8 animate-pulse">
          {PAIRS.map((p) => (
            <div key={p} className="h-4 w-28 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-b border-gray-800 overflow-hidden">
      <div className="flex items-center h-10">
        {/* Scrolling ticker */}
        <div className="flex animate-marquee whitespace-nowrap gap-10 px-6">
          {[...prices, ...prices].map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-gray-300 font-medium">{LABELS[p.symbol]}</span>
              <span className="text-white font-semibold">${p.price}</span>
              <span className={`text-xs font-semibold ${p.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
