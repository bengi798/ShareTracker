'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

interface AuthContextValue {
  token:             string | null;
  userId:            string | null;
  email:             string | null;
  homeCurrency:      string | null;
  isForeignResident: boolean | null;
  themePreference:   string | null;
  isLoading:         boolean;
  logout:            () => void;
  refreshProfile:    () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId, signOut, isLoaded: clerkLoaded } = useClerkAuth();
  const { user } = useUser();
  const [token, setToken]                         = useState<string | null>(null);
  const [homeCurrency, setHomeCurrency]           = useState<string | null>(null);
  const [isForeignResident, setIsForeignResident] = useState<boolean | null>(null);
  const [themePreference, setThemePreference]     = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded]         = useState(false);

  useEffect(() => {
    if (!clerkLoaded || !userId) {
      setToken(null);
      setHomeCurrency(null);
      setIsForeignResident(null);
      setThemePreference(null);
      setProfileLoaded(false);
      return;
    }

    let mounted = true;

    const syncToken = async () => {
      const t = await getToken();
      if (mounted) setToken(t);
    };

    syncToken();
    const intervalId = setInterval(syncToken, 55_000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [clerkLoaded, userId, getToken]);

  useEffect(() => {
    if (!token || profileLoaded) return;

    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
    fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setHomeCurrency(data?.homeCurrency ?? null);
        setIsForeignResident(data?.isForeignResident ?? null);
        setThemePreference(data?.themePreference ?? 'system');
      })
      .catch(() => {
        setHomeCurrency(null);
        setIsForeignResident(null);
        setThemePreference('system');
      })
      .finally(() => setProfileLoaded(true));
  }, [token, profileLoaded]);

  const logout         = useCallback(() => signOut(), [signOut]);
  const refreshProfile = useCallback(() => setProfileLoaded(false), []);
  const email          = user?.primaryEmailAddress?.emailAddress ?? null;
  const isLoading      = !clerkLoaded || (!!userId && !profileLoaded);

  return (
    <AuthContext.Provider
      value={{ token, userId: userId ?? null, email, homeCurrency, isForeignResident, themePreference, isLoading, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
