'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { KycSubmission } from '@/lib/types/database';

interface KycWithUser extends KycSubmission {
  profiles?: { email: string; full_name?: string; subscription_tier: string };
}

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<KycWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selected, setSelected] = useState<KycWithUser | null>(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchKyc(); }, []);

  const fetchKyc = async () => {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*, profiles(email, full_name, subscription_tier)')
      .order('submitted_at', { ascending: false });
    if (data) setSubmissions(data as KycWithUser[]);
    setLoading(false);
  };

  const review = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('kyc_submissions').update({
      status,
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq('id', selected.id);

    // Update profile kyc_status
    await supabase.from('profiles').update({ kyc_status: status }).eq('id', selected.user_id);

    // If approved + user is applying for VVIP, upgrade them
    if (status === 'approved' && selected.profiles?.subscription_tier === 'vip') {
      await supabase.from('profiles').update({ subscription_tier: 'vvip' }).eq('id', selected.user_id);
    }

    // Notify user
    await supabase.from('notifications').insert({
      user_id: selected.user_id,
      type: 'system',
      title: status === 'approved' ? 'KYC Approved ✓' : 'KYC Review Update',
      message: status === 'approved'
        ? 'Your identity has been verified. Your VVIP account is now active.'
        : `Your KYC submission was not approved. ${notes || 'Please resubmit with clearer documents.'}`,
      is_read: false,
    });

    setSubmissions((prev) => prev.map((s) => s.id === selected.id ? { ...s, status } : s));
    setSelected(null);
    setNotes('');
    setUpdating(false);
  };

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'pending':  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      default:         return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Management</h1>
          <p className="text-sm text-gray-400">
            {pendingCount > 0 ? <span className="text-yellow-400">{pendingCount} pending review</span> : 'No pending reviews'}
          </p>
        </div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Admin</Link>
      </div>

      <div className="p-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
              {f} {f !== 'all' && `(${submissions.filter((s) => s.status === f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-24 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No {filter} KYC submissions.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub) => (
              <div key={sub.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-white">{sub.full_name || sub.profiles?.full_name || 'Unknown'}</span>
                      <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${statusBadge(sub.status)}`}>{sub.status}</span>
                    </div>
                    <p className="text-sm text-gray-400">{sub.profiles?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sub.country && `${sub.country} · `}
                      Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                      {sub.reviewed_at && ` · Reviewed ${new Date(sub.reviewed_at).toLocaleDateString()}`}
                    </p>
                    {sub.reviewer_notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">Note: {sub.reviewer_notes}</p>
                    )}
                  </div>
                  {sub.status === 'pending' && (
                    <button onClick={() => { setSelected(sub); setNotes(''); }}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition flex-shrink-0">
                      Review
                    </button>
                  )}
                </div>

                {/* Document thumbnails */}
                {(sub.id_front_url || sub.id_back_url || sub.selfie_url) && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
                    {sub.id_front_url && (
                      <a href={sub.id_front_url} target="_blank" rel="noreferrer" className="block">
                        <img src={sub.id_front_url} alt="ID Front" className="w-24 h-16 object-cover rounded-lg border border-gray-600 hover:border-blue-500 transition" />
                        <p className="text-xs text-gray-400 text-center mt-1">ID Front</p>
                      </a>
                    )}
                    {sub.id_back_url && (
                      <a href={sub.id_back_url} target="_blank" rel="noreferrer" className="block">
                        <img src={sub.id_back_url} alt="ID Back" className="w-24 h-16 object-cover rounded-lg border border-gray-600 hover:border-blue-500 transition" />
                        <p className="text-xs text-gray-400 text-center mt-1">ID Back</p>
                      </a>
                    )}
                    {sub.selfie_url && (
                      <a href={sub.selfie_url} target="_blank" rel="noreferrer" className="block">
                        <img src={sub.selfie_url} alt="Selfie" className="w-24 h-16 object-cover rounded-lg border border-gray-600 hover:border-blue-500 transition" />
                        <p className="text-xs text-gray-400 text-center mt-1">Selfie</p>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-1">Review KYC</h3>
            <p className="text-sm text-gray-400 mb-4">
              {selected.full_name} · {selected.profiles?.email}
            </p>

            {/* Documents */}
            <div className="flex gap-3 mb-4">
              {selected.id_front_url && (
                <a href={selected.id_front_url} target="_blank" rel="noreferrer">
                  <img src={selected.id_front_url} alt="ID Front" className="w-28 h-20 object-cover rounded-lg border border-gray-600" />
                  <p className="text-xs text-gray-400 text-center mt-1">ID Front</p>
                </a>
              )}
              {selected.id_back_url && (
                <a href={selected.id_back_url} target="_blank" rel="noreferrer">
                  <img src={selected.id_back_url} alt="ID Back" className="w-28 h-20 object-cover rounded-lg border border-gray-600" />
                  <p className="text-xs text-gray-400 text-center mt-1">ID Back</p>
                </a>
              )}
              {selected.selfie_url && (
                <a href={selected.selfie_url} target="_blank" rel="noreferrer">
                  <img src={selected.selfie_url} alt="Selfie" className="w-28 h-20 object-cover rounded-lg border border-gray-600" />
                  <p className="text-xs text-gray-400 text-center mt-1">Selfie</p>
                </a>
              )}
            </div>

            <div className="space-y-2 text-sm mb-4">
              {selected.date_of_birth && <p className="text-gray-300">DOB: {selected.date_of_birth}</p>}
              {selected.country && <p className="text-gray-300">Country: {selected.country}</p>}
            </div>

            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Reviewer notes (shown to user on rejection)..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4 text-sm"
            />

            <div className="flex gap-3">
              <button onClick={() => review('approved')} disabled={updating}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2.5 rounded-lg font-semibold transition">
                ✓ Approve
              </button>
              <button onClick={() => review('rejected')} disabled={updating}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-2.5 rounded-lg font-semibold transition">
                ✗ Reject
              </button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
