'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createService, updateService, CreateServiceEventData } from '@/lib/api';
import { FormInput, FormSection, FormTextArea } from '@/components/ui/FormComponents';
import { usePreferences, KM_TO_MILES } from '@/lib/preferences';
import { Wrench, Settings, Paperclip, X, Plus, Move, Camera, Loader2 } from 'lucide-react';
import { ServiceAttachmentsDisplay } from '../ServiceAttachmentsDisplay';

interface ServiceFormProps {
  vehicleId: string;
  vehicleNickname: string;
  initialData?: any;
  serviceId?: string;
}

/**
 * ServiceForm
 * 
 * Canonical form for creating and editing service records.
 * Optimized for Next.js 15 hydration stability.
 */
export function ServiceForm({ vehicleId, vehicleNickname, initialData, serviceId }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getUnitLabel, getDistanceValue, preferences } = usePreferences();
  
  // Standardize state initialization to ensure stable hydration
  const [serviceType, setServiceType] = useState<'workshop' | 'diy'>(initialData?.serviceType || 'workshop');
  const [isMainService, setIsMainService] = useState<boolean>(initialData?.isMainService ?? true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const odometerRaw = formData.get('odometer') as string;
    const costRaw = formData.get('cost') as string;
    const notesRaw = formData.get('notes') as string;

    const data: CreateServiceEventData = {
      title: formData.get('title') as string,
      eventDate: new Date(formData.get('date') as string).toISOString(),
      serviceType: serviceType,
      isMainService: isMainService,
      odometerAtEvent: odometerRaw ? (preferences.distanceUnit === 'miles' ? Math.round(Number(odometerRaw) / KM_TO_MILES) : Number(odometerRaw)) : undefined,
      totalCost: costRaw ? Number(costRaw) : undefined,
      notes: notesRaw || undefined,
    };

    try {
      if (serviceId) {
        await updateService(vehicleId, serviceId, data);
      } else {
        await createService(vehicleId, data);
      }

      // Small delay to ensure "Saving..." state is visible for UX consistency
      await new Promise(resolve => setTimeout(resolve, 300));

      startTransition(() => {
        router.push(`/vehicles/${vehicleId}?tab=service`);
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
      setIsSubmitting(false);
    }
  };

  const formattedDate = initialData?.eventDate 
    ? new Date(initialData.eventDate).toISOString().split('T')[0] 
    : '';

  return (
    <form onSubmit={handleSubmit} method="POST" className="space-y-10 pb-12">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form Section: Basics */}
      <FormSection title="Service Details" icon={<Wrench size={14} />}>
        {/* Service Scope Selection - Top Left Position */}
        <div className="mb-8 space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 ml-1">Service Scope</label>
          <div className="grid grid-cols-2 gap-3">
            <ScopeButton 
              title="Main Service"
              description="Influences next interval"
              active={isMainService}
              onClick={() => setIsMainService(true)}
              disabled={isSubmitting}
            />
            <ScopeButton 
              title="Sub Service"
              description="Purely documentational"
              active={!isMainService}
              onClick={() => setIsMainService(false)}
              disabled={isSubmitting}
            />
          </div>
          <p className="px-1 text-[9px] font-medium leading-relaxed text-muted opacity-60 uppercase tracking-widest italic">
            {isMainService 
              ? "• Main Service baseline drives future service reminder calculations" 
              : "• Sub Service is logged in history but does not reset the main service baseline"}
          </p>
        </div>

        <FormInput 
          name="title" 
          label="Service Title" 
          placeholder="e.g. Engine Oil & Filter Change" 
          required 
          defaultValue={initialData?.title}
          disabled={isSubmitting} 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            name="date" 
            label="Date" 
            type="date" 
            required 
            defaultValue={formattedDate} 
            disabled={isSubmitting} 
          />
          <FormInput 
            name="odometer" 
            label={`Odometer (${getUnitLabel()})`} 
            type="number" 
            placeholder="Optional" 
            defaultValue={getDistanceValue(initialData?.odometerAtEvent) ?? undefined}
            suffix={getUnitLabel()} 
            disabled={isSubmitting} 
          />
        </div>
      </FormSection>

      {/* Form Section: Logistics */}
      <FormSection title="Logistics" icon={<Settings size={14} />}>
        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            name="cost" 
            label="Total Cost" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            defaultValue={initialData?.totalCost}
            prefix="$" 
            disabled={isSubmitting} 
          />
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 ml-1">Service Type</label>
            <div className="flex h-12 rounded-2xl bg-foreground/[0.03] p-1 border border-border-subtle">
              <TypeButton 
                label="Workshop" 
                active={serviceType === 'workshop'} 
                onClick={() => setServiceType('workshop')} 
                disabled={isSubmitting}
              />
              <TypeButton 
                label="DIY" 
                active={serviceType === 'diy'} 
                onClick={() => setServiceType('diy')} 
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <FormTextArea 
          name="notes" 
          label="Notes" 
          placeholder="List parts used or specific observations..." 
          defaultValue={initialData?.notes}
          rows={4}
          disabled={isSubmitting}
        />
      </FormSection>

      {/* Form Section: Attachments */}
      <FormSection title="Service Attachments" icon={<Paperclip size={14} />}>
        {serviceId ? (
          <div className="-mt-4">
            <ServiceAttachmentsDisplay 
              vehicleId={vehicleId} 
              serviceId={serviceId} 
              attachments={initialData?.attachments || []} 
            />
          </div>
        ) : (
          <div className="group relative flex flex-col items-center justify-center rounded-[32px] border border-dashed border-border-subtle bg-foreground/[0.01] py-12 text-center transition-all hover:bg-foreground/[0.02] hover:border-border-strong">
            <div className="mb-4 relative">
              <div className="absolute -inset-4 rounded-full bg-foreground/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-muted group-hover:text-foreground transition-colors">
                <Paperclip size={24} strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2 px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">Ready for records</p>
              <p className="mx-auto max-w-[280px] text-[11px] font-medium leading-relaxed text-dim">
                You can attach receipts, invoices, and photos once this service record is initially saved.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-2 border border-border-subtle">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-dim">Save to unlock uploads</span>
            </div>
          </div>
        )}
      </FormSection>

      {/* Form Actions */}
      <footer className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
        <Link 
          href={`/vehicles/${vehicleId}?tab=service`}
          className={`flex h-14 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-sm font-bold text-foreground transition-all hover:bg-card-overlay-hover active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </Link>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : (serviceId ? "Save Changes" : "Add Record")}
        </button>
      </footer>
    </form>
  );
}

function TypeButton({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active 
          ? "bg-surface text-foreground shadow-sm" 
          : "text-muted opacity-40 hover:text-foreground"
      } disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function ScopeButton({ title, description, active, onClick, disabled }: { title: string; description: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex flex-col items-start gap-1 rounded-3xl border p-5 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
        active
          ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
          : "border-border-subtle bg-card-overlay hover:bg-card-overlay-hover hover:border-border-strong"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className={`text-sm font-black uppercase tracking-widest ${active ? "text-blue-600 dark:text-blue-400" : "text-muted opacity-60"}`}>
          {title}
        </span>
        <div className={`h-2 w-2 rounded-full transition-all ${active ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-foreground/10"}`} />
      </div>
      <p className={`text-[10px] font-medium leading-relaxed uppercase tracking-wider transition-colors ${active ? "text-blue-500/60 dark:text-blue-400/60" : "text-dim opacity-40 group-hover:text-muted"}`}>
        {description}
      </p>
    </button>
  );
}
