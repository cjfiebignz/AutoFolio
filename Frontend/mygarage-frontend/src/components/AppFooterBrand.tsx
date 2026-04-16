'use client';

import React from 'react';
import { AutoFolioLogo } from './AutoFolioLogo';

export function AppFooterBrand({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-24 pb-16 flex flex-col items-center justify-center transition-opacity duration-1000 animate-in fade-in ${className}`}>
      <div className="opacity-20 hover:opacity-40 transition-opacity cursor-default group flex flex-col items-center">
        <AutoFolioLogo 
          height={56} 
          className="grayscale brightness-150" 
        />
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted transition-colors">
            All your vehicles, one place.
          </p>
          <div className="h-px w-4 bg-foreground/10" />
        </div>
      </div>
    </footer>
  );
}
