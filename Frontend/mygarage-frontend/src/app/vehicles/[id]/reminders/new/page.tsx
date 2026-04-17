'use client';

import { use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReminderForm } from '@/components/vehicles/ReminderForm';
import { ArrowLeft } from 'lucide-react';

export default function NewReminderPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  
  return (
    <main className="min-h-screen bg-surface px-6 pt-20 pb-12 transition-colors duration-300 text-foreground">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href={`/vehicles/${vehicleId}`}
            className="group mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Vehicle
          </Link>
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">
            Add <span className="text-muted opacity-40">Reminder</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-muted">
            Set a due date for maintenance, registration, or other tasks.
          </p>
        </header>

        <ReminderForm vehicleId={vehicleId} />
      </div>
    </main>
  );
}
