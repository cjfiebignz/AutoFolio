'use client';

import { Image as ImageIcon } from 'lucide-react';
import { normalizeCrop, getCropTransform } from '@/lib/cropUtils';
import { normalizeImageUrl } from '@/lib/image-utils';
import { VehicleBannerControls } from './VehicleBannerControls';

interface VehicleBannerProps {
  vehicleId: string;
  bannerImageUrl?: string;
  bannerCropX?: number;
  bannerCropY?: number;
  bannerZoom?: number;
  children?: React.ReactNode;
}

export function VehicleBanner({ 
  bannerImageUrl, 
  bannerCropX, 
  bannerCropY, 
  bannerZoom = 1, 
  children 
}: Omit<VehicleBannerProps, 'vehicleId'>) {
  // Normalize coordinates (legacy 0-100 to 0-1)
  const x = normalizeCrop(bannerCropX);
  const y = normalizeCrop(bannerCropY);

  return (
    <div className="relative w-full group">
      {/* Banner Image Container */}
      <div className="relative w-full min-h-[380px] sm:min-h-[440px] bg-[#0b0b0c]">
        {bannerImageUrl ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={normalizeImageUrl(bannerImageUrl)}
                alt="Vehicle Banner"
                className="select-none"
                style={getCropTransform(x, y, bannerZoom)}
              />
            </div>
            {/* Multi-stage gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#0b0b0c]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-transparent to-transparent opacity-80" />
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent border-b border-white/5">
            <div className="relative opacity-20">
              <div className="absolute -inset-8 rounded-full bg-white/5 blur-3xl opacity-50" />
              <ImageIcon className="relative" size={60} strokeWidth={1} />
            </div>
          </div>
        )}

        {/* Content Layer (Navigation + Header) */}
        <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
