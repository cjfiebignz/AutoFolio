'use client';

import { useState, useEffect, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { 
  ShieldCheck, 
  Mail, 
  User, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';
import { 
  getAccountMetadata, 
  changePassword, 
  setPassword, 
  deleteAccount,
  updateAccount,
  resendVerificationEmail,
  cancelEmailChange
} from '@/lib/api';
import { AccountMetadata } from '@/types/autofolio';

export function AccountSecuritySection({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [metadata, setMetadata] = useState<AccountMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Identity editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPendingEmail, setIsEditingPendingEmail] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  
  const [pendingSuccess, setPendingSuccess] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    try {
      const data = await getAccountMetadata(userId);
      setMetadata(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load account security status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [userId]);

  // Sync edit states when metadata loads
  useEffect(() => {
    if (metadata) {
      setEditName(metadata.name || '');
      if (!isEditingPendingEmail) {
        setEditEmail(metadata.pendingEmail || metadata.email || '');
      }
    }
  }, [metadata, isEditingPendingEmail]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const updated = await updateAccount({ userId, name: editName });
      setMetadata(updated);
      setSuccess('Display name updated successfully.');
      setIsEditingName(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update name.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingError(null);
    setPendingSuccess(null);

    if (editEmail !== confirmEmail) {
      const err = 'Email addresses do not match.';
      if (isEditingPendingEmail) setPendingError(err);
      else setError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateAccount({ userId, email: editEmail });
      setMetadata(updated);
      const msg = `Verification email sent to ${editEmail}. Your current email remains active until verified.`;
      
      if (isEditingPendingEmail) {
        setPendingSuccess(msg);
        setIsEditingPendingEmail(false);
      } else {
        setSuccess(msg);
        setIsEditingEmail(false);
      }
      setConfirmEmail('');
    } catch (err: any) {
      if (isEditingPendingEmail) setPendingError(err.message || 'Failed to update pending email.');
      else setError(err.message || 'Failed to update email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async (purpose?: string) => {
    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      await resendVerificationEmail(userId, purpose);
      setResendSuccess('Verification email resent successfully. Please check your inbox.');
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCancelPendingChange = async () => {
    setIsCancelling(true);
    setPendingError(null);
    setPendingSuccess(null);

    try {
      const updated = await cancelEmailChange(userId);
      setMetadata(updated);
      setPendingSuccess('Email change cancelled.');
      setShowCancelConfirm(false);
    } catch (err: any) {
      setPendingError(err.message || 'Failed to cancel email change.');
    } finally {
      setIsCancelling(false);
    }
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-zA-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      return 'Password must contain at least one letter and one number.';
    }
    return null;
  };

  const handlePasswordAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const passError = validatePassword(newPassword);
    if (passError) {
      setError(passError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (metadata?.hasPassword) {
        if (!currentPassword) {
          setError('Current password is required.');
          setIsSubmitting(false);
          return;
        }
        await changePassword({ userId, currentPassword, newPassword });
        setSuccess('Password updated successfully.');
      } else {
        await setPassword({ userId, newPassword });
        setSuccess('Password set successfully. You can now sign in with your email and password.');
        // Refresh metadata to show "Password enabled"
        await fetchMetadata();
      }
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== metadata?.email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteAccount(userId);
      // Success - sign out
      signOut({ callbackUrl: '/' });
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate account.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Verification Status Banners */}
      <div className="space-y-4">
        {!metadata?.emailVerifiedAt && !metadata?.pendingEmail && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="rounded-[32px] border border-orange-500/20 bg-orange-500/5 p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground italic">Email Not Verified</h4>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                  Verify your email to secure your account and receive critical system alerts.
                </p>
              </div>
              <button
                onClick={() => handleResendVerification('registration')}
                disabled={isResending}
                className="h-12 px-6 rounded-xl bg-orange-600 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500 active:scale-95 shadow-lg disabled:opacity-50 shrink-0"
              >
                {isResending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Resend Email'}
              </button>
            </div>
            
            {(resendSuccess || resendError) && (
              <div className={`mx-2 rounded-2xl border p-4 text-[10px] font-bold uppercase tracking-widest animate-in zoom-in-95 ${resendError ? 'border-red-500/20 bg-red-500/10 text-red-600' : 'border-green-500/20 bg-green-500/10 text-green-600'}`}>
                {resendError || resendSuccess}
              </div>
            )}
          </div>
        )}

        {metadata?.pendingEmail && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="rounded-[32px] border border-blue-500/20 bg-blue-500/5 p-8 shadow-premium">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner shrink-0">
                  <Clock size={24} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground italic">Email Change Pending</h4>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                    Verifying new address: <span className="text-foreground">{metadata.pendingEmail}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => handleResendVerification('email_change')}
                    disabled={isResending || isEditingPendingEmail}
                    className="h-10 px-4 rounded-xl bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 active:scale-95 shadow-lg disabled:opacity-50"
                  >
                    {isResending ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Resend Email'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPendingEmail(!isEditingPendingEmail);
                      setEditEmail(metadata.pendingEmail || '');
                      setConfirmEmail('');
                      setPendingError(null);
                      setPendingSuccess(null);
                    }}
                    disabled={isSubmitting || isResending || isCancelling}
                    className="h-10 px-4 rounded-xl bg-foreground/5 border border-border-subtle text-[9px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 transition-all active:scale-95"
                  >
                    {isEditingPendingEmail ? 'Cancel Edit' : 'Edit Address'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isSubmitting || isResending || isCancelling || isEditingPendingEmail}
                    className="h-10 px-4 rounded-xl bg-red-500/5 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 active:scale-95"
                  >
                    Cancel Change
                  </button>
                </div>
              </div>

              {isEditingPendingEmail && (
                <form onSubmit={handleUpdateEmail} className="mt-6 border-t border-border-subtle pt-6 space-y-4 animate-in slide-in-from-top-1 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Corrected Email</label>
                      <input
                        autoFocus
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full h-12 rounded-xl border border-border-subtle bg-foreground/[0.02] px-4 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all"
                        placeholder="Enter corrected email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Confirm Email</label>
                      <input
                        type="email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        className="w-full h-12 rounded-xl border border-border-subtle bg-foreground/[0.02] px-4 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all"
                        placeholder="Confirm corrected email"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !editEmail || editEmail === metadata.pendingEmail}
                    className="w-full sm:w-auto px-8 h-12 rounded-xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Update Pending Email'}
                  </button>
                </form>
              )}

              {showCancelConfirm && (
                <div className="mt-6 border-t border-border-subtle pt-6 space-y-4 animate-in slide-in-from-top-1 duration-300 text-center sm:text-left">
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-widest text-foreground">Cancel email change?</h5>
                    <p className="text-[10px] font-medium text-dim italic mt-1">This will stop the change process and keep your current email active.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    <button
                      onClick={handleCancelPendingChange}
                      disabled={isCancelling}
                      className="h-10 px-6 rounded-xl bg-red-600 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-500 active:scale-95 shadow-lg disabled:opacity-50"
                    >
                      {isCancelling ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Yes, Cancel Change'}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={isCancelling}
                      className="h-10 px-6 rounded-xl bg-foreground/5 border border-border-subtle text-[9px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 transition-all active:scale-95"
                    >
                      No, Keep Pending
                    </button>
                  </div>
                </div>
              )}
            </div>

            {(resendSuccess || resendError || pendingSuccess || pendingError) && (
              <div className={`mx-2 rounded-2xl border p-4 text-[10px] font-bold uppercase tracking-widest animate-in zoom-in-95 ${ (resendError || pendingError) ? 'border-red-500/20 bg-red-500/10 text-red-600' : 'border-green-500/20 bg-green-500/10 text-green-600'}`}>
                {resendError || resendSuccess || pendingError || pendingSuccess}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Account Identity */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground/5 text-muted border border-border-subtle shadow-inner">
            <User size={16} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground italic">Identity</h3>
        </div>

        <div className="grid gap-6">
          {/* Name Card */}
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 shadow-2xl transition-all hover:border-border-strong group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-muted opacity-40">
                <User size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Account Name</span>
              </div>
              {!isEditingName && (
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-accent hover:opacity-80 transition-opacity"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingName ? (
              <form onSubmit={handleUpdateName} className="space-y-4 animate-in fade-in slide-in-from-top-1">
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all"
                  placeholder="Enter full name"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save Name'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(metadata?.name || '');
                    }}
                    className="flex-1 h-12 rounded-xl bg-foreground/5 text-[10px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xl font-black italic tracking-tighter text-foreground uppercase">{metadata?.name || 'Not set'}</p>
            )}
          </div>

          {/* Email Card */}
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 shadow-2xl transition-all hover:border-border-strong group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-muted opacity-40">
                <Mail size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
              </div>
              {!isEditingEmail && !metadata?.pendingEmail && (
                <button 
                  onClick={() => setIsEditingEmail(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-accent hover:opacity-80 transition-opacity"
                >
                  Change
                </button>
              )}
              {metadata?.pendingEmail && (
                 <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 italic">Change Pending</span>
              )}
            </div>

            {isEditingEmail ? (
              <form onSubmit={handleUpdateEmail} className="space-y-4 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-3">
                  <input
                    autoFocus
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all"
                    placeholder="Enter new email"
                  />
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all"
                    placeholder="Confirm new email"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !editEmail || editEmail === metadata?.email}
                    className="flex-1 h-12 rounded-xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Update Email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setEditEmail(metadata?.email || '');
                      setConfirmEmail('');
                    }}
                    className="flex-1 h-12 rounded-xl bg-foreground/5 text-[10px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[9px] font-medium text-dim px-1 italic">Note: Verification will be required for the new email.</p>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xl font-black italic tracking-tighter text-foreground uppercase">{metadata?.email}</p>
                {metadata?.emailVerifiedAt ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                    <CheckCircle2 size={10} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                    <AlertCircle size={10} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Unverified</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-2">
            <InfoCard 
              label="Sign-in Status" 
              value={metadata?.hasPassword ? 'Password Enabled' : 'Google-only Access'} 
              icon={<ShieldCheck size={12} />} 
              accent={metadata?.hasPassword}
            />
            <InfoCard label="Member Since" value={new Date(metadata?.createdAt || '').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} icon={<CheckCircle2 size={12} />} />
          </div>
        </div>
      </section>

      {(error || success) && !isEditingName && !isEditingEmail && !isEditingPendingEmail && (
        <div className={`rounded-2xl border p-4 text-xs font-bold animate-in fade-in slide-in-from-top-1 ${
          error ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400' : 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'
        }`}>
          <div className="flex items-center gap-2">
            {error ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {error || success}
          </div>
        </div>
      )}

      {/* 2. Password Management */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground/5 text-muted border border-border-subtle shadow-inner">
            <Lock size={16} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground italic">
            {metadata?.hasPassword ? 'Change Password' : 'Set Password'}
          </h3>
        </div>

        <form onSubmit={handlePasswordAction} className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-6 shadow-2xl">
          <div className="space-y-4">
            {metadata?.hasPassword && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Current Password</label>
                <div className="relative group">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">New Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Confirm New Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 focus:bg-foreground/[0.04] outline-none transition-all"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors ml-1"
            >
              {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
              {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newPassword}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-foreground p-5 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {metadata?.hasPassword ? 'Update Password' : 'Set Account Password'}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </section>

      {/* 3. Danger Zone */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 shadow-inner">
            <AlertTriangle size={16} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-red-500 italic">Danger Zone</h3>
        </div>

        <div className="rounded-[32px] border border-red-500/10 bg-red-500/[0.02] p-8 space-y-8 shadow-2xl">
          <div className="space-y-2">
            <h4 className="text-base font-black italic tracking-tighter text-foreground uppercase">Deactivate Account</h4>
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted leading-relaxed italic">
                This will deactivate your current AutoFolio account and disconnect all linked sign-in methods. 
              </p>
              <p className="text-[10px] font-medium text-dim leading-relaxed italic border-l border-border-subtle pl-4">
                Your vehicle and garage data will be preserved internally for now, but you will no longer be able to sign in to this specific account. 
                You can create a brand-new account later using the same email address; however, your previous garage data will not be automatically restored to the new account.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-red-500/60 ml-1">
                Type your email to confirm: <span className="text-foreground">{metadata?.email}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Confirm email address"
                className="w-full h-14 rounded-2xl border border-red-500/10 bg-red-500/[0.02] px-6 text-sm font-bold text-foreground focus:border-red-500/20 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={isSubmitting || deleteConfirmation !== metadata?.email}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 active:scale-[0.98] disabled:opacity-20 disabled:grayscale disabled:active:scale-100"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Deactivate My Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-card-overlay p-6 transition-all hover:border-border-strong group shadow-lg">
      <div className="flex items-center gap-2 text-muted opacity-40 group-hover:opacity-60 transition-opacity">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-bold truncate ${accent ? 'text-blue-500' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
