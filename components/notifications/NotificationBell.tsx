'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Notification } from '@/lib/types/database';

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications_' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case 'signal': return '◎';
      case 'course': return '◉';
      default: return '◈';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`px-4 py-3 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/50 transition ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
