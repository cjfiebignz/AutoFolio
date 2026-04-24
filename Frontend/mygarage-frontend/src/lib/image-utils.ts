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
  
  const envBaseUrl = process.env.NEXT_PUBLIC_AUTOFOLIO_API_BASE_URL;
  
  // If we have an environment variable, use it.
  if (envBaseUrl) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${envBaseUrl}${normalizedPath}`;
  }

  // In development, we use relative paths which are proxied by Next.js rewrites.
  // This ensures hydration safety (server and client see the same string)
  // and works on mobile because the mobile browser hits the Next.js server on port 3000.
  // We MUST ensure the path starts with / for the rewrite to catch it correctly.
  return path.startsWith('/') ? path : `/${path}`;
}
