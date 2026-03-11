'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { KycSubmission } from '@/lib/types/database';
import Link from 'next/link';

const COUNTRIES = [
  'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'United Kingdom', 'United States',
  'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Other',
];

export default function KycPage() {
  const { user } = useAuthStore();
  const [existing, setExisting] = useState<KycSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', country: '', id_front_url: '', id_back_url: '', selfie_url: '' });

  useEffect(() => {
    if (user) fetchExisting();
  }, [user]);

  const fetchExisting = async () => {
    const { data } = await supabase.from('kyc_submissions').select('*').eq('user_id', user!.id).maybeSingle();
    if (data) setExisting(data as KycSubmission);
    setLoading(false);
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id_front_url' | 'id_back_url' | 'selfie_url') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    const path = `${user.id}/${field}_${Date.now()}`;
    const url = await uploadFile(file, 'kyc-documents', path);
    if (url) setForm((f) => ({ ...f, [field]: url }));
    setSaving(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = { user_id: user.id, ...form, status: 'pending' };
    const { error } = existing
      ? await supabase.from('kyc_submissions').update({ ...form, status: 'pending', submitted_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('kyc_submissions').insert(payload);

    if (!error) {
      await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id);
      setSuccess(true);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="p-6"><div className="h-8 bg-gray-800 rounded w-1/3 animate-pulse" /></div>
  );

  // Not eligible
  if (user?.subscription_tier !== 'vip' && user?.subscription_tier !== 'vvip') {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mt-6">
          <p className="text-yellow-400 font-semibold mb-2">VIP or VVIP Required</p>
          <p className="text-sm text-gray-400">KYC verification is available for VIP and VVIP tier members only. Upgrade your subscription to access this feature.</p>
          <Link href="/dashboard/profile" className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-2 rounded-lg text-sm transition">
            Upgrade Plan →
          </Link>
        </div>
      </div>
    );
  }

  if (success || existing?.status === 'approved') {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-6">KYC Verification</h1>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
          <h2 className="text-xl font-bold text-green-400 mb-2">
            {existing?.status === 'approved' ? 'Verified!' : 'Submitted!'}
          </h2>
          <p className="text-gray-400 text-sm">
            {existing?.status === 'approved'
              ? 'Your identity has been verified. Your VVIP account is fully active.'
              : 'Your KYC documents have been submitted. We will review within 24-48 hours and notify you via email.'}
          </p>
        </div>
      </div>
    );
  }

  if (existing?.status === 'rejected') {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-6">KYC Verification</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-red-400 mb-1">Previous submission rejected</p>
          <p className="text-sm text-gray-400">{existing.reviewer_notes || 'Please resubmit with clearer document photos.'}</p>
        </div>
        <KycForm form={form} setForm={setForm} saving={saving} handleFileChange={handleFileChange} submit={submit} isResubmit />
      </div>
    );
  }

  if (existing?.status === 'pending') {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-6">KYC Verification</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⏳</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-2">Under Review</h2>
          <p className="text-gray-400 text-sm">Your documents are being reviewed. This usually takes 24-48 hours. You will be notified once complete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
      <p className="text-gray-400 mb-8">Complete identity verification to unlock your VVIP account benefits.</p>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
        <p className="text-sm text-blue-400 font-semibold mb-1">What you need:</p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Government-issued ID (passport, national ID, or driver&apos;s license)</li>
          <li>• A clear selfie holding your ID</li>
          <li>• Documents must be clearly readable — no blurry or cropped photos</li>
        </ul>
      </div>

      <KycForm form={form} setForm={setForm} saving={saving} handleFileChange={handleFileChange} submit={submit} />
    </div>
  );
}

function KycForm({ form, setForm, saving, handleFileChange, submit, isResubmit = false }: {
  form: { full_name: string; date_of_birth: string; country: string; id_front_url: string; id_back_url: string; selfie_url: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  saving: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'id_front_url' | 'id_back_url' | 'selfie_url') => void;
  submit: (e: React.FormEvent) => void;
  isResubmit?: boolean;
}) {
  const COUNTRIES_LIST = [
    'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'United Kingdom', 'United States',
    'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Other',
  ];

  return (
    <form onSubmit={submit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Full Legal Name *</label>
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="As shown on your ID"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Date of Birth *</label>
          <input required type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Country *</label>
        <select required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select country...</option>
          {COUNTRIES_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {([
          { field: 'id_front_url' as const, label: 'ID Front *', hint: 'Front of your ID document' },
          { field: 'id_back_url' as const, label: 'ID Back *', hint: 'Back of your ID document' },
          { field: 'selfie_url' as const, label: 'Selfie with ID *', hint: 'Hold your ID next to your face' },
        ]).map(({ field, label, hint }) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{label}</label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition ${form[field] ? 'border-green-500 bg-green-500/5' : 'border-gray-600 hover:border-gray-500'}`}>
              {form[field] ? (
                <div>
                  <Image
                    src={form[field]}
                    alt={label}
                    width={320}
                    height={80}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                    unoptimized
                  />
                  <p className="text-xs text-green-400">Uploaded ✓</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-1">📷</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, field)}
                className="mt-2 text-xs text-gray-400 w-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-gray-900 rounded-xl p-4">
        <input type="checkbox" required id="consent" className="mt-0.5 w-4 h-4 accent-blue-500" />
        <label htmlFor="consent" className="text-xs text-gray-400 cursor-pointer">
          I confirm that the information provided is accurate and complete. I consent to my documents being reviewed for identity verification purposes.
        </label>
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-xl font-bold transition">
        {saving ? 'Uploading...' : isResubmit ? 'Resubmit for Review' : 'Submit for Review'}
      </button>
    </form>
  );
}
