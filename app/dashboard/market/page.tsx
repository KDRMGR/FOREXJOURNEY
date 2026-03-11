'use client';

import { useEffect, useState, useCallback } from 'react';

const CRYPTO = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT'];
const LABELS: Record<string, { name: string; symbol: string }> = {
  BTCUSDT:   { name: 'Bitcoin',   symbol: 'BTC' },
  ETHUSDT:   { name: 'Ethereum',  symbol: 'ETH' },
  SOLUSDT:   { name: 'Solana',    symbol: 'SOL' },
  BNBUSDT:   { name: 'BNB',       symbol: 'BNB' },
  XRPUSDT:   { name: 'XRP',       symbol: 'XRP' },
  ADAUSDT:   { name: 'Cardano',   symbol: 'ADA' },
  DOGEUSDT:  { name: 'Dogecoin',  symbol: 'DOGE' },
  AVAXUSDT:  { name: 'Avalanche', symbol: 'AVAX' },
  DOTUSDT:   { name: 'Polkadot',  symbol: 'DOT' },
  MATICUSDT: { name: 'Polygon',   symbol: 'MATIC' },
};

interface Ticker {
  symbol: string;
  price: number;
  change: number;
  changeAmt: number;
  high: number;
  low: number;
  volume: number;
}

interface NewsItem {
  title: string;
  source: string;
  url: string;
  time: string;
}

// Static crypto news feed (replace with real API key when available)
const STATIC_NEWS: NewsItem[] = [
  { title: 'Bitcoin reaches new monthly high amid institutional buying', source: 'CoinDesk', url: '#', time: '2h ago' },
  { title: 'Ethereum Layer 2 networks see record transaction volumes', source: 'The Block', url: '#', time: '4h ago' },
  { title: 'SEC approves new crypto ETF applications for major assets', source: 'Bloomberg', url: '#', time: '6h ago' },
  { title: 'Solana DeFi ecosystem grows to $8B in total value locked', source: 'Decrypt', url: '#', time: '8h ago' },
  { title: 'Fed signals potential rate cuts boosting risk assets', source: 'Reuters', url: '#', time: '10h ago' },
  { title: 'Major exchange reports record crypto trading volumes in Q1', source: 'CoinTelegraph', url: '#', time: '12h ago' },
];

export default function MarketPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'market' | 'change' | 'volume'>('market');

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(CRYPTO)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsed: Ticker[] = data.map((d: {
          symbol: string; lastPrice: string; priceChangePercent: string;
          priceChange: string; highPrice: string; lowPrice: string; volume: string;
        }) => ({
          symbol: d.symbol,
          price: parseFloat(d.lastPrice),
          change: parseFloat(d.priceChangePercent),
          changeAmt: parseFloat(d.priceChange),
          high: parseFloat(d.highPrice),
          low: parseFloat(d.lowPrice),
          volume: parseFloat(d.volume),
        }));
        setTickers(parsed);
        setLastUpdated(new Date());
        setLoading(false);
      }
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const sorted = [...tickers].sort((a, b) => {
    if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change);
    if (sortBy === 'volume') return b.volume - a.volume;
    return 0; // market order as-is
  });

  const topGainers = [...tickers].filter((t) => t.change > 0).sort((a, b) => b.change - a.change).slice(0, 3);
  const topLosers  = [...tickers].filter((t) => t.change < 0).sort((a, b) => a.change - b.change).slice(0, 3);

  const fmt = (n: number, digits = 2) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  return (
    <div className="p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Live Market</h1>
          <p className="text-gray-400 text-sm">
            Real-time prices from Binance · Refreshes every 10s
            {lastUpdated && <span className="ml-2 text-gray-500">· Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${loading ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'} text-xs font-semibold`}>
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
          {loading ? 'Loading' : 'Live'}
        </div>
      </div>

      {/* Movers */}
      {!loading && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-3">Top Gainers</p>
            <div className="space-y-2">
              {topGainers.map((t) => (
                <div key={t.symbol} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{LABELS[t.symbol]?.symbol ?? t.symbol}</span>
                  <span className="text-sm font-bold text-green-400">+{t.change.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">Top Losers</p>
            <div className="space-y-2">
              {topLosers.map((t) => (
                <div key={t.symbol} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{LABELS[t.symbol]?.symbol ?? t.symbol}</span>
                  <span className="text-sm font-bold text-red-400">{t.change.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Crypto Prices</h2>
        <div className="flex gap-2">
          {(['market', 'change', 'volume'] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${sortBy === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price table */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
              <th className="px-5 py-3 text-left font-semibold">Asset</th>
              <th className="px-5 py-3 text-right font-semibold">Price (USDT)</th>
              <th className="px-5 py-3 text-right font-semibold">24h Change</th>
              <th className="px-5 py-3 text-right font-semibold hidden md:table-cell">24h High</th>
              <th className="px-5 py-3 text-right font-semibold hidden md:table-cell">24h Low</th>
              <th className="px-5 py-3 text-right font-semibold hidden lg:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td></tr>
              ))
            ) : sorted.map((t) => (
              <tr key={t.symbol} className="hover:bg-gray-750 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                      {LABELS[t.symbol]?.symbol?.slice(0, 2) ?? '??'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{LABELS[t.symbol]?.symbol ?? t.symbol}</p>
                      <p className="text-xs text-gray-400">{LABELS[t.symbol]?.name ?? t.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-white">${fmt(t.price)}</td>
                <td className={`px-5 py-3 text-right font-semibold ${t.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change).toFixed(2)}%</span>
                </td>
                <td className="px-5 py-3 text-right text-gray-400 hidden md:table-cell font-mono">${fmt(t.high)}</td>
                <td className="px-5 py-3 text-right text-gray-400 hidden md:table-cell font-mono">${fmt(t.low)}</td>
                <td className="px-5 py-3 text-right text-gray-400 hidden lg:table-cell">
                  {t.volume > 1_000_000 ? `${(t.volume / 1_000_000).toFixed(1)}M` : t.volume.toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Market Heatmap */}
      {!loading && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Market Heatmap</h2>
          <div className="grid grid-cols-5 gap-2">
            {tickers.map((t) => {
              const intensity = Math.min(Math.abs(t.change) / 10, 1);
              const bg = t.change >= 0
                ? `rgba(34, 197, 94, ${0.15 + intensity * 0.5})`
                : `rgba(239, 68, 68, ${0.15 + intensity * 0.5})`;
              return (
                <div key={t.symbol} className="rounded-xl p-3 text-center border border-gray-700" style={{ background: bg }}>
                  <p className="font-bold text-white text-sm">{LABELS[t.symbol]?.symbol}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${t.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* News feed */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Market News</h2>
        <div className="space-y-3">
          {STATIC_NEWS.map((n, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{n.title}</p>
                <p className="text-xs text-gray-400 mt-1">{n.source} · {n.time}</p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">→</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Connect a news API (CryptoPanic, CoinDesk RSS) for live headlines.</p>
      </div>
    </div>
  );
}
