'use client';

import React, { ReactNode } from 'react';
import { useMounted } from '@/lib/use-mounted';

interface SafeHydrationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * SafeHydration ensures that its children are only rendered on the client.
 * This is useful for components that depend on window, localStorage, or 
 * structural branching that would cause hydration mismatches.
 */
export function SafeHydration({ children, fallback = null }: SafeHydrationProps) {
  const mounted = useMounted();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
