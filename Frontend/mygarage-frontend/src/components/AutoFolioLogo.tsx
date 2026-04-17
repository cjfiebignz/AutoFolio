'use client';

import React from 'react';

interface AutoFolioLogoProps {
  className?: string;
  height?: number | string;
  showText?: boolean;
}

export function AutoFolioLogo({ className = "", height = 48, showText = true }: AutoFolioLogoProps) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <img 
        src="/branding/autofolio-logo.png" 
        alt="AutoFolio Logo" 
        style={{ height }} 
        className="w-auto object-contain transition-transform hover:scale-105"
      />
      {showText && (
        <span className="text-2xl font-black italic tracking-tighter uppercase">
          <span className="text-foreground">Auto</span>
          <span className="text-muted">Folio</span>
        </span>
      )}
    </div>
  );
}
