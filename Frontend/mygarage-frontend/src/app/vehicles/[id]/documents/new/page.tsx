'use client';

import { use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DocumentForm } from '@/components/vehicles/DocumentForm';
import { ArrowLeft } from 'lucide-react';

export default function NewDocumentPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  
  return (
    <main className="min-h-screen bg-black px-6 pt-20 pb-12">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href={`/vehicles/${vehicleId}?tab=documents`}
            className="group mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Documents
          </Link>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase italic">
            Register <span className="text-white/40">Record</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-white/40">
            Store a digital record or reference for your vehicle.
          </p>
        </header>

        <DocumentForm vehicleId={vehicleId} />
      </div>
    </main>
  );
}
