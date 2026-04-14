/**
 * Shared date formatting utilities to ensure deterministic rendering
 * across Server-Side Rendering (SSR) and Client-Side hydration.
 */

/**
 * Formats a date string or Date object into a deterministic format: "D MMM YYYY" (e.g., "4 Apr 2026")
 * Uses a fixed locale (en-GB) to avoid hydration mismatches between server and client.
 */
export function formatDisplayDate(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use en-GB for deterministic "day month year" format
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

/**
 * Formats a number into a deterministic currency format (e.g., "$1,234.56")
 * Uses en-US locale for formatting consistency.
 */
export function formatCurrency(
  amount: number | undefined | null, 
  currency?: string | null, 
  fallbackCurrency: string = 'AUD'
): string {
  const code = currency || fallbackCurrency;
  
  if (amount === undefined || amount === null) {
    return code === 'USD' ? 'US$0.00' : `0.00 ${code}`;
  }
  
  try {
    let formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    // Ensure USD is explicitly identified as US$ to avoid ambiguity with AUD (A$)
    if (code === 'USD' && formatted.startsWith('$')) {
      formatted = 'US' + formatted;
    }

    return formatted;
  } catch (e) {
    // Fallback if currency code is invalid or not supported
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${formatted} ${code}`;
  }
}

/**
 * Formats a number into a deterministic string with thousands separators.
 * Uses en-US locale for consistent "," and "." separators.
 */
export function formatNumber(value: number | undefined | null, options?: Intl.NumberFormatOptions): string {
  if (value === undefined || value === null) return '0';
  
  return new Intl.NumberFormat('en-US', options).format(value);
}

export type ExpiryStatus = 'expired' | 'due_soon' | 'active' | 'none';

export interface LifecycleStatus {
  label: string;
  subLabel: string;
  tone: 'success' | 'warning' | 'neutral';
}

/**
 * Determines the expiry status based on a given date.
 */
export function getExpiryStatus(expiryDate: string | Date | undefined | null): ExpiryStatus {
  if (!expiryDate) return 'none';
  const d = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  
  // Set times to midnight for consistent comparison
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'due_soon';
  return 'active';
}

/**
 * Returns a human-readable relative time text (e.g., "In 14 days", "Yesterday").
 * To ensure hydration safety, this should ideally be used in a way that doesn't
 * mismatch between server and client, or handled via a client-only render pattern.
 */
export function getRelativeTimeText(date: string | Date | undefined | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Set times to midnight for consistent comparison
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;
  
  return ''; // Return empty for long periods to keep it restrained
}

/**
 * Centralized helper for lifecycle status display logic (Registration, Insurance, etc.)
 */
export function formatLifecycleStatus(
  expiryDate: string | Date | undefined | null, 
  storedStatus?: string,
  activeLabel: string = 'Active'
): LifecycleStatus {
  const expiryStatus = getExpiryStatus(expiryDate);
  const relativeText = getRelativeTimeText(expiryDate);
  
  // 1. Not Recorded / Missing
  if (!expiryDate && !storedStatus) {
    return {
      label: 'Not Recorded',
      subLabel: 'Action required',
      tone: 'warning'
    };
  }

  // 2. Expired (either by date or stored status)
  if (expiryStatus === 'expired' || storedStatus === 'expired') {
    return {
      label: 'Expired',
      subLabel: relativeText ? `Expired ${relativeText}` : 'Action required',
      tone: 'warning'
    };
  }

  // 3. Due Soon (date-based threshold)
  if (expiryStatus === 'due_soon') {
    return {
      label: 'Due Soon',
      subLabel: relativeText ? `Due ${relativeText}` : 'Renews soon',
      tone: 'warning'
    };
  }

  // 4. Active / Current
  if (storedStatus === 'active' || (expiryStatus === 'active' && storedStatus !== 'cancelled' && storedStatus !== 'pending')) {
    return {
      label: activeLabel,
      subLabel: relativeText ? `Renews ${relativeText}` : 'On file',
      tone: 'success'
    };
  }

  // 5. Specific Stored States
  if (storedStatus === 'pending') {
    return {
      label: 'Pending',
      subLabel: 'Verification needed',
      tone: 'neutral'
    };
  }

  if (storedStatus === 'cancelled') {
    return {
      label: 'Cancelled',
      subLabel: 'No longer active',
      tone: 'neutral'
    };
  }

  // 6. Fallback
  return {
    label: storedStatus || 'Recorded',
    subLabel: 'Update needed',
    tone: 'neutral'
  };
}
