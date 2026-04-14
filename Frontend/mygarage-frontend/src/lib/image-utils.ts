/**
 * Utility to normalize image URLs from the backend.
 * Prepends the API base URL if the path is relative (/uploads/...).
 */
export function normalizeImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  
  // If it's already an absolute URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_AUTOFOLIO_API_BASE_URL || 'http://localhost:3001';
  
  // Ensure we don't double slash if path already starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${API_BASE_URL}${normalizedPath}`;
}
