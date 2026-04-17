'use client';

import { createPortal } from 'react-dom';
import { X, CheckCircle2, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  features?: string[];
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryActionLabel?: string;
}

export function PremiumUpgradeModal({ 
  isOpen, 
  onClose,
  title = "Unlock your full garage",
  message = "Upgrade to track up to 10 vehicles and manage your full collection in one place.",
  features = [
    "Manage up to 10 Vehicles",
    "Advanced Service PDF Exports",
    "Cross-Vehicle Project Planning",
    "Priority Technical Support"
  ],
  primaryAction,
  secondaryActionLabel = "Maybe later"
}: PremiumUpgradeModalProps) {
  if (!isOpen) return null;

  const handlePrimaryClick = () => {
    if (primaryAction?.onClick) primaryAction.onClick();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-2xl transition-all">
        {/* Animated Background Elements - lowered z-index */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-foreground/5 blur-3xl animate-pulse z-0" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse z-0" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 sm:p-8 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-muted opacity-40">
            <Crown size={24} strokeWidth={1.5} />
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-muted opacity-40 hover:bg-foreground/10 hover:text-foreground transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-10 sm:px-10 sm:pb-12 text-center space-y-8 relative z-10">
          <div className="space-y-3">
            <h3 className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-tight">
              {title}
            </h3>
            <p className="mx-auto max-w-xs text-sm font-medium leading-relaxed text-muted opacity-60">
              {message}
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 gap-4 text-left bg-foreground/[0.02] border border-border-subtle rounded-3xl p-6 sm:p-8">
            {features.map((feature, idx) => (
              <FeatureItem key={idx} label={feature} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {primaryAction?.href ? (
              <Link
                href={primaryAction.href}
                onClick={onClose}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground px-10 text-xs font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
              >
                {primaryAction.label}
                <ArrowRight size={16} strokeWidth={3} />
              </Link>
            ) : primaryAction ? (
              <button
                onClick={handlePrimaryClick}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground px-10 text-xs font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
              >
                {primaryAction.label}
              </button>
            ) : (
              <Link
                href="/account/subscription"
                onClick={onClose}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground px-10 text-xs font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
              >
                Upgrade to Pro
                <ArrowRight size={16} strokeWidth={3} />
              </Link>
            )}
            
            {secondaryActionLabel && (
              <button
                type="button"
                onClick={onClose}
                className="h-14 text-[10px] font-black uppercase tracking-widest text-muted opacity-40 hover:text-foreground transition-colors"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 p-6 bg-foreground/[0.01] border-t border-border-subtle text-center shrink-0">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted opacity-40">
            Secure billing &bull; Instant activation
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-500">
        <CheckCircle2 size={12} strokeWidth={3} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-80">
        {label}
      </span>
    </div>
  );
}
