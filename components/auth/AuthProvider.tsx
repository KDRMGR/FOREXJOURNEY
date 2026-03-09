'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const initializedRef = useRef(false);
  const fetchingRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProfile = async (userId: string, email: string) => {
      if (fetchingRef.current === userId) return;
      fetchingRef.current = userId;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setUser(profile);
      } else {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId, email, role: 'user', subscription_tier: 'free' })
          .select()
          .maybeSingle();
        setUser(newProfile);
      }
      fetchingRef.current = null;
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    if (initializedRef.current) return;
    initializedRef.current = true;
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          await fetchProfile(session.user.id, session.user.email!);
        } catch (e) {
        }
      } else {
        setUser(null);
      }

      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, router]);

  return <>{children}</>;
}
