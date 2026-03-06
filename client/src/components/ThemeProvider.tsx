'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themePreference } = useAuth();

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(pref: string | null) {
      if (pref === 'dark') {
        root.classList.add('dark');
      } else if (pref === 'light') {
        root.classList.remove('dark');
      } else {
        // 'system' or null — follow OS preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }

    applyTheme(themePreference);

    // When using system preference, listen for OS changes
    if (!themePreference || themePreference === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [themePreference]);

  return <>{children}</>;
}
