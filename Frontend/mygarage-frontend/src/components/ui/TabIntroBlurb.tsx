'use client';

import { useState, useEffect } from 'react';

interface TabIntroBlurbProps {
  tab: string;
  title?: string;
  description: string;
}

/**
 * TabIntroBlurb
 * 
 * A reusable onboarding hint component that can be dismissed by the user.
 * Dismissal is persisted in localStorage per tab.
 */
export function TabIntroBlurb({ tab, title, description }: TabIntroBlurbProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const storageKey = `autofolio:tips:${tab}`;

  useEffect(() => {
    // Check if user has already dismissed this specific tip
    const saved = localStorage.getItem(storageKey);
    if (saved !== 'dismissed') {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    // Persist dismissal and hide immediately
    localStorage.setItem(storageKey, 'dismissed');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-8 transition-all hover:bg-white/[0.03]">
      {/* Background Glow */}
      <div className="absolute -inset-4 rounded-full bg-white/[0.01] blur-3xl opacity-50" />
      
      <div className="relative flex flex-col items-center text-center space-y-6">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] leading-relaxed italic max-w-xl">
          {title && <span className="text-white/40 not-italic font-black mr-2 uppercase tracking-widest">{title}:</span>}
          {description}
        </p>
        
        {/* Instant Dismiss Action */}
        <div className="flex w-full justify-center z-10 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[8px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-[0.95] shadow-lg"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
