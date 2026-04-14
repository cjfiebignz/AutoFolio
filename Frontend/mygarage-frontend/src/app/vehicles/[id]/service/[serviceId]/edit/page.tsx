'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserVehicleWithSpecs, getService } from '@/lib/api';

import { ServiceForm } from '@/components/vehicles/service/ServiceForm';
import { ArrowLeft } from 'lucide-react';

export default function EditServicePage({ params }: { params: Promise<{ id: string, serviceId: string }> }) {
  const { id, serviceId } = use(params);
  const [vehicle, setVehicle] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicleData, serviceData] = await Promise.all([
          getUserVehicleWithSpecs(id),
          getService(id, serviceId)
        ]);
        setVehicle(vehicleData.vehicle);
        setService(serviceData);
      } catch (err: any) {
        setError(err.message || 'Failed to load service record');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, serviceId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-white/40 mb-4 text-sm font-bold uppercase tracking-widest">{error || 'Record not found'}</p>
        <Link href={`/vehicles/${id}?tab=service`} className="text-white text-xs font-black uppercase tracking-widest underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all">
          Back to Service Log
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white antialiased">
      <div className="mx-auto max-w-2xl px-6 py-8">
        
        {/* Simple Header */}
        <header className="mb-12 space-y-4">
          <Link 
            href={`/vehicles/${id}?tab=service`}
            className="group flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Cancel
          </Link>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl uppercase italic">
              Edit <span className="text-white/40">Record</span>
            </h1>
            <p className="text-sm font-medium text-white/40">
              Updating for <span className="text-white/60">{vehicle?.nickname}</span>
            </p>
          </div>
        </header>

        {/* The Form Shell */}
        <ServiceForm 
          vehicleId={id} 
          vehicleNickname={vehicle?.nickname || ''} 
          initialData={service}
          serviceId={serviceId}
        />

      </div>
    </div>
  );
}
