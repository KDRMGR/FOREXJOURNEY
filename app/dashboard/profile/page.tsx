'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'subscription'>('profile');
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setBinanceKey(user.binance_api_key || '');
      setBinanceSecret(user.binance_api_secret ? '••••••••••••••••' : '');
    }
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { data } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (data) setUser(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUpgrade = async (tier: string) => {
    if (!user) return;
    setUpgradingTier(tier);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, userId: user.id, userEmail: user.email }),
    });
    const { url, error } = await res.json();
    setUpgradingTier(null);
    if (url) window.location.href = url;
    else console.error('Checkout error:', error);
  };

  const saveApiKeys = async () => {
    if (!user) return;
    setSaving(true);

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (binanceKey) updates.binance_api_key = binanceKey;
    if (binanceSecret && !binanceSecret.includes('•')) updates.binance_api_secret = binanceSecret;

    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (data) setUser(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tierBadge = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'premium': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'basic': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile & Settings</h1>
        <p className="text-gray-400">Manage your account and API connections</p>
      </div>

      {/* User header card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
          {user.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold text-white">{user.full_name || 'No name set'}</div>
          <div className="text-gray-400 text-sm">{user.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${tierBadge(user.subscription_tier)}`}>
              {user.subscription_tier}
            </span>
            {user.role === 'admin' && (
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
        {(['profile', 'api', 'subscription'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'api' ? 'API Keys' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-5">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-300">
            Your API keys are encrypted and stored securely. Only use read-only keys for safety.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Binance API Key</label>
            <input
              type="text"
              value={binanceKey}
              onChange={(e) => setBinanceKey(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Enter your Binance API key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Binance API Secret</label>
            <input
              type="password"
              value={binanceSecret}
              onChange={(e) => setBinanceSecret(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Enter your Binance API secret"
            />
          </div>
          <button
            onClick={saveApiKeys}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {user.subscription_tier === 'vip' && <CopyTradingToggle userId={user.id} />}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Current Plan</h3>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold uppercase mb-6 ${tierBadge(user.subscription_tier)}`}>
            {user.subscription_tier}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { tier: 'basic', price: '$49/mo', features: ['10 signals/week', 'Intermediate courses', 'Live charts'] },
              { tier: 'premium', price: '$99/mo', features: ['Unlimited signals', 'All courses', 'Priority support'] },
              { tier: 'vip', price: '$299/mo', features: ['Copy trading', '1-on-1 coaching', 'API access'] },
            ].map((plan) => (
              <div key={plan.tier} className={`p-4 rounded-xl border ${user.subscription_tier === plan.tier ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}>
                <div className="font-bold text-white uppercase text-sm mb-1">{plan.tier}</div>
                <div className="text-xl font-bold text-white mb-3">{plan.price}</div>
                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-gray-400">✓ {f}</li>
                  ))}
                </ul>
                {user.subscription_tier !== plan.tier && (
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={upgradingTier === plan.tier}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {upgradingTier === plan.tier ? 'Redirecting...' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function CopyTradingToggle({ userId }: { userId: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('copy_trading_enabled')
      .eq('id', userId)
      .single()
      .then(({ data }) => setEnabled(data?.copy_trading_enabled ?? false));
  }, [userId]);

  const toggle = async () => {
    if (enabled === null) return;
    setSaving(true);
    const next = !enabled;
    await supabase.from('profiles').update({ copy_trading_enabled: next }).eq('id', userId);
    setEnabled(next);
    setSaving(false);
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="font-bold text-yellow-400">Copy Trading</p>
        <p className="text-sm text-gray-400 mt-0.5">
          Automatically mirror new admin signals into your trade history
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving || enabled === null}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          enabled ? 'bg-yellow-500' : 'bg-gray-600'
        } disabled:opacity-50`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
