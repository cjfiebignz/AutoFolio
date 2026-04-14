'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Move, Loader2 } from 'lucide-react';
import { normalizeCrop, denormalizeCrop, clampCrop, getCropTransform } from '@/lib/cropUtils';

interface BannerCropEditorProps {
  imageUrl: string;
  initialCropX?: number;
  initialCropY?: number;
  initialZoom?: number;
  onSave: (metadata: { bannerCropX: number; bannerCropY: number; bannerZoom: number }) => Promise<void>;
  onCancel: () => void;
}

export function BannerCropEditor({ 
  imageUrl, 
  initialCropX = 50, 
  initialCropY = 50, 
  initialZoom = 1,
  onSave,
  onCancel
}: BannerCropEditorProps) {
  // Use normalized coordinates (0 to 1)
  const [cropX, setCropX] = useState(normalizeCrop(initialCropX));
  const [cropY, setCropY] = useState(normalizeCrop(initialCropY));
  const [zoom, setZoom] = useState(initialZoom);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startCrop = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    startPos.current = { x: clientX, y: clientY };
    startCrop.current = { x: cropX, y: cropY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      // Prevent scrolling while dragging
      if (e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      
      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Compute normalized delta based on real container dimensions
      const deltaX = dx / width;
      const deltaY = dy / height;
      
      // Movement is relative to current zoom level
      setCropX(clampCrop(startCrop.current.x - (deltaX / zoom), zoom));
      setCropY(clampCrop(startCrop.current.y - (deltaY / zoom), zoom));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, zoom]);

  // Re-clamp on zoom change
  useEffect(() => {
    setCropX(prev => clampCrop(prev, zoom));
    setCropY(prev => clampCrop(prev, zoom));
  }, [zoom]);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onSave({ 
        bannerCropX: denormalizeCrop(cropX), 
        bannerCropY: denormalizeCrop(cropY), 
        bannerZoom: parseFloat(zoom.toFixed(2)) 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-10 animate-in fade-in duration-300 backdrop-blur-md">
      <div className="w-full max-w-4xl space-y-8">
        <header className="flex items-center justify-between px-1">
          <div className="space-y-1 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">Composition</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Drag to position • Slide to zoom</p>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </header>

        {/* Crop Area */}
        <div 
          ref={containerRef}
          className="relative aspect-[16/7] w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 cursor-move touch-none shadow-2xl"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <img
            src={imageUrl}
            alt="Banner Preview"
            className="pointer-events-none absolute inset-0 select-none"
            style={getCropTransform(cropX, cropY, zoom)}
          />
          
          {/* Overlay to indicate interaction */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="absolute inset-0 bg-black/20" />
             <div className="relative flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Move className="text-white/40" size={48} strokeWidth={1} />
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-10">
          <div className="flex items-center gap-6 w-full max-w-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <ZoomOut size={14} className="text-white/40" />
            </div>
            <input 
              type="range"
              min="1"
              max="2.5"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-white h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <ZoomIn size={14} className="text-white/40" />
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-sm">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-14 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex-[2] h-14 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Header'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
