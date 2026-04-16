'use client';

import { useRef, useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceAttachment } from '@/types/autofolio';
import { uploadServiceAttachment, deleteServiceAttachment } from '@/lib/api';
import { Paperclip, Trash2, FileText, FileImage, Eye, Loader2, File, Plus, X } from 'lucide-react';
import { usePlan } from '@/lib/plan-context';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';

import { normalizeImageUrl } from '@/lib/image-utils';

interface ServiceAttachmentsDisplayProps {
  vehicleId: string;
  serviceId: string;
  attachments: ServiceAttachment[];
}

export function ServiceAttachmentsDisplay({ vehicleId, serviceId, attachments }: ServiceAttachmentsDisplayProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [localAttachments, setLocalAttachments] = useState<ServiceAttachment[]>(attachments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { plan } = usePlan();
  const maxMB = plan?.maxDocumentSizeMB ?? 5;

  const {
    isActioning: isDeleting,
    actioningId: deletingId,
    confirmId: confirmDeleteId,
    errorMessage,
    setErrorMessage,
    enterConfirm,
    cancelConfirm,
    startAction,
    failAction,
    completeAction
  } = useActionConfirm();

  // Keep local state in sync with props
  useEffect(() => {
    setLocalAttachments(attachments);
  }, [attachments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxMB) {
      setErrorMessage(`File too large. Free plan limit: ${maxMB}MB. Upgrade to Pro.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const newAttachment = await uploadServiceAttachment(vehicleId, serviceId, file);
      setLocalAttachments(prev => [...prev, newAttachment]);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (confirmDeleteId !== attachmentId) {
      enterConfirm(attachmentId);
      return;
    }

    startAction(attachmentId);
    try {
      await deleteServiceAttachment(vehicleId, serviceId, attachmentId);
      setLocalAttachments(prev => prev.filter(a => a.id !== attachmentId));
      completeAction();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete attachment');
    }
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <File size={16} />;
    if (type.includes('pdf')) return <FileText size={16} className="text-orange-400/60" />;
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) 
      return <FileImage size={16} className="text-blue-400/60" />;
    return <File size={16} className="text-white/20" />;
  };

  const truncateFilename = (name: string, maxLength: number = 24) => {
    if (!name) return 'Attachment';
    if (name.length <= maxLength) return name;
    
    const extensionIndex = name.lastIndexOf('.');
    if (extensionIndex === -1 || name.length - extensionIndex > 5) {
      return name.substring(0, maxLength - 3) + '...';
    }
    
    const extension = name.substring(extensionIndex);
    const nameWithoutExtension = name.substring(0, extensionIndex);
    const availableLength = maxLength - extension.length - 3;
    
    return nameWithoutExtension.substring(0, availableLength) + '...' + extension;
  };

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-white/30">
            <Paperclip size={10} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
            Attachments ({localAttachments.length})
          </span>
        </div>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isPending}
          className="group flex h-8 items-center justify-center gap-2 rounded-xl bg-white/5 pl-2.5 pr-3.5 text-[9px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-md bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Plus size={10} strokeWidth={3} />
            </div>
          )}
          {isUploading ? 'Uploading...' : 'Add File'}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />
      </div>

      <InlineErrorMessage 
        message={errorMessage} 
        onClear={() => setErrorMessage(null)} 
        className="mb-4"
      />

      {localAttachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-[24px] bg-white/[0.01] border border-dashed border-white/5">
           <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/10">
             <File size={20} strokeWidth={1.5} />
           </div>
           <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">No files attached</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {localAttachments.map((attachment) => {
            const isImage = attachment.fileType?.includes('image') || 
                            attachment.url.match(/\.(jpg|jpeg|png|webp)$/i);
            const isRowDeleting = deletingId === attachment.id;
            const isConfirming = confirmDeleteId === attachment.id;

            return (
              <div 
                key={attachment.id} 
                className={`group flex items-center justify-between rounded-2xl bg-white/[0.02] border border-white/5 p-2 pr-3 transition-all hover:bg-white/[0.04] hover:border-white/10 ${isRowDeleting ? 'opacity-50 grayscale' : ''} ${isConfirming ? 'border-red-500/20 bg-red-500/5' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isImage ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                      <img 
                        src={normalizeImageUrl(attachment.url)} 
                        alt={attachment.title || 'Attachment'} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/20 group-hover:text-white/40 border border-white/5 group-hover:border-white/10 transition-all">
                      {getFileIcon(attachment.fileType)}
                    </div>
                  )}
                  
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-[11px] font-bold text-white/80 truncate leading-tight mb-0.5">
                      {truncateFilename(attachment.title || 'Attachment')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded-md">
                        {attachment.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                      {attachment.fileSize && (
                        <span className="text-[8px] font-medium text-white/10">
                          {(attachment.fileSize / 1024).toFixed(0)}KB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 ml-4">
                  {!isConfirming && (
                    <a
                      href={normalizeImageUrl(attachment.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all"
                      title="View Full Resolution"
                    >
                      <Eye size={12} strokeWidth={2.5} />
                    </a>
                  )}
                  
                  {isConfirming && (
                    <button
                      type="button"
                      onClick={() => cancelConfirm()}
                      disabled={isRowDeleting}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/40 hover:text-white transition-all"
                      title="Cancel"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={isDeleting}
                    className={`flex items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
                      isConfirming 
                        ? 'bg-red-500 text-white px-3 h-8 text-[9px] font-black uppercase tracking-widest' 
                        : 'bg-red-500/5 text-red-500/30 hover:bg-red-500/10 hover:text-red-500 h-8 w-8'
                    }`}
                    title={isConfirming ? "Click to confirm deletion" : "Delete"}
                  >
                    {isRowDeleting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : isConfirming ? (
                      "Confirm"
                    ) : (
                      <Trash2 size={12} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
