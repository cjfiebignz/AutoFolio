'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VehiclePhoto } from '@/types/autofolio';
import { uploadVehiclePhoto, deleteVehiclePhoto } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date-utils';
import { Trash2, Image as ImageIcon, X, Maximize2, Loader2, Plus, Lock } from 'lucide-react';
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
import { VehicleBannerControls } from './VehicleBannerControls';
import { usePlan } from '@/lib/plan-context';
import { useVehicleLimitGate } from '@/lib/limit-gate';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';

import { normalizeImageUrl } from '@/lib/image-utils';

interface VehiclePhotosDisplayProps {
  vehicleId: string;
  photos: VehiclePhoto[];
  bannerImageUrl?: string;
  bannerCropX?: number;
  bannerCropY?: number;
  bannerZoom?: number;
}

export function VehiclePhotosDisplay({ 
  vehicleId, 
  photos = [],
  bannerImageUrl,
  bannerCropX,
  bannerCropY,
  bannerZoom
}: VehiclePhotosDisplayProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<VehiclePhoto | null>(null);
  
  const { plan } = usePlan();
  const { checkLimit } = useVehicleLimitGate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxPhotos = plan?.maxPhotos ?? 10;
  const isLimitReached = photos.length >= maxPhotos;

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLimitReached) {
      checkLimit(photos.length, maxPhotos, () => {});
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      await uploadVehiclePhoto(vehicleId, file);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      const message = err.message || '';
      if (message.toLowerCase().includes('limit') || message.toLowerCase().includes('plan')) {
        checkLimit(100, 1, () => {});
      } else {
        setErrorMessage(message || 'Failed to upload photo');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    
    if (confirmDeleteId !== photoId) {
      enterConfirm(photoId);
      return;
    }

    startAction(photoId);
    try {
      await deleteVehiclePhoto(vehicleId, photoId);
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      completeAction();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete photo');
    }
  };

  const triggerUpload = () => {
    if (isLimitReached) {
      checkLimit(photos.length, maxPhotos, () => {});
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-12">
      {/* Tab Header & Action */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Gallery</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Visual History & Showcase</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={triggerUpload}
            disabled={isUploading || isPending}
            className={`flex h-11 items-center justify-center gap-2.5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 ${
              isLimitReached 
                ? "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10" 
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : (isLimitReached ? <Lock size={14} /> : <Plus size={14} strokeWidth={3} />)}
            {isLimitReached ? "Gallery Full" : "Add Photo"}
          </button>
          {isLimitReached && plan?.tier === 'free' && (
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mr-2">
              Free plan limit reached ({maxPhotos} photos)
            </p>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      <InlineErrorMessage 
        message={errorMessage} 
        onClear={() => setErrorMessage(null)} 
      />

      {/* Banner/Header Management Section */}
      <VehicleBannerControls 
        variant="inline"
        vehicleId={vehicleId}
        bannerImageUrl={bannerImageUrl}
        bannerCropX={bannerCropX}
        bannerCropY={bannerCropY}
        bannerZoom={bannerZoom}
      />

      {/* Gallery Section Header & Blurb */}
      <section className="space-y-8">
        {/* Intro Blurb */}
        <TabIntroBlurb 
          tab="photos" 
          title="Visual Timeline" 
          description="Document your vehicle's journey, from purchase day to its current state, with a dedicated high-resolution gallery." 
        />
      </section>

      {/* Photo Grid Section */}
      <section className="space-y-8">
        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-white/5 bg-white/[0.01] py-24 text-center">
            <div className="mb-6 relative">
              <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl opacity-50" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/20">
                <ImageIcon size={32} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-lg font-bold text-white/80">No photos yet</p>
            <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/30 mb-8">
              {isLimitReached 
                ? `Free plan includes up to ${maxPhotos} photos. Upgrade to Pro to increase this limit.`
                : "Start building your vehicle's visual profile by uploading your first photo."}
            </p>
            <button 
              onClick={triggerUpload}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              {isLimitReached ? <Lock size={14} /> : <Plus size={14} strokeWidth={3} />}
              {isLimitReached ? "Unlock with Pro" : "Select Photo"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo) => {
              const isRowDeleting = deletingId === photo.id;
              const isConfirming = confirmDeleteId === photo.id;

              return (
                <div 
                  key={photo.id} 
                  onClick={() => !isRowDeleting && !isConfirming && setSelectedPhoto(photo)}
                  className={`group relative aspect-square overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] cursor-pointer ${isRowDeleting ? 'opacity-50 grayscale pointer-events-none' : ''} ${isConfirming ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  <img
                    src={normalizeImageUrl(photo.url)}
                    alt="Vehicle"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                    {!isConfirming && <Maximize2 className="text-white/80" size={24} />}
                  </div>
                  
                  <div className={`absolute right-3 top-3 z-10 flex gap-1 transition-all duration-300 ${isConfirming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isConfirming && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); cancelConfirm(); }}
                        disabled={isRowDeleting}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all shadow-xl backdrop-blur-md"
                        title="Cancel"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, photo.id)}
                      disabled={isDeleting && deletingId === photo.id}
                      className={`flex items-center justify-center rounded-xl transition-all shadow-xl backdrop-blur-md disabled:opacity-50 ${
                        isConfirming 
                          ? 'bg-red-500 text-white px-3 h-8 text-[8px] font-black uppercase tracking-widest' 
                          : 'bg-red-500/80 text-white hover:bg-red-500 h-8 w-8'
                      }`}
                      title={isConfirming ? "Confirm Deletion" : "Delete Photo"}
                    >
                      {isRowDeleting ? <Loader2 size={14} className="animate-spin" /> : isConfirming ? "Confirm" : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enlarged View Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 transition-all animate-in fade-in duration-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <button 
              type="button"
              className="absolute right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all backdrop-blur-xl border border-white/10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            
            <div 
              className="relative h-full w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={normalizeImageUrl(selectedPhoto.url)}
                alt="Enlarged Vehicle"
                className="h-full w-full object-contain rounded-2xl shadow-2xl"
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                  Captured {formatDisplayDate(selectedPhoto.createdAt)}
                </p>
                <div className="h-3 w-px bg-white/10" />
                
                {confirmDeleteId === selectedPhoto.id ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                    <button
                      type="button"
                      onClick={() => cancelConfirm()}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, selectedPhoto.id)}
                      disabled={isDeleting && deletingId === selectedPhoto.id}
                      className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-red-600 transition-all"
                    >
                      {isDeleting && deletingId === selectedPhoto.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Confirm Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, selectedPhoto.id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Stats */}
        {photos.length > 0 && (
          <div className="rounded-[32px] border border-white/5 bg-white/[0.01] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2 text-white/20">
                <span>Gallery Status</span>
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <span>{photos.length} / {maxPhotos} Photos Captured</span>
              </div>
              {isLimitReached && plan?.tier === 'free' && (
                <button 
                  onClick={() => checkLimit(100, 1, () => {})}
                  className="text-blue-400/60 hover:text-blue-400 transition-colors"
                >
                  Free plan includes up to {maxPhotos} photos. Upgrade to Pro to increase this limit.
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
