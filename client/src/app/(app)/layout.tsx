'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/trades/Navbar';
import { Spinner } from '@/components/ui/Spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/sign-in');
    }
  }, [token, isLoading, router]);

  if (isLoading || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f3] dark:bg-[#111111]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] dark:bg-[#111111] flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 flex-1">{children}</main>
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 flex gap-6 text-xs text-gray-400 dark:text-gray-600">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-400">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-400">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
