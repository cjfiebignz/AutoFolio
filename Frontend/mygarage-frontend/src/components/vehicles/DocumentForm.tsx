'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createDocument, updateDocument } from '@/lib/api';
import { FormInput, FormSection, FormSelect, FormTextArea } from '@/components/ui/FormComponents';
import { FileText, Upload, X, File, AlertCircle } from 'lucide-react';
import { usePlan } from '@/lib/plan-context';

interface DocumentFormProps {
  vehicleId: string;
  initialData?: any;
  documentId?: string;
}

export function DocumentForm({ vehicleId, initialData, documentId }: DocumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { plan } = usePlan();
  const maxMB = plan?.maxDocumentSizeMB ?? 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileSizeMB = file.size / 1024 / 1024;
      
      if (fileSizeMB > maxMB) {
        setError(`${plan?.label || 'Free'} plan supports up to ${maxMB}MB per document. Your file is ${fileSizeMB.toFixed(1)}MB.`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setError(null);
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!documentId && !selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    if (selectedFile && (selectedFile.size / 1024 / 1024) > maxMB) {
      setError(`File exceeds ${maxMB}MB limit for your current plan.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formElement = e.currentTarget;
    
    try {
      if (documentId) {
        // PATCH only supports metadata updates in this pass
        const data = {
          title: (formElement.querySelector('[name="title"]') as HTMLInputElement).value,
          category: (formElement.querySelector('[name="category"]') as HTMLSelectElement).value,
          date: (formElement.querySelector('[name="date"]') as HTMLInputElement).value,
          notes: (formElement.querySelector('[name="notes"]') as HTMLTextAreaElement).value || undefined,
        };
        await updateDocument(vehicleId, documentId, data);
      } else {
        const formData = new FormData(formElement);
        if (selectedFile) {
          formData.set('file', selectedFile);
        }
        await createDocument(vehicleId, formData);
      }

      // Small delay to ensure "Saving..." state is visible for UX consistency
      await new Promise(resolve => setTimeout(resolve, 300));

      router.push(`/vehicles/${vehicleId}?tab=documents`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
      setIsSubmitting(false);
    }
  };

  const formattedDate = initialData?.date 
    ? new Date(initialData.date).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
          {error}
        </div>
      )}

      {/* File Upload Section - Only for New Records */}
      {!documentId && (
        <FormSection title="File Attachment" icon={<Upload size={14} />}>
          <div className="space-y-4">
            {!selectedFile ? (
              <div 
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`group flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-white/5 bg-white/[0.01] py-12 text-center transition-all hover:border-white/10 hover:bg-white/[0.03] ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/20 group-hover:text-white/40 transition-colors">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-bold text-white/40">Click to upload file</p>
                <p className="mt-1 text-[10px] font-medium text-white/20 uppercase tracking-widest">PDF, JPG, PNG (Max {maxMB}MB)</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isSubmitting}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-[32px] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                    <File size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={removeFile}
                  disabled={isSubmitting}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
          {plan?.tier === 'free' && (
            <div className="mt-4 px-1">
              <p className="text-[9px] font-medium text-white/20 italic">
                Free plan includes up to {maxMB}MB per document. Upgrade to Pro to increase this limit.
              </p>
            </div>
          )}
        </FormSection>
      )}

      {/* Document Identity */}
      <FormSection title="Record Details" icon={<FileText size={14} />}>
        <div className="space-y-4">
          <FormInput 
            name="title" 
            label="Document Title" 
            placeholder="e.g. Comprehensive Insurance 2024" 
            required 
            defaultValue={initialData?.title}
            disabled={isSubmitting} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormSelect 
              name="category" 
              label="Category" 
              disabled={isSubmitting}
              options={[
                { value: 'receipt', label: 'Receipt' },
                { value: 'registration', label: 'Registration' },
                { value: 'insurance', label: 'Insurance' },
                { value: 'manual', label: 'Manual' },
                { value: 'other', label: 'Other' }
              ]} 
              defaultValue={initialData?.category || 'receipt'}
            />
            <FormInput 
              name="date" 
              label="Document Date" 
              type="date" 
              required 
              defaultValue={formattedDate}
              disabled={isSubmitting} 
            />
          </div>
        </div>
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes" icon={<FileText size={14} />}>
        <FormTextArea 
          name="notes"
          label="Reference Notes"
          rows={4}
          defaultValue={initialData?.notes}
          disabled={isSubmitting}
          placeholder="Details about the record, reference numbers, or expiration details..."
        />
      </FormSection>

      {/* Form Actions */}
      <footer className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <Link 
          href={`/vehicles/${vehicleId}?tab=documents`}
          className={`flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </Link>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : (documentId ? "Save Changes" : "Create Record")}
        </button>
      </footer>
    </form>
  );
}
