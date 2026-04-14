'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getDocument } from '@/lib/api';
import { DocumentForm } from '@/components/vehicles/DocumentForm';
import { ArrowLeft } from 'lucide-react';

export default function EditDocumentPage({ params }: { params: Promise<{ id: string, documentId: string }> }) {
  const { id, documentId } = use(params);
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDocument(id, documentId);
        setDocument(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, documentId]);


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-white/40 mb-4 text-sm font-bold uppercase tracking-widest">{error || 'Document not found'}</p>
        <Link href={`/vehicles/${id}?tab=documents`} className="text-white text-xs font-black uppercase tracking-widest underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-20 pb-12">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href={`/vehicles/${id}?tab=documents`}
            className="group mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Cancel
          </Link>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase italic">
            Edit <span className="text-white/40">Record</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-white/40">
            Update record metadata and notes.
          </p>
        </header>

        <DocumentForm 
          vehicleId={id} 
          initialData={document} 
          documentId={documentId} 
        />
      </div>
    </main>
  );
}
