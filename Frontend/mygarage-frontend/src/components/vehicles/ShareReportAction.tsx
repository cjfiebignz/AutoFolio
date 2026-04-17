'use client';

import { useState, useTransition, useEffect } from 'react';
import { Share, Copy, X, CheckCircle2, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { enablePublicReport, disablePublicReport } from '@/lib/api';
import { usePlan } from '@/lib/plan-context';
import { useRouter } from 'next/navigation';

interface ShareReportActionProps {
  vehicleId: string;
  isPublic: boolean;
  shareToken?: string | null;
  variant?: 'action' | 'horizontal';
}

export function ShareReportAction({ 
  vehicleId, 
  isPublic, 
  shareToken,
  variant = 'action'
}: ShareReportActionProps) {
  const { plan, triggerUpgrade } = usePlan();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (showCopyFeedback || errorMessage) {
      const timer = setTimeout(() => {
        setShowCopyFeedback(false);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showCopyFeedback, errorMessage]);

  const publicUrl = shareToken 
    ? `https://autofolio.autos/public/vehicle-report/${shareToken}`
    : '';

  const handleToggleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Gating check: use feature-based trigger
    if (!plan?.canSharePublicReport) {
      triggerUpgrade('share_report');
      return;
    }

    if (isUpdating || isPending) return;

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      if (isPublic) {
        await disablePublicReport(vehicleId);
      } else {
        await enablePublicReport(vehicleId);
      }
      
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(isPublic ? 'Failed to disable' : 'Failed to enable');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!publicUrl) return;

    navigator.clipboard.writeText(publicUrl).then(() => {
      setShowCopyFeedback(true);
    });
  };

  if (variant === 'horizontal') {
    if (isPublic && shareToken) {
      return (
        <div className="w-full">
          <div className={`flex items-center justify-center gap-2.5 rounded-[24px] border py-3.5 w-full shadow-lg transition-all ${errorMessage ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
            <div className={`shrink-0 ${errorMessage ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {isUpdating ? <Loader2 size={18} className="animate-spin" /> : errorMessage ? <AlertCircle size={18} strokeWidth={2.5} /> : <LinkIcon size={18} strokeWidth={2.5} />}
            </div>
            <div className="min-w-0">
              <span className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${errorMessage ? 'text-red-600/80 dark:text-red-400/80' : 'text-blue-600/80 dark:text-blue-400/80'}`}>
                {errorMessage || "Link Active"}
              </span>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[8px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors underline underline-offset-4 decoration-border-subtle"
                >
                  {showCopyFeedback ? "Copied" : "Copy"}
                </button>
                <button 
                  type="button"
                  onClick={handleToggleShare}
                  disabled={isUpdating || isPending}
                  className="text-[8px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-600 transition-colors"
                >
                  {isUpdating ? "..." : "Disable"}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <button
          type="button"
          onClick={handleToggleShare}
          disabled={isUpdating || isPending}
          className={`group flex items-center justify-center gap-2.5 rounded-[24px] border py-3.5 w-full transition-all active:scale-[0.98] disabled:opacity-50 ${
            errorMessage ? 'border-red-500/20 bg-red-500/5 text-red-600' : 'border-border-subtle bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground hover:border-border-strong hover:shadow-premium'
          }`}
        >
          <div className={`shrink-0 transition-all ${errorMessage ? 'text-red-600' : 'text-dim group-hover:text-foreground group-hover:scale-110'}`}>
            {isUpdating ? <Loader2 size={18} className="animate-spin" /> : errorMessage ? <AlertCircle size={18} /> : <Share size={18} strokeWidth={2.5} />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
            {errorMessage || "Share Report"}
          </span>
        </button>
      </div>
    );
  }

  if (isPublic && shareToken) {
    return (
      <div className="w-full">
        <div className={`group relative flex items-center justify-center gap-2.5 rounded-[24px] border py-3.5 w-full shadow-xl transition-all ${errorMessage ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
          <div className={`shrink-0 ${errorMessage ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {isUpdating ? <Loader2 size={18} className="animate-spin" /> : errorMessage ? <AlertCircle size={18} strokeWidth={2.5} /> : <LinkIcon size={18} strokeWidth={2.5} />}
          </div>
          <div className="min-w-0 space-y-1">
            <span className={`block text-[9px] font-black uppercase tracking-[0.2em] ${errorMessage ? 'text-red-600/80 dark:text-red-400/80' : 'text-blue-600/80 dark:text-blue-400/80'}`}>
              {errorMessage || "Public link active"}
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleCopyLink}
                className="text-[8px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors underline underline-offset-4 decoration-border-subtle"
              >
                {showCopyFeedback ? "Link copied" : "Copy link"}
              </button>
              <span className="text-muted/20 text-[8px]">•</span>
              <button 
                type="button"
                onClick={handleToggleShare}
                disabled={isUpdating || isPending}
                className="text-[8px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-600 transition-colors"
              >
                {isUpdating ? "..." : "Disable"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleToggleShare}
        disabled={isUpdating || isPending}
        className={`group flex items-center justify-center gap-2.5 rounded-[24px] border py-3.5 w-full transition-all hover:shadow-xl active:scale-[0.97] disabled:opacity-50 ${
          errorMessage ? 'border-red-500/20 bg-red-500/5' : 'border-border-subtle bg-card-overlay hover:bg-card-overlay-hover hover:border-border-strong'
        }`}
      >
        <div className={`shrink-0 transition-all ${errorMessage ? 'text-red-600' : 'text-dim group-hover:text-foreground group-hover:scale-110'}`}>
          {isUpdating ? <Loader2 size={18} className="animate-spin" /> : errorMessage ? <AlertCircle size={18} strokeWidth={2.5} /> : <Share size={18} strokeWidth={2.5} />}
        </div>
        <div className="min-w-0">
          <span className={`block text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${errorMessage ? 'text-red-600/80 dark:text-red-400/80' : 'text-muted group-hover:text-foreground'}`}>
            {errorMessage || "Share Report"}
          </span>
        </div>
      </button>
    </div>
  );
}
