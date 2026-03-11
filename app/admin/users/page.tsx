'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/lib/types/database';

const TIERS = ['free', 'basic', 'premium', 'vip', 'vvip'] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<{ user: Profile; reason: string } | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const updateRole = async (userId: string, role: 'user' | 'admin') => {
    setUpdating(userId);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    setUpdating(null);
  };

  const updateTier = async (userId: string, tier: string) => {
    setUpdating(userId);
    await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscription_tier: tier as Profile['subscription_tier'] } : u));
    setUpdating(null);
  };

  const banUser = async () => {
    if (!banModal) return;
    setUpdating(banModal.user.id);
    await supabase.from('profiles').update({ is_banned: true, ban_reason: banModal.reason || 'Violated terms of service' }).eq('id', banModal.user.id);
    setUsers((prev) => prev.map((u) => u.id === banModal.user.id ? { ...u, is_banned: true, ban_reason: banModal.reason } : u));
    setBanModal(null);
    setUpdating(null);
  };

  const unbanUser = async (userId: string) => {
    setUpdating(userId);
    await supabase.from('profiles').update({ is_banned: false, ban_reason: null }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: false, ban_reason: undefined } : u));
    setUpdating(null);
  };

  const filtered = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier === 'all' || u.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'vvip':    return 'text-orange-400 bg-orange-500/10';
      case 'vip':     return 'text-yellow-400 bg-yellow-500/10';
      case 'premium': return 'text-purple-400 bg-purple-500/10';
      case 'basic':   return 'text-blue-400 bg-blue-500/10';
      default:        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const kycColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'pending':  return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      default:         return 'text-gray-500';
    }
  };

  const tierCounts = TIERS.reduce((acc, t) => ({ ...acc, [t]: users.filter((u) => u.subscription_tier === t).length }), {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-400">{users.length} registered users</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Admin</Link>
      </div>

      <div className="p-8">
        {/* Tier stats */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {TIERS.map((t) => (
            <button key={t}
              onClick={() => setFilterTier(filterTier === t ? 'all' : t)}
              className={`p-3 rounded-xl border text-center transition ${filterTier === t ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
            >
              <p className={`text-xl font-bold ${tierColor(t).split(' ')[0]}`}>{tierCounts[t] ?? 0}</p>
              <p className="text-xs text-gray-400 uppercase mt-0.5">{t}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="flex-1 max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filterTier !== 'all' && (
            <button onClick={() => setFilterTier('all')} className="text-sm text-gray-400 hover:text-white">Clear filter ×</button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-16 animate-pulse" />)}</div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-5 py-3 text-left font-semibold">Role</th>
                  <th className="px-5 py-3 text-left font-semibold">Tier</th>
                  <th className="px-5 py-3 text-left font-semibold">KYC</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((user) => (
                  <tr key={user.id} className={`transition ${user.is_banned ? 'opacity-60 bg-red-900/10' : 'hover:bg-gray-750'}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{user.full_name || '—'}</div>
                      <div className="text-gray-400 text-xs">{user.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-gray-600/40 text-gray-400'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${tierColor(user.subscription_tier)}`}>
                        {user.subscription_tier}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold uppercase ${kycColor(user.kyc_status ?? 'none')}`}>
                        {user.kyc_status ?? 'none'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {user.is_banned ? (
                        <span className="text-xs text-red-400 font-semibold">BANNED</span>
                      ) : (
                        <span className="text-xs text-green-400">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={user.subscription_tier} disabled={updating === user.id}
                          onChange={(e) => updateTier(user.id, e.target.value)}
                          className="bg-gray-700 border border-gray-600 text-xs rounded px-2 py-1 text-white outline-none"
                        >
                          {TIERS.map((t) => <option key={t} value={t} className="uppercase">{t.toUpperCase()}</option>)}
                        </select>
                        <button
                          onClick={() => updateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          disabled={updating === user.id}
                          className={`text-xs px-2 py-1 rounded transition ${user.role === 'admin' ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white' : 'bg-gray-600/40 hover:bg-gray-600 text-gray-400 hover:text-white'}`}
                        >
                          {user.role === 'admin' ? 'Demote' : '+ Admin'}
                        </button>
                        {user.is_banned ? (
                          <button onClick={() => unbanUser(user.id)} disabled={updating === user.id}
                            className="text-xs px-2 py-1 rounded bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white transition">
                            Unban
                          </button>
                        ) : (
                          <button onClick={() => setBanModal({ user, reason: '' })}
                            className="text-xs px-2 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition">
                            Ban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No users found.</div>
            )}
          </div>
        )}
      </div>

      {/* Ban confirmation modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Ban User</h3>
            <p className="text-sm text-gray-400 mb-4">
              You are about to ban <span className="text-white font-medium">{banModal.user.email}</span>. They will not be able to log in.
            </p>
            <input
              value={banModal.reason}
              onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
              placeholder="Reason (optional)"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={banUser} className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg font-semibold transition">
                Confirm Ban
              </button>
              <button onClick={() => setBanModal(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 rounded-lg font-semibold transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
