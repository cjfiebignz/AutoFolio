'use client';

/**
 * Maintenance Acknowledgement Utilities
 * 
 * Provides centralized logic for scoped persistence of maintenance alerts.
 * Tracked per vehicleId + alertKey with state-based signatures.
 */

export const MAINTENANCE_ACK_PREFIX = 'autofolio_alert_ack_';

/**
 * Generates a unique key for sessionStorage scoped to a specific alert on a vehicle.
 * Identity: vehicleId + alertKey (e.g. 'reg-expired', 'reminder-uuid')
 */
export function getMaintenanceAckKey(vehicleId: string, alertKey: string): string {
  return `${MAINTENANCE_ACK_PREFIX}${vehicleId}_${alertKey}`;
}

/**
 * Generates a stable state signature for maintenance status.
 * Re-showing logic triggers when this signature changes.
 */
export function getMaintenanceSignature(vehicleId: string, status: string): string {
  // We keep it simple: id + status. 
  // If status changes (e.g. soon -> overdue), the signature changes and alert reappears.
  return `${vehicleId}_${status}`;
}

/**
 * Checks if a specific alert has been acknowledged in the current session.
 */
export function isMaintenanceAcknowledged(vehicleId: string, alertKey: string, status: string): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  
  try {
    const key = getMaintenanceAckKey(vehicleId, alertKey);
    const stored = window.sessionStorage.getItem(key);
    const currentSignature = getMaintenanceSignature(vehicleId, status);
    
    return stored === currentSignature;
  } catch (e) {
    console.warn('Failed to check alert acknowledgement:', e);
    return false;
  }
}

/**
 * Persists an acknowledgement for a specific alert state.
 */
export function acknowledgeMaintenance(vehicleId: string, alertKey: string, status: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  
  try {
    const key = getMaintenanceAckKey(vehicleId, alertKey);
    const signature = getMaintenanceSignature(vehicleId, status);
    window.sessionStorage.setItem(key, signature);
  } catch (e) {
    console.warn('Failed to save alert acknowledgement:', e);
  }
}
