'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  Lock,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validate = () => {
    if (newPassword.length < 8) return 'Password must be at least 8 characters.';
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) return 'Password must contain at least one letter and one number.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Missing or invalid reset token.');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const result = await resetPassword(token, newPassword);
      if (result.success) {
        setStatus('success');
        setMessage('Your password has been successfully reset.');
      } else {
        setStatus('error');
        setMessage(result.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setStatus('error');
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('expired') || msg.includes('invalid') || msg.includes('used')) {
        setMessage('This reset link is invalid, expired, or has already been used.');
      } else {
        setMessage(err.message || 'An error occurred while resetting your password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12 text-center animate-in fade-in duration-700">
        <div className="w-full max-w-md space-y-8">
           <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
             <XCircle size={32} />
           </div>
           <h1 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Invalid Link</h1>
           <p className="text-sm font-medium text-muted leading-relaxed italic px-4">
             This reset link is invalid or missing a required token.
           </p>
           <Link 
             href="/"
             className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground opacity-60 hover:opacity-100 transition-opacity underline underline-offset-8 decoration-border-subtle hover:decoration-foreground"
           >
             Back to Sign In
           </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12 text-center animate-in fade-in duration-700">
        <div className="w-full max-w-md space-y-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">Password Reset</h1>
            <p className="text-sm font-medium text-muted leading-relaxed italic px-8">
              {message}
            </p>
          </div>
          
          <Link 
            href="/"
            className="group flex w-full items-center justify-center rounded-3xl bg-foreground p-5 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
          >
            Sign In Now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12 text-center animate-in fade-in duration-700">
      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <header className="space-y-6 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dim transition-colors hover:text-foreground mb-4"
          >
            <ArrowLeft size={12} />
            Back to Sign In
          </Link>
          
          <h1 className="text-4xl font-extrabold tracking-tighter uppercase italic text-foreground/90">
            Reset <span className="text-muted">Password</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-dim leading-relaxed">
            Create a secure new password for your AutoFolio account.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          {status === 'error' && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
              <input
                type="password"
                placeholder="New Password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] pl-12 pr-4 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
              <input
                type="password"
                placeholder="Confirm New Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] pl-12 pr-4 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-foreground p-5 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Update Password
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Info Footer */}
        <div className="flex flex-col items-center gap-2 opacity-40 pt-4">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted">
            <ShieldCheck size={10} />
            Secure Protocol
          </div>
          <p className="text-[9px] font-medium text-dim max-w-xs leading-relaxed italic">
            Passwords must be 8+ characters with at least one letter and one number.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted opacity-20" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
