'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2, Loader2, Move, Layout, X } from 'lucide-react';
import { uploadVehicleBanner, deleteVehicleBanner, updateVehicleBannerMetadata } from '@/lib/api';
import { BannerCropEditor } from './BannerCropEditor';
import { normalizeImageUrl } from '@/lib/image-utils';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';
import { useHeroContrast } from './VehicleBanner';
import React from 'react';

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
  const heroContrast = useHeroContrast();
  
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

  const isDarkHero = heroContrast === 'dark';

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
                ? (isDarkHero ? 'bg-foreground text-background shadow-2xl hover:opacity-90' : 'bg-white px-4 text-black shadow-2xl hover:bg-white/90') 
                : 'bg-foreground text-background px-6 hover:opacity-90'
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
                  ? (isDarkHero ? 'bg-foreground/[0.03] backdrop-blur-xl border-border-subtle text-foreground hover:bg-foreground/10' : 'bg-white/10 backdrop-blur-xl border-white/10 text-white hover:bg-white/20')
                  : 'bg-card-overlay border-border-subtle text-muted hover:bg-card-overlay-hover hover:text-foreground hover:border-border-strong'
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
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all border ${
                variant === 'overlay'
                  ? (isDarkHero ? 'bg-foreground/5 text-muted hover:text-foreground border-border-subtle' : 'bg-white/10 text-white/60 hover:text-white border-white/10')
                  : 'bg-card-overlay text-muted hover:text-foreground border-border-subtle hover:border-border-strong'
              }`}
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
                  ? (isDarkHero ? 'bg-foreground/5 text-red-500/60 border-border-subtle hover:bg-red-500/10 hover:text-red-500 h-10 w-10' : 'bg-black/60 text-white/60 border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 h-10 w-10')
                  : 'bg-red-500/10 text-red-500/40 border-border-subtle hover:bg-red-500/20 hover:text-red-500 h-10 w-10'
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
          <Layout size={14} className="text-muted opacity-40" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-40">Profile Header Settings</h3>
        </div>
        
        <div className="relative overflow-hidden rounded-[32px] border border-border-subtle bg-card-overlay p-8 transition-all hover:bg-card-overlay-hover">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-bold text-foreground opacity-80">Vehicle Banner Composition</p>
              <p className="text-[10px] font-medium text-muted opacity-40 uppercase tracking-widest">
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
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-sm transition-colors duration-500">
              <Loader2 className="animate-spin text-foreground opacity-40" size={24} />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${isDarkHero ? 'bg-surface/40 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-[2px]'} opacity-100 sm:opacity-0 sm:group-hover:opacity-100`}>
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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
          <Loader2 className="animate-spin text-foreground opacity-40" size={24} />
        </div>
      )}
    </>
  );
}
