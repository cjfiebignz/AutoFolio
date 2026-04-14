/**
 * AutoFolio Crop Utilities
 * 
 * Provides mathematically correct, device-independent crop and transform
 * calculations for banner images.
 */

/**
 * Normalizes a crop value (0-100) to a 0-1 range.
 * Safely handles undefined or legacy values.
 */
export function normalizeCrop(value: number | undefined): number {
  if (value === undefined || value === null) return 0.5;
  // If value is > 1, assume it's a 0-100 percentage and convert
  if (value > 1) return value / 100;
  return value;
}

/**
 * Denormalizes a 0-1 value back to 0-100 for backend compatibility.
 */
export function denormalizeCrop(value: number): number {
  return Math.round(value * 100);
}

/**
 * Clamps a normalized crop value based on zoom level to prevent exposing empty space.
 * 
 * Math:
 * At zoom 1.0, the image fills the container (object-fit: cover base).
 * The maximum possible offset from center (0.5) is limited by how much larger 
 * the image is than the frame at the current zoom.
 */
export function clampCrop(value: number, zoom: number): number {
  const maxOffset = (zoom - 1) / (2 * zoom);
  const min = 0.5 - maxOffset;
  const max = 0.5 + maxOffset;
  
  // If zoom is 1, maxOffset is 0, so value is always 0.5
  if (zoom <= 1) return 0.5;
  
  return Math.max(min, Math.min(max, value));
}

/**
 * Generates a CSS transform string based on normalized crop and zoom.
 * 
 * We use object-position percentage-based logic mapped to a transform 
 * to ensure we leverage the browser's native 'cover' fitting as a base,
 * but with precise transform-based movement for performance and consistency.
 * 
 * However, the requirement is to use translate(x, y) scale(zoom).
 * To make this work with 'object-fit: cover', we compute the percentage offset
 * relative to the zoomed size.
 */
export function getCropTransform(cropX: number, cropY: number, zoom: number): React.CSSProperties {
  // We translate the image based on its deviation from the center (0.5)
  // Shift is multiplied by 100 to work with percentage-based translation
  // relative to the image's own dimensions.
  const translateX = (0.5 - cropX) * 100;
  const translateY = (0.5 - cropY) * 100;

  return {
    transform: `scale(${zoom}) translate(${translateX}%, ${translateY}%)`,
    transformOrigin: 'center center',
    objectFit: 'cover' as const,
    width: '100%',
    height: '100%'
  };
}
