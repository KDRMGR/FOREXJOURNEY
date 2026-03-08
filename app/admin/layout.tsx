'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (!isAdmin()) router.push('/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || !user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
