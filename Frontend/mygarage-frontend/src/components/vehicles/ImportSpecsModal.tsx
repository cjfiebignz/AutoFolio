'use client';

import React, { useState, useRef, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Loader2, 
  Download,
  ChevronRight
} from 'lucide-react';
import { previewSpecImport, commitSpecImport, getSpecTemplateUrl, getSpecExampleUrl } from '@/lib/api';
import { ImportPreviewResponse, ImportPreviewRow, ImportCommitResponse } from '@/types/autofolio';
import { useRouter } from 'next/navigation';

interface ImportSpecsModalProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function ImportSpecsModal({ vehicleId, isOpen, onClose }: ImportSpecsModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isCommiting, setIsCommiting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commitErrorRef = useRef<HTMLDivElement>(null);

  // Derived state for importable rows
  const importableCount = previewData 
    ? Math.max(0, previewData.validCount - previewData.duplicates.length) 
    : 0;

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setPreviewData(null);
      setCommitResult(null);
      setError(null);
      setCommitError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("Please select a valid CSV file.");
      return;
    }

    setError(null);
    setCommitError(null);
    setIsUploading(true);
    try {
      const data = await previewSpecImport(vehicleId, file);
      setPreviewData(data);
      setStep('preview');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Internal server error')) {
        setError("Import failed. The server could not process this CSV. Please check the file format.");
      } else {
        setError(msg || "Failed to preview CSV import. Ensure you are using the correct template.");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommit = async () => {
    if (!previewData || importableCount === 0 || isCommiting) return;

    setIsCommiting(true);
    setCommitError(null);
    try {
      const result = await commitSpecImport(
        vehicleId, 
        previewData.validRows.map(r => r.parsedData),
        previewData.fileName
      );
      setCommitResult(result);
      setStep('result');
      
      // Auto-close and refresh after 4 seconds
      setTimeout(() => {
        startTransition(() => {
          router.refresh();
          onClose();
        });
      }, 4000);
    } catch (err: any) {
      const msg = err.message || '';
      const finalError = msg.includes('Internal server error')
        ? "Commit failed. The server encountered an error while saving your specs."
        : (msg || "Failed to commit import. Some technical data may be invalid.");
      
      setCommitError(finalError);
      setIsCommiting(false);

      // Auto-scroll to error
      setTimeout(() => {
        commitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-2xl transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Upload size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tight text-foreground uppercase">Import Specs</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-40 mt-1">Bulk Technical Reference</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-muted opacity-40 hover:bg-foreground/10 hover:text-foreground transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar text-foreground">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed p-16 text-center transition-all cursor-pointer ${
                  isUploading ? 'border-blue-500/20 bg-blue-500/5' : 'border-border-subtle bg-foreground/[0.01] hover:bg-foreground/[0.02] hover:border-border-strong'
                }`}
              >
                <div className="mb-6 relative">
                  <div className="absolute -inset-4 rounded-full bg-blue-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`relative flex h-20 w-20 items-center justify-center rounded-3xl border transition-colors ${
                    isUploading ? 'border-blue-500/20 bg-blue-500/10 text-blue-500' : 'border-border-strong bg-foreground/5 text-muted opacity-20 group-hover:opacity-60'
                  }`}>
                    {isUploading ? <Loader2 size={32} className="animate-spin" /> : <FileText size={32} strokeWidth={1.5} />}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-foreground opacity-80">{isUploading ? "Analysing CSV..." : "Select CSV File"}</h4>
                <p className="mx-auto mt-2 max-w-[280px] text-xs font-medium leading-relaxed text-muted opacity-40">
                  One spec per row. Use category, label, value, unit, notes. 
                  <br />Download template for correct format.
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".csv" 
                  className="hidden" 
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DownloadCard 
                  title="Blank Template" 
                  description="Pre-formatted CSV headers" 
                  href={getSpecTemplateUrl()} 
                />
                <DownloadCard 
                  title="Example CSV" 
                  description="See example technical data" 
                  href={getSpecExampleUrl()} 
                />
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-10 animate-in fade-in duration-300">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="Total" value={previewData.totalRows} />
                <StatBox label="Valid" value={previewData.validCount} highlight="green" />
                <StatBox label="Invalid" value={previewData.invalidCount} highlight="red" />
              </div>

              {/* Warnings/Duplicates Alert */}
              {previewData.duplicates.length > 0 && (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-500/80 shrink-0" size={18} />
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 leading-relaxed">
                    {previewData.duplicates.length} duplicate specs detected. These will be skipped during import to prevent duplicates.
                  </p>
                </div>
              )}

              {/* Lists */}
              <div className="space-y-8">
                {previewData.invalidRows.length > 0 && (
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 px-1">Invalid Rows (Fix Required)</h4>
                    <div className="grid gap-3">
                      {previewData.invalidRows.map((row, idx) => (
                        <PreviewRow key={idx} row={row} type="error" />
                      ))}
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60 px-1">Ready to Import</h4>
                  {previewData.validRows.length === 0 ? (
                    <div className="rounded-3xl border border-border-subtle bg-foreground/[0.01] p-8 text-center italic text-muted opacity-40 text-xs">
                      No valid rows found to import.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {previewData.validRows.map((row, idx) => (
                        <PreviewRow key={idx} row={row} type={row.isDuplicate ? 'warning' : 'valid'} />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="pt-6 border-t border-border-subtle sticky bottom-0 bg-surface pb-2 space-y-4">
                {commitError && (
                  <div ref={commitErrorRef} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed">{commitError}</p>
                  </div>
                )}

                <button
                  onClick={handleCommit}
                  disabled={isCommiting || importableCount === 0}
                  className="w-full h-14 rounded-2xl bg-foreground text-[11px] font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50"
                >
                  {isCommiting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Importing Specs...
                    </>
                  ) : (
                    <>
                      Import {importableCount} New Specs
                      <ChevronRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && commitResult && (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
              <div className="mb-8 relative">
                <div className="absolute -inset-8 rounded-full bg-green-500/10 blur-3xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 size={48} strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-3xl font-black italic tracking-tighter text-foreground uppercase mb-2">Import Complete</h3>
              <p className="text-sm font-medium text-muted opacity-60 max-w-xs mb-10">
                Technical records have been successfully added to your spec library.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
                <ResultPill label="Imported" count={commitResult.importedCount} color="green" />
                <ResultPill label="Skipped" count={commitResult.skippedCount} color="yellow" />
                <ResultPill label="Failed" count={commitResult.failedCount} color="red" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function DownloadCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a 
      href={href} 
      download
      className="group flex items-center justify-between rounded-3xl border border-border-subtle bg-foreground/[0.01] p-5 transition-all hover:bg-card-overlay-hover hover:border-border-strong active:scale-[0.98]"
    >
      <div className="space-y-1">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted opacity-80 group-hover:text-foreground transition-colors">{title}</h5>
        <p className="text-[9px] font-bold text-dim group-hover:text-muted transition-colors uppercase tracking-tighter">{description}</p>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted opacity-40 group-hover:bg-foreground/10 group-hover:text-foreground transition-all">
        <Download size={14} />
      </div>
    </a>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: number; highlight?: 'green' | 'red' }) {
  const colors = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    default: 'text-foreground opacity-80'
  };
  return (
    <div className="rounded-2xl border border-border-subtle bg-foreground/[0.01] p-4 text-center">
      <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40 mb-1">{label}</p>
      <p className={`text-xl font-black italic tracking-tighter ${highlight ? colors[highlight] : colors.default}`}>
        {value}
      </p>
    </div>
  );
}

function PreviewRow({ row, type }: { row: ImportPreviewRow; type: 'error' | 'warning' | 'valid' }) {
  const styles = {
    error: 'border-red-500/20 bg-red-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    valid: 'border-border-subtle bg-foreground/[0.01]'
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-600 dark:text-yellow-500',
    valid: 'text-green-600 dark:text-green-400/40'
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${styles[type]}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-foreground/5 ${iconColors[type]}`}>
            {type === 'error' ? <AlertCircle size={14} /> : type === 'warning' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Row {row.rowNumber}</span>
              <span className="h-1 w-1 rounded-full bg-border-subtle" />
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400/60">{row.parsedData.category}</span>
              {row.isDuplicate && (
                <>
                  <span className="h-1 w-1 rounded-full bg-border-subtle" />
                  <span className="text-[7px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-600 dark:text-yellow-500/60 px-1.5 py-0.5 rounded-md border border-yellow-500/10">Duplicate</span>
                </>
              )}
            </div>
            <h5 className="text-xs font-black text-foreground opacity-90 uppercase truncate">{row.parsedData.label}</h5>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-black text-foreground uppercase italic tracking-tighter">
            {row.parsedData.value} <span className="text-[9px] not-italic text-muted opacity-40 ml-0.5 uppercase">{row.parsedData.unit || ''}</span>
          </p>
        </div>
      </div>
      {(row.errors.length > 0 || row.warnings.length > 0) && (
        <div className="pt-3 border-t border-border-subtle space-y-1">
          {row.errors.map((e, idx) => (
            <div key={idx} className="text-[9px] font-bold text-red-600 dark:text-red-400/80 leading-tight flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-red-500" /> {e}
            </div>
          ))}
          {row.warnings.map((w, idx) => (
            <div key={idx} className="text-[9px] font-bold text-yellow-700 dark:text-yellow-400/80 leading-tight flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-yellow-500" /> {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultPill({ label, count, color }: { label: string; count: number; color: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 flex flex-col items-center justify-center ${colors[color]}`}>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</span>
      <span className="text-lg font-black italic tracking-tighter">{count}</span>
    </div>
  );
}
