'use client';

import React, { createContext, useContext } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { normalizeCrop, getCropTransform } from '@/lib/cropUtils';
import { normalizeImageUrl } from '@/lib/image-utils';
import { useHeroLuminance, HeroContrastMode } from '@/lib/use-hero-contrast';

interface VehicleBannerProps {
  vehicleId?: string;
  bannerImageUrl?: string;
  bannerCropX?: number;
  bannerCropY?: number;
  bannerZoom?: number;
  children?: React.ReactNode;
}

const HeroContrastContext = createContext<HeroContrastMode>('none');

export const useHeroContrast = () => useContext(HeroContrastContext);

/**
 * VehicleBanner
 * 
 * Adaptive hero banner with luminance detection.
 * Switch text contrast based on background image brightness.
 */
export function VehicleBanner({ 
  bannerImageUrl, 
  bannerCropX, 
  bannerCropY, 
  bannerZoom = 1, 
  children 
}: Omit<VehicleBannerProps, 'vehicleId'>) {
  const contrastMode = useHeroLuminance(bannerImageUrl);
  
  // Normalize coordinates (legacy 0-100 to 0-1)
  const x = normalizeCrop(bannerCropX);
  const y = normalizeCrop(bannerCropY);

  return (
    <HeroContrastContext.Provider value={contrastMode}>
      <div className="relative w-full group">
        {/* Banner Image Container */}
        <div className="relative w-full min-h-[380px] sm:min-h-[440px] bg-surface transition-colors duration-500">
          {bannerImageUrl ? (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={normalizeImageUrl(bannerImageUrl)}
                  alt="Vehicle Banner"
                  className="select-none transition-opacity duration-700"
                  style={getCropTransform(x, y, bannerZoom)}
                />
              </div>
              
              {/* Top gradient (always dark for nav contrast) */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-transparent opacity-80" />
              
              {/* Bottom blend gradient (adaptive) */}
              {/* If text is dark (bright image), we use a white fade instead of a dark one */}
              <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-700 ${
                contrastMode === 'dark' 
                  ? 'from-white/40 via-transparent to-transparent opacity-100' 
                  : 'from-black via-transparent to-transparent opacity-15 dark:opacity-80'
              }`} />
              
              {/* Transition fade into page (Light Mode only, hidden if banner text is dark as it would blend too much) */}
              <div className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface via-surface/20 to-transparent transition-opacity duration-700 dark:opacity-0 pointer-events-none ${
                contrastMode === 'dark' ? 'opacity-100' : 'opacity-100'
              }`} />
              
              {/* Edge fade */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background/10 to-transparent pointer-events-none dark:from-surface/20" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background/10 to-transparent pointer-events-none dark:from-surface/20" />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground/[0.03] to-transparent border-b border-subtle">
              <div className="relative opacity-20 text-foreground transition-colors duration-500">
                <div className="absolute -inset-8 rounded-full bg-foreground/5 blur-3xl opacity-50" />
                <ImageIcon className="relative" size={60} strokeWidth={1} />
              </div>
            </div>
          )}

          {/* Content Layer (Navigation + Header) */}
          <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    </HeroContrastContext.Provider>
  );
}

/**
 * Adaptive sub-components to respond to banner contrast
 * Note: 'dark' contrast mode means the BACKGROUND is bright, so use DARK text.
 */

export function BannerStatusWrapper({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const contrast = useHeroContrast();
  
  const styles = {
    dark: 'border-slate-950/10 bg-slate-950/5', // Explicit dark for bright images
    light: 'border-white/10 bg-white/5',        // Explicit light for dark images
    none: 'border-border-subtle bg-foreground/[0.03]' // Theme fallback (Light: darkish, Dark: lightish)
  };
  
  return (
    <div className={`flex items-center gap-3 rounded-full border px-3 py-1 transition-colors duration-500 ${styles[contrast]} ${className}`}>
      {children}
    </div>
  );
}

export function BannerStatusLabel({ children }: { children: React.ReactNode }) {
  const contrast = useHeroContrast();
  const styles = {
    dark: 'text-slate-600',
    light: 'text-white/60',
    none: 'text-muted' // Correctly dark in light theme, light in dark theme
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${styles[contrast]}`}>
      {children}
    </span>
  );
}

export function BannerDailyBadge() {
  const contrast = useHeroContrast();
  const styles = {
    dark: 'bg-blue-600/10 text-blue-700 border-blue-600/20',
    light: 'bg-blue-500/20 text-blue-100 border-white/20',
    none: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/10'
  };

  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors duration-500 ${styles[contrast]}`}>
      <div className={`h-1 w-1 rounded-full ${contrast === 'light' ? 'bg-blue-300' : 'bg-blue-600'}`} />
      <span className="text-[8px] font-black uppercase tracking-widest">Daily</span>
    </div>
  );
}

export function BannerNickname({ children }: { children: React.ReactNode }) {
  const contrast = useHeroContrast();
  const styles = {
    dark: 'text-slate-950',
    light: 'text-white',
    none: 'text-foreground' // Correctly dark in light theme, light in dark theme
  };
  return (
    <h1 className={`text-5xl font-extrabold tracking-tighter sm:text-7xl uppercase italic drop-shadow-2xl transition-colors duration-500 ${styles[contrast]}`}>
      {children}
    </h1>
  );
}

export function BannerSubheading({ children }: { children: React.ReactNode }) {
  const contrast = useHeroContrast();
  const styles = {
    dark: 'text-slate-700',
    light: 'text-white/80',
    none: 'text-muted'
  };
  return (
    <p className={`text-lg font-bold uppercase tracking-tight drop-shadow-md transition-colors duration-500 ${styles[contrast]}`}>
      {children}
    </p>
  );
}

export function BannerPlate({ children }: { children: React.ReactNode }) {
  const contrast = useHeroContrast();
  const styles = {
    dark: 'border-slate-950/10 bg-slate-950/5 text-slate-700',
    light: 'border-white/10 bg-white/10 text-white/60',
    none: 'border-border-subtle bg-foreground/5 text-muted'
  };

  return (
    <span className={`rounded-md border backdrop-blur-md px-2 py-0.5 font-mono text-[10px] font-bold transition-all duration-500 ${styles[contrast]}`}>
      {children}
    </span>
  );
}

export function BannerAddedDate({ children }: { children: React.ReactNode }) {
  const contrast = useHeroContrast();
  const styles = {
    dark: 'text-slate-500',
    light: 'text-white/40',
    none: 'text-dim'
  };
  return (
    <p className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-500 ${styles[contrast]}`}>
      {children}
    </p>
  );
}
