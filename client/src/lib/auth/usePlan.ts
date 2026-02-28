'use client';

import { useAuth } from '@clerk/nextjs';

/**
 * Returns true if the current user has an active 'investor' plan,
 * false if they don't, or null while Clerk is still loading.
 */
export function useIsInvestor(): boolean | null {
  const { has, isLoaded } = useAuth();
  if (!isLoaded) return null;
  return has?.({ plan: 'investor' }) ?? false;
}
