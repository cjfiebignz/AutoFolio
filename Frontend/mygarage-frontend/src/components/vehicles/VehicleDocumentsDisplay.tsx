'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocumentViewModel } from "@/lib/mappers/document";
import { 
  Download, FileText, Trash2, Plus, Eye, 
  ExternalLink, File, FileImage, ShieldCheck,
  CheckCircle2, AlertCircle, X, Search,
  Square, CheckSquare, Loader2, Archive
} from 'lucide-react';
import { deleteDocument, exportDocumentsZip } from '@/lib/api';
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
import { formatDisplayDate } from '@/lib/date-utils';
import { normalizeImageUrl } from '@/lib/image-utils';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';

export function VehicleDocumentsDisplay({ 
  vehicleId, 
  vehicleNickname,
  documents = []
}: { 
  vehicleId: string;
  vehicleNickname: string;
  documents?: DocumentViewModel[] 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const { errorMessage, setErrorMessage } = useActionConfirm();

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0 || isExporting) return;
    
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const blob = await exportDocumentsZip(vehicleId, Array.from(selectedIds));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeNickname = vehicleNickname.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.setAttribute('download', `autofolio-${safeNickname}-selected-docs.zip`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      clearSelection();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export documents');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header & Actions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Vault</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Encrypted Document Storage</p>
          </div>
          <Link 
            href={`/vehicles/${vehicleId}/documents/new`}
            className="flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl"
          >
            <Plus size={14} strokeWidth={3} />
            Upload File
          </Link>
        </div>

        {/* Contextual Selection Row */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1 animate-in fade-in slide-in-from-top-2 duration-500">
            <button
              onClick={clearSelection}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 active:scale-95"
            >
              Clear ({selectedIds.size})
            </button>
            <button
              onClick={handleDownloadSelected}
              disabled={isExporting}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 text-[10px] font-black uppercase tracking-widest text-blue-400 transition-all hover:bg-blue-500/10 active:scale-95 shadow-lg shadow-blue-500/5 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
              Download Selected ZIP
            </button>
          </div>
        )}

        <InlineErrorMessage 
          message={errorMessage} 
          onClear={() => setErrorMessage(null)} 
          className="px-1"
        />
      </div>

      <TabIntroBlurb 
        tab="documents" 
        title="Digital Portfolio" 
        description="Store service invoices, registration certificates, insurance policies, and technical manuals safely in one place." 
      />

      {/* Document List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <EmptyDocumentState vehicleId={vehicleId} />
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => (
              <DocumentCard 
                key={doc.id} 
                doc={doc} 
                vehicleId={vehicleId} 
                isSelected={selectedIds.has(doc.id)}
                onToggle={() => toggleSelection(doc.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ 
  doc, 
  vehicleId,
  isSelected,
  onToggle
}: { 
  doc: DocumentViewModel, 
  vehicleId: string,
  isSelected: boolean,
  onToggle: () => void
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { 
    isActioning: isDeleting, 
    confirmState: confirmDelete, 
    errorMessage, 
    enterConfirm, 
    cancelConfirm,
    startAction,
    failAction,
    setErrorMessage
  } = useActionConfirm();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      enterConfirm();
      return;
    }

    startAction();
    try {
      await deleteDocument(vehicleId, doc.id);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete');
    }
  };

  const isImage = doc.fileType?.includes('image') || doc.fileUrl?.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div 
      onClick={onToggle}
      className={`group relative overflow-hidden rounded-[28px] border transition-all duration-500 cursor-pointer ${
        isSelected 
          ? 'border-blue-500/30 bg-blue-500/[0.03] shadow-lg ring-1 ring-blue-500/20' 
          : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10'
      } ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-4 p-4 sm:p-5">
          {/* Selection Affordance */}
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
            isSelected 
              ? 'bg-blue-500 border-blue-400 text-white' 
              : 'border-white/10 bg-white/5 text-transparent group-hover:border-white/20'
          }`}>
            <CheckCircle2 size={14} strokeWidth={3} />
          </div>

          {/* Icon / Preview */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500 ${
            isSelected 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
          }`}>
            {isImage ? <FileImage size={20} strokeWidth={1.5} /> : <FileText size={20} strokeWidth={1.5} />}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20">{doc.category}</p>
            <h3 className="text-sm font-bold text-white uppercase italic tracking-tight truncate">{doc.title}</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{doc.date}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={e => e.stopPropagation()}>
            {doc.fileUrl && (
              <>
                <a 
                  href={normalizeImageUrl(doc.fileUrl)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                  title="View Document"
                >
                  <Eye size={14} />
                </a>
                <a 
                  href={normalizeImageUrl(doc.fileUrl)} 
                  download
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                  title="Download Original"
                >
                  <Download size={14} />
                </a>
              </>
            )}
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
              className={`flex h-9 items-center justify-center rounded-xl transition-all border ${
                confirmDelete 
                  ? 'bg-red-500 border-red-400 text-white px-3 text-[8px] font-black uppercase tracking-widest' 
                  : 'bg-red-500/5 border-red-500/10 text-red-500/40 hover:bg-red-500/10 hover:text-red-500 w-9'
              }`}
              title={confirmDelete ? 'Click to confirm' : 'Delete Document'}
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : confirmDelete ? 'Confirm' : <Trash2 size={14} />}
            </button>
            {confirmDelete && (
              <button 
                onClick={() => cancelConfirm()}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        
        <InlineErrorMessage 
          message={errorMessage} 
          onClear={() => setErrorMessage(null)} 
          className="px-4 pb-4"
        />
      </div>
    </div>
  );
}

function EmptyDocumentState({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="group relative flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-32 text-center transition-all hover:bg-white/[0.02]">
      <div className="mb-8 relative">
        <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/10 group-hover:text-white/30 transition-colors shadow-2xl">
          <FileText size={40} strokeWidth={1} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white/60 uppercase italic tracking-tight">Vault is empty</h3>
      <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/20 mb-10">
        Securely store your vehicle's essential paperwork and technical documentation.
      </p>
      <Link 
        href={`/vehicles/${vehicleId}/documents/new`}
        className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-2xl"
      >
        Add First Record
      </Link>
    </div>
  );
}
