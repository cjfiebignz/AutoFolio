'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2, Loader2, Move, Layout } from 'lucide-react';
import { uploadVehicleBanner, deleteVehicleBanner, updateVehicleBannerMetadata } from '@/lib/api';
import { BannerCropEditor } from './BannerCropEditor';
import { normalizeImageUrl } from '@/lib/image-utils';

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
      alert(err.message || 'Failed to save header composition');
    } finally {
      setIsBannerAction(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleBannerDelete = async () => {
    if (!window.confirm('Remove vehicle banner?')) return;

    setIsBannerAction(true);
    try {
      await deleteVehicleBanner(vehicleId);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    } finally {
      setIsBannerAction(false);
    }
  };

  const controls = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => bannerInputRef.current?.click()}
        disabled={isBannerAction || isPending}
        className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
          variant === 'overlay' 
            ? 'bg-white px-4 text-black shadow-2xl hover:bg-white/90' 
            : 'bg-white/10 border border-white/10 px-6 text-white hover:bg-white/20'
        }`}
      >
        {isBannerAction ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        {bannerImageUrl ? 'Change Header' : 'Upload Header'}
      </button>
      {bannerImageUrl && (
        <>
          <button
            type="button"
            onClick={handleEditCrop}
            disabled={isBannerAction || isPending}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
              variant === 'overlay'
                ? 'bg-white/10 backdrop-blur-xl border-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Move size={14} />
            Position
          </button>
          <button
            type="button"
            onClick={handleBannerDelete}
            disabled={isBannerAction || isPending}
            className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-xl border transition-all active:scale-95 disabled:opacity-50 ${
              variant === 'overlay'
                ? 'bg-black/60 text-white/60 border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20'
                : 'bg-red-500/10 text-red-500/40 border-red-500/10 hover:bg-red-500/20 hover:text-red-500'
            }`}
          >
            <Trash2 size={16} />
          </button>
        </>
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

          {(isBannerAction || isPending) && (
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
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 sm:opacity-0 backdrop-blur-[2px] transition-all sm:group-hover:opacity-100">
        {controls}
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

      {(isBannerAction || isPending) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="animate-spin text-white" size={24} />
        </div>
      )}
    </>
  );
}
