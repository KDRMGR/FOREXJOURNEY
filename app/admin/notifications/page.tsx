'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'user'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setError('Please fill in all fields');
      return;
    }
    setSending(true);
    setError('');
    setSuccess('');

    try {
      if (targetType === 'all') {
        // Fetch all user IDs
        // Note: For large user bases, this should be done via a backend function/batch
        const { data: users, error: fetchError } = await supabase.from('profiles').select('id');
        
        if (fetchError) throw fetchError;
        
        if (users && users.length > 0) {
          const notifications = users.map(u => ({
            user_id: u.id,
            type: 'system',
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase.from('notifications').insert(notifications);
          if (insertError) throw insertError;
          
          setSuccess(`Successfully sent to ${users.length} users`);
        } else {
            setSuccess('No users found to send to.');
        }

      } else {
        if (!targetUserId) {
          setError('Please provide a User ID');
          setSending(false);
          return;
        }

        const { error: insertError } = await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'system',
          title,
          message,
          is_read: false,
          created_at: new Date().toISOString()
        });

        if (insertError) throw insertError;
        setSuccess('Notification sent successfully');
      }
      
      // Reset form
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Push Notifications</h1>
          <p className="text-sm text-gray-400">Broadcast updates or alerts to users</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Admin</Link>
      </div>

      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <form onSubmit={sendNotification} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="target" 
                    checked={targetType === 'all'} 
                    onChange={() => setTargetType('all')}
                    className="accent-blue-500"
                  />
                  <span>All Users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="target" 
                    checked={targetType === 'user'} 
                    onChange={() => setTargetType('user')}
                    className="accent-blue-500"
                  />
                  <span>Specific User ID</span>
                </label>
              </div>
            </div>

            {targetType === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">User ID</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="UUID..."
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Market Alert: BTC Breaking Out"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter notification content..."
                required
              />
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">{success}</div>}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-lg font-bold transition"
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
