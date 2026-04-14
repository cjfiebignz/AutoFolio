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
          <Loader2 className="h-8 w-8 animate-spin text-white/20" />
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
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {/* Current Usage Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Current Plan</p>
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
              {plan?.label || 'Free'} Tier
            </h2>
          </div>
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Garage Usage</p>
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
              {vehicleCount} / {plan?.maxVehicles || 1} <span className="text-sm not-italic tracking-normal text-white/20">Used</span>
            </h2>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <div className={`relative overflow-hidden rounded-[40px] border p-10 transition-all ${!isPro ? 'border-white/20 bg-white/5' : 'border-white/5 bg-white/[0.01]'}`}>
            {!isPro && (
              <div className="absolute top-6 right-8">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10">Current</span>
              </div>
            )}
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black italic text-white uppercase">Free</h3>
                <p className="text-sm font-medium text-white/40">Track your main vehicle</p>
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
                  className="w-full flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : "Switch to Free"}
                </button>
              )}
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className={`relative overflow-hidden rounded-[40px] border p-10 transition-all ${isPro ? 'border-blue-500/30 bg-blue-500/5 ring-1 ring-blue-500/20' : 'border-white/5 bg-white/[0.01]'}`}>
            {isPro && (
              <div className="absolute top-6 right-8">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">Active</span>
              </div>
            )}
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-blue-400" />
                  <h3 className="text-xl font-black italic text-white uppercase">Pro</h3>
                </div>
                <p className="text-sm font-medium text-white/40">Manage your full garage</p>
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
                  className="w-full flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : (
                    <>
                      Upgrade to Pro
                      <ArrowRight size={16} strokeWidth={3} />
                    </>
                  )}
                </button>
              ) : (
                <div className="h-14 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-blue-400/40 italic">
                  Premium Access Enabled
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Development Note */}
        <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] p-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/20">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mb-2">Test Mode Active</p>
          <p className="text-sm font-medium leading-relaxed text-white/30 max-w-sm mx-auto">
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
      <CheckCircle2 size={14} className={active ? "text-blue-400" : "text-white/10"} />
      <p className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white/80' : 'text-white/20'}`}>{label}</p>
    </div>
  );
}
