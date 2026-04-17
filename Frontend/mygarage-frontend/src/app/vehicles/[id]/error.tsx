'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function VehicleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted mb-8 max-w-sm">
        We couldn't load the vehicle details. This might be due to a connection issue or the vehicle might not exist.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="w-full py-4 bg-foreground text-background font-black rounded-2xl active:scale-95 transition-transform"
        >
          Try Again
        </button>
        <Link
          href="/vehicles"
          className="w-full py-4 bg-card-overlay border border-border-strong text-foreground font-bold rounded-2xl active:scale-95 transition-transform text-center"
        >
          Back to Vehicles
        </Link>
      </div>
    </div>
  );
}
