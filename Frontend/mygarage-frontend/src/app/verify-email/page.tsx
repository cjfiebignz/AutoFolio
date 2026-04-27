'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmail } from '@/lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  Mail,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const verificationStarted = useRef(false);
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const performVerification = async () => {
      console.log('[VerifyEmail] Initiating verification call...');
      try {
        const result = await verifyEmail(token);
        // Backend returns AccountMetadata on success
        if (result && result.id) {
          setStatus('success');
          setMessage('Your email has been successfully verified.');
        } else {
          setStatus('error');
          setMessage('Verification failed.');
        }
      } catch (err: any) {
        // Prevent overwriting if already successful (guard against late race conditions)
        setStatus((prev) => {
          if (prev === 'success') return prev;
          
          // Handle specific "already used" or "expired" messages from backend if available
          const msg = err.message?.toLowerCase() || '';
          if (msg.includes('expired') || msg.includes('invalid') || msg.includes('used')) {
            setMessage('This verification link is invalid, expired, or has already been used.');
          } else {
            setMessage(err.message || 'An error occurred during verification.');
          }
          return 'error';
        });
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12 text-center animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-12">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-8 rounded-full bg-foreground/[0.03] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <img 
              src="/branding/autofolio-logo.png" 
              alt="AutoFolio Logo" 
              className="relative h-24 w-auto object-contain mx-auto"
            />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Email <span className="text-muted">Verification</span>
          </h1>
        </div>

        {/* Status Card */}
        <div className="rounded-[40px] border border-border-subtle bg-card-overlay p-10 shadow-premium space-y-8">
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center text-muted border border-border-subtle shadow-inner">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-inner animate-in zoom-in-95 duration-500">
                <CheckCircle2 size={32} />
              </div>
            )}
            {status === 'error' && (
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner animate-in zoom-in-95 duration-500">
                <XCircle size={32} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black italic tracking-tighter text-foreground uppercase">
              {status === 'loading' ? 'One Moment' : status === 'success' ? 'Verified' : 'Verification Failed'}
            </h2>
            <p className="text-sm font-medium text-muted leading-relaxed italic px-4">
              {message}
            </p>
          </div>

          <div className="pt-4">
            {status === 'success' ? (
              <Link 
                href="/vehicles"
                className="group flex w-full items-center justify-center rounded-3xl bg-foreground p-5 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
              >
                Go to Garage
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : status === 'error' ? (
              <div className="space-y-4">
                <Link 
                  href="/account"
                  className="flex w-full items-center justify-center rounded-3xl bg-foreground/5 p-5 text-[10px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 transition-all active:scale-[0.98] border border-border-subtle"
                >
                  Manage Account
                </Link>
                <Link 
                  href="/"
                  className="inline-block text-[10px] font-black uppercase tracking-widest text-dim hover:text-foreground transition-colors underline underline-offset-8 decoration-border-subtle"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Info Footer */}
        <div className="flex flex-col items-center gap-2 opacity-40">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted">
            <ShieldCheck size={10} />
            Secure Verification Protocol
          </div>
          <p className="text-[9px] font-medium text-dim max-w-xs leading-relaxed italic">
            Email verification ensures account security and delivery of critical system alerts.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted opacity-20" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
