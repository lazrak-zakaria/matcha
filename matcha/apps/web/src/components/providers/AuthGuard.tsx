'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token && isHydrated) {
      router.replace('/');
      console.log("No token found, redirecting to login..."); 
    }
  }, [token, router, isHydrated]);
  

  if (!token) return null;

  return <>{children}</>;
}

