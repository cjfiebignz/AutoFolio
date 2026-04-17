'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { getUserVehicleWithSpecs, updateVehicle, UpdateVehicleData } from '@/lib/api';
import { usePlan } from '@/lib/plan-context';
import { UserVehicle } from '@/types/autofolio';
import { FormInput, FormSection } from '@/components/ui/FormComponents';
import { AppFooterBrand } from '@/components/AppFooterBrand';
import { Car, Cpu, ArrowLeft } from 'lucide-react';

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { refreshPlan } = usePlan();
  
  const [vehicle, setVehicle] = useState<UserVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    async function loadVehicle() {
      try {
        const data = await getUserVehicleWithSpecs(id);
        
        // Deep serialize to handle any raw Date objects from API before setting state
        const serializedVehicle = JSON.parse(JSON.stringify(data.vehicle));

        // Security check: only allow if owner matches session
        if (session?.user?.id && serializedVehicle.userId !== session.user.id) {
          router.push("/vehicles");
          return;
        }

        setVehicle(serializedVehicle);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicle');
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      loadVehicle();
    }
  }, [id, status, session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const yearRaw = formData.get('year') as string;
    
    const updateData: UpdateVehicleData = {
      nickname: formData.get('nickname') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: yearRaw ? parseInt(yearRaw, 10) : undefined,
      licensePlate: formData.get('licensePlate') as string,
      vin: (formData.get('vin') as string) || undefined,
      specId: (formData.get('specId') as string) || undefined,
    };

    try {
      await updateVehicle(id, updateData);
      router.push(`/vehicles/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle');
      setIsSubmitting(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-foreground" />
      </div>
    );
  }

  if (!vehicle && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <p className="text-muted mb-4 text-sm font-bold uppercase tracking-widest">{error || 'Vehicle not found'}</p>
        <Link href="/vehicles" className="text-foreground text-xs font-black uppercase tracking-widest underline underline-offset-4 decoration-border-subtle hover:decoration-foreground transition-all">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { deleteVehicle } = await import('@/lib/api');
      await deleteVehicle(id);
      await refreshPlan();
      router.push('/vehicles');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete vehicle');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 pt-20 pb-12">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href={`/vehicles/${id}`}
            className={`group mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dim transition-colors hover:text-foreground ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Vehicle
          </Link>
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase italic text-foreground/90">
            Edit <span className="text-muted">Vehicle</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-muted">
            Update the primary identity and technical link for your vehicle.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
              {error}
            </div>
          )}

          <FormSection title="Vehicle Identity" icon={<Car size={14} />}>
            <FormInput 
              name="nickname" 
              label="Nickname" 
              defaultValue={vehicle?.nickname || ''} 
              required 
              disabled={isSubmitting} 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                name="make" 
                label="Make" 
                defaultValue={vehicle?.make || ''} 
                required 
                disabled={isSubmitting} 
              />
              <FormInput 
                name="model" 
                label="Model" 
                defaultValue={vehicle?.model || ''} 
                required 
                disabled={isSubmitting} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                name="year" 
                label="Year" 
                type="number"
                defaultValue={vehicle?.year || ''} 
                required 
                disabled={isSubmitting} 
              />
              <FormInput 
                name="licensePlate" 
                label="License Plate" 
                defaultValue={vehicle?.licensePlate || ''} 
                required 
                disabled={isSubmitting} 
              />
            </div>
          </FormSection>

          <FormSection title="Technical Details" icon={<Cpu size={14} />}>
            <FormInput 
              name="vin" 
              label="VIN (Optional)" 
              defaultValue={vehicle?.vin || ''} 
              disabled={isSubmitting} 
            />
            <FormInput 
              name="specId" 
              label="SpecHUB ID (Optional)" 
              defaultValue={vehicle?.specId || ''} 
              disabled={isSubmitting} 
            />
          </FormSection>

          <footer className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
            <Link 
              href={`/vehicles/${id}`}
              className={`flex h-14 items-center justify-center rounded-2xl border border-border-strong bg-card-overlay text-sm font-bold text-foreground transition-all hover:bg-card-overlay-hover active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </form>

        <div className="mt-20 border-t border-border-subtle pt-10">
          <div className="rounded-[32px] border border-red-500/10 bg-red-500/[0.02] p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Danger Zone</h3>
            <p className="mt-2 text-xs font-medium text-dim">
              Permanently remove this vehicle and all its associated service history, documents, and reminders.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Deleting..." : "Delete Vehicle"}
            </button>
          </div>
        </div>

        <AppFooterBrand />
      </div>
    </main>
  );
}
