'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, X, File, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument, updateDocument } from '@/lib/api';
import { usePlan } from '@/lib/plan-context';

interface DocumentFormProps {
  vehicleId: string;
  isOpen?: boolean;
  onClose?: () => void;
  initialData?: any;
  documentId?: string;
}

export function DocumentForm({ vehicleId, isOpen, onClose, initialData, documentId }: DocumentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'receipt');
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { plan } = usePlan();
  const maxMB = plan?.maxDocumentSizeMB ?? 5;

  const isEdit = !!initialData || !!documentId;

  // Sync state with initialData
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(initialData.category || 'receipt');
    }
  }, [initialData]);

  // Cleanup on close (if used as modal)
  useEffect(() => {
    if (isOpen === false) {
      if (!isEdit) {
        setTitle('');
        setCategory('receipt');
        setFile(null);
      }
      setError(null);
    }
  }, [isOpen, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && (!file || !title)) return;
    if (isEdit && !title) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && documentId) {
        await updateDocument(vehicleId, documentId, {
          title,
          category
        });
      } else if (file) {
        await uploadDocument(vehicleId, file, title, category);
      }
      
      startTransition(() => {
        router.refresh();
        if (onClose) {
          onClose();
        } else {
          router.push(`/vehicles/${vehicleId}?tab=documents`);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save document');
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileSizeMB = selectedFile.size / 1024 / 1024;
    if (fileSizeMB > maxMB) {
      setError(`File too large. Current plan limit: ${maxMB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
    setError(null);
    if (!title) setTitle(selectedFile.name.split('.')[0]);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={`${isOpen === undefined ? '' : 'p-6 sm:p-8'} space-y-8`}>
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* File Selection - Only for NEW documents */}
      {!isEdit && (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">1. Archive Source</label>
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border-subtle bg-card-overlay py-12 text-center transition-all hover:border-border-strong hover:bg-card-overlay-hover ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-border-subtle text-dim group-hover:text-muted transition-colors shadow-sm">
                <Upload size={24} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-muted">Click to upload file</p>
              <p className="mt-1 text-[10px] font-medium text-dim uppercase tracking-widest">PDF, JPG, PNG (Max {maxMB}MB)</p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-[32px] border border-border-strong bg-card-overlay p-6 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-border-subtle text-accent">
                  <File size={24} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] font-medium text-muted uppercase tracking-widest">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border-subtle text-muted hover:bg-card-overlay-hover hover:text-red-500 transition-all disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          <p className="text-[9px] font-medium text-dim italic px-1">
            Documents are processed and stored securely within the technical vault.
          </p>
        </div>
      )}

      {/* Title & Metadata */}
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">{isEdit ? 'Document Details' : '2. Document Details'}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reference Title (e.g. 100k Service Invoice)"
            required
            className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-[10px] font-black uppercase tracking-widest text-foreground focus:border-accent outline-none transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="receipt">Service Record / Receipt</option>
              <option value="registration">Registration</option>
              <option value="insurance">Insurance</option>
              <option value="manual">Technical Manual</option>
              <option value="other">Other Reference</option>
            </select>
          </div>
        </div>
      </div>

      <footer className={`grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle`}>
        <button
          type="button"
          onClick={() => onClose ? onClose() : router.back()}
          className={`flex h-14 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-sm font-bold text-muted transition-all hover:bg-card-overlay-hover active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (!isEdit && (!file || !title)) || (isEdit && !title)}
          className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            isEdit ? "Update Record" : "Encrypt & Save"
          )}
        </button>
      </footer>
    </form>
  );

  if (isOpen !== undefined) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 transition-all animate-in fade-in duration-300">
        <div className="relative w-full max-w-xl overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-premium transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-overlay text-muted border border-border-subtle">
                <FileText size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">{isEdit ? 'Edit Document' : 'Protect Document'}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">Encrypted Vault Entry</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all"
              >
                <X size={24} />
              </button>
            )}
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
}
