'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AccountPageShell } from "@/components/AccountPageShell";
import { usePlan } from "@/lib/plan-context";
import { updateUserPreferences } from "@/lib/api";
import { CreditCard, Zap, CheckCircle2, Crown, Loader2, ArrowRight } from "lucide-react";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { plan, vehicleCount, refreshPlan, loading } = usePlan();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePlanChange = async (newPlan: 'free' | 'pro') => {
    if (!session?.user?.id) return;
    
    setError(null);
    try {
      await updateUserPreferences(session.user.id, { plan: newPlan });
      await refreshPlan();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update plan');
    }
  };

  if (loading) {
    return (
      <AccountPageShell title="Subscription" subtext="Plans & Billing Management">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      </AccountPageShell>
    );
  }

  const isPro = plan?.tier === 'pro';

  return (
    <AccountPageShell 
      title="Subscription" 
      subtext="Manage your garage access and plan limits"
    >
      <div className="space-y-10">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Current Usage Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-dim mb-1">Current Plan</p>
            <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-none">
              {plan?.label || 'Free'} Tier
            </h2>
          </div>
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-dim mb-1">Garage Usage</p>
            <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-none">
              {vehicleCount} / {plan?.maxVehicles || 1} <span className="text-sm not-italic tracking-normal text-dim">Used</span>
            </h2>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <div className={`relative overflow-hidden rounded-[40px] border p-10 transition-all ${!isPro ? 'border-border-strong bg-card-overlay-hover shadow-xl' : 'border-border-subtle bg-card-overlay opacity-60'}`}>
            {!isPro && (
              <div className="absolute top-6 right-8">
                <span className="rounded-full bg-foreground/10 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-muted border border-border-subtle">Current</span>
              </div>
            )}
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black italic text-foreground uppercase tracking-tight">Free</h3>
                <p className="text-sm font-medium text-muted">Track your main vehicle</p>
              </div>
              
              <div className="space-y-4">
                <FeatureItem label="1 Vehicle Limit" active={!isPro} />
                <FeatureItem label="Maintenance Logging" active={!isPro} />
                <FeatureItem label="Basic Specs" active={!isPro} />
              </div>

              {isPro && (
                <button
                  disabled={isPending}
                  onClick={() => handlePlanChange('free')}
                  className="w-full flex h-14 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-xs font-black uppercase tracking-widest text-foreground transition-all hover:bg-card-overlay-hover active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : "Switch to Free"}
                </button>
              )}
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className={`relative overflow-hidden rounded-[40px] border p-10 transition-all ${isPro ? 'border-blue-500/30 bg-blue-500/5 ring-1 ring-blue-500/20 shadow-xl' : 'border-border-subtle bg-card-overlay opacity-60'}`}>
            {isPro && (
              <div className="absolute top-6 right-8">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border border-blue-500/20">Active</span>
              </div>
            )}
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-black italic text-foreground uppercase tracking-tight">Pro</h3>
                </div>
                <p className="text-sm font-medium text-muted">Manage your full garage</p>
              </div>
              
              <div className="space-y-4">
                <FeatureItem label="10 Vehicle Limit" active={isPro} />
                <FeatureItem label="Advanced PDF Exports" active={isPro} />
                <FeatureItem label="Project Planning" active={isPro} />
                <FeatureItem label="Priority Support" active={isPro} />
              </div>

              {!isPro ? (
                <button
                  disabled={isPending}
                  onClick={() => handlePlanChange('pro')}
                  className="w-full flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] shadow-xl disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : (
                    <>
                      Upgrade to Pro
                      <ArrowRight size={16} strokeWidth={3} />
                    </>
                  )}
                </button>
              ) : (
                <div className="h-14 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-blue-600/40 dark:text-blue-400/40 italic">
                  Premium Access Enabled
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Development Note */}
        <div className="rounded-[32px] border border-dashed border-border-subtle bg-foreground/[0.01] p-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-card-overlay border border-border-subtle text-dim">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dim mb-2">Test Mode Active</p>
          <p className="text-sm font-medium leading-relaxed text-muted max-w-sm mx-auto">
            Stripe integration is currently in development. You can manually toggle between plans for testing purposes during the early access phase.
          </p>
        </div>
      </div>
    </AccountPageShell>
  );
}

function FeatureItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 size={14} className={active ? "text-blue-600 dark:text-blue-400" : "text-dim opacity-40"} />
      <p className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-foreground opacity-80' : 'text-dim'}`}>{label}</p>
    </div>
  );
}
