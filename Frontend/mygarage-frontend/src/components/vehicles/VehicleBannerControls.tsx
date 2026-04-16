'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2, Loader2, Move, Layout, X } from 'lucide-react';
import { uploadVehicleBanner, deleteVehicleBanner, updateVehicleBannerMetadata } from '@/lib/api';
import { BannerCropEditor } from './BannerCropEditor';
import { normalizeImageUrl } from '@/lib/image-utils';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';

interface VehicleBannerControlsProps {
  vehicleId: string;
  bannerImageUrl?: string;
  bannerCropX?: number;
  bannerCropY?: number;
  bannerZoom?: number;
  variant?: 'overlay' | 'inline';
}

export function VehicleBannerControls({ 
  vehicleId, 
  bannerImageUrl,
  bannerCropX = 50,
  bannerCropY = 50,
  bannerZoom = 1,
  variant = 'overlay'
}: VehicleBannerControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBannerAction, setIsBannerAction] = useState(false);
  
  const {
    isActioning: isDeleting,
    confirmState: confirmDelete,
    errorMessage,
    setErrorMessage,
    enterConfirm,
    cancelConfirm,
    startAction,
    failAction,
    completeAction
  } = useActionConfirm();

  // Crop Editor State
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingFile(file);
      setEditingImageUrl(event.target?.result as string);
      setIsCropEditorOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEditCrop = () => {
    if (bannerImageUrl) {
      setEditingFile(null);
      setEditingImageUrl(normalizeImageUrl(bannerImageUrl));
      setIsCropEditorOpen(true);
    }
  };

  const handleSaveCrop = async (metadata: { bannerCropX: number; bannerCropY: number; bannerZoom: number }) => {
    setIsBannerAction(true);
    setErrorMessage(null);
    try {
      if (editingFile) {
        await uploadVehicleBanner(vehicleId, editingFile, metadata);
      } else {
        await updateVehicleBannerMetadata(vehicleId, metadata);
      }
      setIsCropEditorOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save header composition');
    } finally {
      setIsBannerAction(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleBannerDelete = async () => {
    if (!confirmDelete) {
      enterConfirm();
      return;
    }

    startAction();
    try {
      await deleteVehicleBanner(vehicleId);
      completeAction();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete banner');
    }
  };

  const controls = (
    <div className="flex gap-2">
      {!confirmDelete && (
        <>
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={isBannerAction || isPending || isDeleting}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
              variant === 'overlay' 
                ? 'bg-white px-4 text-black shadow-2xl hover:bg-white/90' 
                : 'bg-white/10 border border-white/10 px-6 text-white hover:bg-white/20'
            }`}
          >
            {isBannerAction ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {bannerImageUrl ? 'Change' : 'Upload'}
          </button>
          {bannerImageUrl && (
            <button
              type="button"
              onClick={handleEditCrop}
              disabled={isBannerAction || isPending || isDeleting}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
                variant === 'overlay'
                  ? 'bg-white/10 backdrop-blur-xl border-white/10 text-white hover:bg-white/20'
                  : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Move size={14} />
              Position
            </button>
          )}
        </>
      )}

      {bannerImageUrl && (
        <div className="flex gap-1.5">
          {confirmDelete && (
            <button
              type="button"
              onClick={() => cancelConfirm()}
              disabled={isBannerAction || isPending || isDeleting}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/40 hover:text-white transition-all border border-white/10"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleBannerDelete}
            disabled={isBannerAction || isPending || isDeleting}
            className={`flex items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
              confirmDelete 
                ? 'bg-red-500 text-white px-4 h-10 text-[9px] font-black uppercase tracking-widest' 
                : variant === 'overlay'
                  ? 'bg-black/60 text-white/60 border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 h-10 w-10'
                  : 'bg-red-500/10 text-red-500/40 border-red-500/10 hover:bg-red-500/20 hover:text-red-500 h-10 w-10'
            }`}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : confirmDelete ? 'Confirm Remove' : <Trash2 size={16} />}
          </button>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Layout size={14} className="text-blue-400/60" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Profile Header Settings</h3>
        </div>
        
        <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-bold text-white/80">Vehicle Banner Composition</p>
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">
                {bannerImageUrl ? 'Custom header active • 16:7 Aspect Ratio' : 'No custom header active'}
              </p>
            </div>
            {controls}
          </div>

          <InlineErrorMessage 
            message={errorMessage} 
            onClear={() => setErrorMessage(null)} 
            className="mt-6"
          />

          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerUpload}
            accept="image/*"
            className="hidden"
          />

          {isCropEditorOpen && editingImageUrl && (
            <BannerCropEditor 
              imageUrl={editingImageUrl}
              initialCropX={bannerCropX}
              initialCropY={bannerCropY}
              initialZoom={bannerZoom}
              onSave={handleSaveCrop}
              onCancel={() => setIsCropEditorOpen(false)}
            />
          )}

          {(isBannerAction || isPending || isDeleting) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <Loader2 className="animate-spin text-white" size={24} />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-100 sm:opacity-0 backdrop-blur-[2px] transition-all sm:group-hover:opacity-100">
        {controls}
        
        <InlineErrorMessage 
          message={errorMessage} 
          onClear={() => setErrorMessage(null)} 
          className="mt-4 px-4 w-full max-w-xs"
        />
      </div>

      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerUpload}
        accept="image/*"
        className="hidden"
      />

      {isCropEditorOpen && editingImageUrl && (
        <BannerCropEditor 
          imageUrl={editingImageUrl}
          initialCropX={bannerCropX}
          initialCropY={bannerCropY}
          initialZoom={bannerZoom}
          onSave={handleSaveCrop}
          onCancel={() => setIsCropEditorOpen(false)}
        />
      )}

      {(isBannerAction || isPending || isDeleting) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="animate-spin text-white" size={24} />
        </div>
      )}
    </>
  );
}
