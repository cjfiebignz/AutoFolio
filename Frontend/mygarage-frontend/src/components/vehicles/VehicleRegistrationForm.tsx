'use client';

import { useSession } from "next-auth/react";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createVehicle } from '@/lib/api';
import { FormInput, FormSection } from '@/components/ui/FormComponents';
import { Car, Cpu, Plus, X, Lock } from 'lucide-react';
import { useVehicleLimitGate } from '@/lib/limit-gate';
import { usePlan } from '@/lib/plan-context';

export function VehicleRegistrationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkLimit } = useVehicleLimitGate();
  const { plan, vehicleCount } = usePlan();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (isSubmitting) return;

    const rawData: any = {};
    formData.forEach((value, key) => { rawData[key] = value; });

    // Manual validation check before plan gate
    if (!rawData.nickname || !rawData.make || !rawData.model || !rawData.year || !rawData.licensePlate) {
      setError("Please fill in all required fields.");
      return;
    }

    // Plan Gate Check
    const maxVehicles = plan?.maxVehicles ?? 1;
    
    if (plan && vehicleCount >= maxVehicles) {
      checkLimit(vehicleCount, maxVehicles, () => {});
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("User session expired. Please sign in again.");
      }

      const payload = {
        nickname: String(rawData.nickname),
        make: String(rawData.make),
        model: String(rawData.model),
        year: parseInt(String(rawData.year), 10),
        licensePlate: String(rawData.licensePlate),
        vin: rawData.vin ? String(rawData.vin) : undefined,
        specId: rawData.specId ? String(rawData.specId) : undefined,
        userId: userId,
      };

      await createVehicle(payload);

      router.push('/vehicles');
      router.refresh();
    } catch (err: any) {
      const message = err.message || '';
      const isLimitError = message.toLowerCase().includes('limit') || 
                          message.toLowerCase().includes('plan') ||
                          message.toLowerCase().includes('maximum');

      if (isLimitError) {
        checkLimit(100, 1, () => {}); 
      } else {
        setError(message || 'Failed to register vehicle. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-12">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {/* Form Section: Identity */}
      <FormSection title="Vehicle Identity" icon={<Car size={14} />}>
        <FormInput 
          name="nickname" 
          label="Nickname" 
          placeholder="e.g. My Daily Driver" 
          required 
          disabled={isSubmitting} 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            name="make" 
            label="Make" 
            placeholder="e.g. Toyota" 
            required 
            disabled={isSubmitting} 
          />
          <FormInput 
            name="model" 
            label="Model" 
            placeholder="e.g. Corolla" 
            required 
            disabled={isSubmitting} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            name="year" 
            label="Year" 
            type="number"
            placeholder="e.g. 2022" 
            required 
            disabled={isSubmitting} 
          />
          <FormInput 
            name="licensePlate" 
            label="License Plate" 
            placeholder="ABC-123" 
            required 
            disabled={isSubmitting} 
          />
        </div>
      </FormSection>

      {/* Form Section: Technical (Optional) */}
      <FormSection title="Technical Details" icon={<Cpu size={14} />}>
        <FormInput 
          name="vin" 
          label="VIN (Optional)" 
          placeholder="17-character VIN" 
          disabled={isSubmitting} 
        />
        
        {plan?.canUseSpecHub ? (
          <FormInput 
            name="specId" 
            label="SpecHUB ID (Optional)" 
            placeholder="e.g. TOY-COR-2022" 
            disabled={isSubmitting} 
          />
        ) : (
          <div 
            className="space-y-2 cursor-pointer group/spec"
            onClick={() => checkLimit(100, 1, () => {})}
          >
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 ml-1">
              SpecHUB ID (Optional)
            </label>
            <div className="relative flex items-center">
              <div className="h-12 w-full rounded-2xl border border-border-subtle bg-foreground/[0.01] px-4 flex items-center justify-between transition-all group-hover/spec:bg-foreground/[0.03] group-hover/spec:border-blue-500/20 group-hover/spec:shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                <span className="text-sm font-bold text-muted opacity-20 italic">Unlock with Pro</span>
                <Lock size={14} className="text-muted opacity-20 group-hover/spec:text-blue-500/40 transition-colors" />
              </div>
            </div>
          </div>
        )}
        
        <div className="px-1">
          <p className="text-[9px] font-medium text-dim italic">
            Linking to SpecHUB provides automated technical reference data. {plan?.canUseSpecHub ? "You can skip this and add specs manually later." : "Upgrade to Pro to increase this limit and unlock automated technical reference data."}
          </p>
        </div>
      </FormSection>

      {/* Form Actions */}
      <footer className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
        <Link 
          href="/vehicles"
          className={`flex h-14 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-sm font-bold text-foreground transition-all hover:bg-card-overlay-hover active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </Link>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? "Registering..." : "Register Vehicle"}
        </button>
      </footer>
    </form>
  );
}
