'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ArrowRight, HelpCircle, ChevronLeft } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';

export function EmailSignInForm({ callbackUrl = '/vehicles' }: { callbackUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Flow states
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid email or password.');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setError(null);

    try {
      const result = await requestPasswordReset(forgotEmail.toLowerCase().trim());
      setForgotSuccess(result.message);
    } catch (err: any) {
      // Even on real error, we show generic success for security if instructed
      setForgotSuccess('If an account exists for this email, we’ll send a reset link.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  if (showForgotForm) {
    return (
      <div className="space-y-6 w-full animate-in fade-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => {
            setShowForgotForm(false);
            setForgotSuccess(null);
            setForgotEmail('');
          }}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Back to Sign In
        </button>

        <div className="text-left space-y-2">
          <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Reset Password</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">
            Enter your email to receive a recovery link.
          </p>
        </div>

        {forgotSuccess ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4 animate-in zoom-in-95 duration-500">
            <p className="text-xs font-medium text-blue-400 italic leading-relaxed">
              {forgotSuccess}
            </p>
            <button
              onClick={() => setShowForgotForm(false)}
              className="w-full h-12 rounded-xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={isForgotLoading}
                className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] pl-12 pr-4 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isForgotLoading || !forgotEmail}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-foreground p-5 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isForgotLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] pl-12 pr-4 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] pl-12 pr-4 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-foreground p-5 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setShowForgotForm(true)}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
        >
          <HelpCircle size={12} />
          Forgot password?
        </button>
      </div>
    </div>
  );
}
