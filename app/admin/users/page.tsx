'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/lib/types/database';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const updateRole = async (userId: string, role: 'user' | 'admin') => {
    setUpdating(userId);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    setUpdating(null);
  };

  const updateTier = async (userId: string, tier: Profile['subscription_tier']) => {
    setUpdating(userId);
    await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscription_tier: tier } : u));
    setUpdating(null);
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'text-yellow-400';
      case 'premium': return 'text-purple-400';
      case 'basic': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

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
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-16 animate-pulse" />)}
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-5 py-3 text-left font-semibold">Role</th>
                  <th className="px-5 py-3 text-left font-semibold">Tier</th>
                  <th className="px-5 py-3 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-750 transition">
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
                      <span className={`text-xs font-semibold uppercase ${tierColor(user.subscription_tier)}`}>
                        {user.subscription_tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.subscription_tier}
                          disabled={updating === user.id}
                          onChange={(e) => updateTier(user.id, e.target.value as Profile['subscription_tier'])}
                          className="bg-gray-700 border border-gray-600 text-xs rounded px-2 py-1 text-white outline-none"
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                          <option value="vip">VIP</option>
                        </select>
                        <button
                          onClick={() => updateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          disabled={updating === user.id}
                          className={`text-xs px-2 py-1 rounded transition ${
                            user.role === 'admin'
                              ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white'
                              : 'bg-gray-600/40 hover:bg-gray-600 text-gray-400 hover:text-white'
                          }`}
                        >
                          {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </button>
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
    </div>
  );
}
