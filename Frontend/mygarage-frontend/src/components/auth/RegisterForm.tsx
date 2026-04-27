'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { registerUser } from '@/lib/api';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    if (!formData.email.includes('@')) return 'Please enter a valid email address.';
    if (formData.password.length < 8) return 'Password must be at least 8 characters.';
    
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasLetter || !hasNumber) return 'Password must contain at least one letter and one number.';
    
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        name: formData.name || undefined,
      });

      setIsSuccess(true);
      
      // Auto sign-in
      const result = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
        callbackUrl: '/vehicles',
      });

      if (result?.error) {
        // If auto sign-in fails for some reason, redirect to sign-in page
        router.push('/?success=registered');
      } else {
        router.push('/vehicles');
        router.refresh();
      }
    } catch (err: any) {
      if (err.status === 409) {
        if (err.message.toLowerCase().includes('deactivated')) {
          setError(err.message);
        } else {
          setError('An account already exists with this email. Sign in instead.');
        }
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2 border border-green-500/20 shadow-inner">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Account Created</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted max-w-[240px] leading-relaxed">
            Please check your email to verify your address. Preparing your garage...
          </p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-accent mt-4 opacity-40" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Name (Optional)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] pl-12 pr-4 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-4 w-4 group-focus-within:text-foreground transition-colors" />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            placeholder="Confirm Password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            Create Account
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
