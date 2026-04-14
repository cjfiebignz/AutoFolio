'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocumentViewModel } from "@/lib/mappers/document";
import { Download, FileText, Eye, Edit3, Trash2, Plus } from 'lucide-react';
import { deleteDocument } from '@/lib/api';
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
import { ExportHistoryButton } from './ExportHistoryButton';

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTOFOLIO_API_BASE_URL || 'http://localhost:3001';

export function VehicleDocumentsDisplay({ 
  vehicleId, 
  vehicleNickname,
  documents 
}: { 
  vehicleId: string; 
  vehicleNickname: string;
  documents: DocumentViewModel[] 
}) {
  return (
    <div className="space-y-8">
      {/* Tab Header & Action */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Documents</h2>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Vehicle Logbook & Records</p>
            <div className="h-1 w-1 rounded-full bg-white/10" />
            <ExportHistoryButton vehicleId={vehicleId} vehicleNickname={vehicleNickname} variant="minimal" type="documents" />
          </div>
        </div>
        <Link 
          href={`/vehicles/${vehicleId}/documents/new`}
          className="flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl"
        >
          <Plus size={14} strokeWidth={3} />
          Add Record
        </Link>
      </div>

      {/* Intro Blurb */}
      <TabIntroBlurb 
        tab="docs" 
        title="Digital Filing Cabinet" 
        description="Securely store and manage physical receipts, registration papers, and insurance certificates in one place." 
      />

      {/* Main Document Content */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <EmptyDocumentState vehicleId={vehicleId} />
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} vehicleId={vehicleId} />
            ))}
          </div>
        )}
      </div>


      {/* Library Status */}
      {documents.length > 0 && (
        <div className="rounded-[32px] border border-white/5 bg-white/[0.01] p-6">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
            <span>Library Status</span>
            <span>{documents.length} Records Tracked</span>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[2%] bg-white/20 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentCard({ doc, vehicleId }: { doc: DocumentViewModel & { fileUrl?: string }, vehicleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const hasFile = !!doc.fileUrl;
  const fullUrl = doc.fileUrl ? `${API_BASE_URL}${doc.fileUrl}` : null;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document? This will also permanently remove the uploaded file from storage and cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDocument(vehicleId, doc.id);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
      setIsDeleting(false);
    }
  };

  return (
    <div className={`group flex items-center gap-4 rounded-[32px] border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      {/* File Type Icon */}
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
        hasFile ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'
      }`}>
        {hasFile ? (
          <FileText size={20} strokeWidth={2} />
        ) : (
          <span className="text-[10px] font-black uppercase">Meta</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white truncate">{doc.title}</h3>
          <span className="shrink-0 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white/40">
            {doc.category}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{doc.date}</p>
          {doc.fileSize && (
            <>
              <span className="h-1 w-1 rounded-full bg-white/10" />
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{doc.fileSize}</p>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link 
          href={`/vehicles/${vehicleId}/documents/${doc.id}/edit`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          title="Edit Details"
        >
          <Edit3 size={16} strokeWidth={2.5} />
        </Link>
        {hasFile && fullUrl ? (
          <>
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
              title="View Original"
            >
              <Eye size={16} strokeWidth={2.5} />
            </a>
            <a 
              href={fullUrl} 
              download 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black hover:bg-white/90 transition-all"
              title="Download File"
            >
              <Download size={16} strokeWidth={2.5} />
            </a>
          </>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.02] text-white/5 cursor-not-allowed" title="Metadata Only Record">
            <Download size={16} strokeWidth={2.5} />
          </div>
        )}
        <button 
          type="button"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 transition-all disabled:opacity-50"
          title="Delete Record"
        >
          <Trash2 size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function EmptyDocumentState({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[40px] border border-white/5 bg-white/[0.01] py-24 text-center">
      <div className="mb-6 relative">
        <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl opacity-50" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/20">
          <FileText size={32} strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-lg font-bold text-white/80">No records found</p>
      <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/30 mb-8">
        Start building your vehicle's history by registering your first physical or digital record.
      </p>
      <Link 
        href={`/vehicles/${vehicleId}/documents/new`}
        className="flex h-12 items-center justify-center rounded-2xl bg-white px-8 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98]"
      >
        Add First Record
      </Link>
    </div>
  );
}
