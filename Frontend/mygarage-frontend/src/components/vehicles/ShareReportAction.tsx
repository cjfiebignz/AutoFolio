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
        <div className={`flex h-14 w-full items-center justify-between gap-3 rounded-2xl border px-6 shadow-lg transition-all ${errorMessage ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {errorMessage ? <AlertCircle size={16} className="text-red-400 shrink-0" /> : <LinkIcon size={16} className="text-blue-400 shrink-0" />}
            <span className={`text-[10px] font-black uppercase tracking-widest truncate ${errorMessage ? 'text-red-400/80' : 'text-blue-400/80'}`}>
              {errorMessage || "Link Active"}
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button 
              type="button"
              onClick={handleCopyLink}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors underline underline-offset-4 decoration-white/10"
            >
              {showCopyFeedback ? "Copied" : "Copy"}
            </button>
            <div className="h-3 w-px bg-white/10" />
            <button 
              type="button"
              onClick={handleToggleShare}
              disabled={isUpdating || isPending}
              className="text-[10px] font-black uppercase tracking-widest text-red-400/40 hover:text-red-400 transition-colors"
            >
              {isUpdating ? "..." : "Disable"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleToggleShare}
        disabled={isUpdating || isPending}
        className={`group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border transition-all active:scale-[0.98] disabled:opacity-50 ${
          errorMessage ? 'border-red-500/20 bg-red-500/5 text-red-400' : 'border-white/10 bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        {isUpdating ? <Loader2 size={16} className="animate-spin text-white/20" /> : errorMessage ? <AlertCircle size={16} /> : <Share size={16} className="text-white/20 group-hover:text-white transition-colors" />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {errorMessage || "Share Report"}
        </span>
      </button>
    );
  }

  if (isPublic && shareToken) {
    return (
      <div className={`group relative flex flex-col items-center justify-center gap-3 rounded-[24px] border py-6 shadow-xl transition-all ${errorMessage ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
        <div className={errorMessage ? 'text-red-400' : 'text-blue-400'}>
          {isUpdating ? <Loader2 size={20} className="animate-spin" /> : errorMessage ? <AlertCircle size={20} strokeWidth={2.5} /> : <LinkIcon size={20} strokeWidth={2.5} />}
        </div>
        <div className="text-center space-y-1 px-2">
          <span className={`block text-[9px] font-black uppercase tracking-[0.2em] ${errorMessage ? 'text-red-400/80' : 'text-blue-400/80'}`}>
            {errorMessage || "Public link active"}
          </span>
          <div className="flex items-center justify-center gap-2">
            <button 
              type="button"
              onClick={handleCopyLink}
              className="text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors underline underline-offset-4 decoration-white/10"
            >
              {showCopyFeedback ? "Link copied" : "Copy link"}
            </button>
            <span className="text-white/10 text-[8px]">•</span>
            <button 
              type="button"
              onClick={handleToggleShare}
              disabled={isUpdating || isPending}
              className="text-[8px] font-black uppercase tracking-widest text-red-400/40 hover:text-red-400 transition-colors"
            >
              {isUpdating ? "..." : "Disable"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleShare}
      disabled={isUpdating || isPending}
      className={`group flex flex-col items-center justify-center gap-3 rounded-[24px] border py-6 transition-all hover:shadow-xl active:scale-[0.97] disabled:opacity-50 ${
        errorMessage ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10'
      }`}
    >
      <div className={`transition-all ${errorMessage ? 'text-red-400' : 'text-white/30 group-hover:text-white group-hover:scale-110'}`}>
        {isUpdating ? <Loader2 size={20} className="animate-spin" /> : errorMessage ? <AlertCircle size={20} strokeWidth={2.5} /> : <Share size={20} strokeWidth={2.5} />}
      </div>
      <div className="text-center px-2">
        <span className={`block text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${errorMessage ? 'text-red-400/80' : 'text-white/40 group-hover:text-white'}`}>
          {errorMessage || "Share Report"}
        </span>
      </div>
    </button>
  );
}
