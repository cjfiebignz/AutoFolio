'use client';

import { useState, useEffect } from 'react';
import { normalizeImageUrl } from './image-utils';

export type HeroContrastMode = 'light' | 'dark' | 'none';

/**
 * useHeroLuminance
 * 
 * lightweight hook to detect if an image is light or dark.
 * Samples the top-left/center quadrant where text typically sits.
 */
export function useHeroLuminance(imageUrl?: string) {
  const [contrastMode, setContrastMode] = useState<HeroContrastMode>('none');

  useEffect(() => {
    if (!imageUrl) {
      setContrastMode('none'); 
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = normalizeImageUrl(imageUrl);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sample a specific region where text usually sits
        // We'll sample a 200x200 area from the top-left/center
        canvas.width = 200;
        canvas.height = 200;
        
        // Draw the top portion of the image onto the canvas
        // Sampling top-left quadrant (0-50% width, 0-60% height)
        ctx.drawImage(
          img, 
          0, 0, img.width * 0.5, img.height * 0.6, 
          0, 0, 200, 200
        );

        const imageData = ctx.getImageData(0, 0, 200, 200);
        const data = imageData.data;
        let avg;
        let colorSum = 0;

        for (let i = 0; i < data.length; i += 4) {
          // Standard relative luminance formula
          avg = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
          colorSum += avg;
        }

        const brightness = colorSum / (200 * 200);
        
        // Threshold: 0.62 (158/255)
        // If brightness is high (light background), use DARK text ('dark' mode)
        // If brightness is low (dark background), use LIGHT text ('light' mode)
        setContrastMode(brightness > 158 ? 'dark' : 'light');
      } catch (e) {
        console.warn("Could not compute banner brightness:", e);
        setContrastMode('light'); // Fallback to white text on error for photos
      }
    };

    img.onerror = () => {
      setContrastMode('none'); 
    };
  }, [imageUrl]);

  return contrastMode;
}
