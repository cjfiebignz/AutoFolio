'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getWorkJob } from '@/lib/api';
import { WorkForm } from '@/components/vehicles/work/WorkForm';
import { ArrowLeft } from 'lucide-react';

export default function EditWorkJobPage({ params }: { params: Promise<{ id: string, workJobId: string }> }) {
  const { id, workJobId } = use(params);
  const [workJob, setWorkJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getWorkJob(id, workJobId);
        setWorkJob(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load work job');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, workJobId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface transition-colors duration-300">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" />
      </div>
    );
  }

  if (error || !workJob) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center text-foreground transition-colors duration-300">
        <p className="text-muted mb-4 text-sm font-bold uppercase tracking-widest">{error || 'Job not found'}</p>
        <Link href={`/vehicles/${id}?tab=work`} className="text-foreground text-xs font-black uppercase tracking-widest underline underline-offset-4 decoration-border-subtle hover:decoration-foreground transition-all">
          Back to Work Log
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-6 pt-20 pb-12 transition-colors duration-300 text-foreground">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href={`/vehicles/${id}?tab=work`}
            className="group mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Cancel
          </Link>
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">
            Edit <span className="text-muted opacity-40">Job</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-muted">
            Update your planned task or record completed work.
          </p>
        </header>

        <WorkForm 
          vehicleId={id} 
          initialData={workJob} 
          workJobId={workJobId} 
        />
      </div>
    </main>
  );
}
