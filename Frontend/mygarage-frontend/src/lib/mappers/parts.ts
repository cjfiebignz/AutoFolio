/**
 * Centralized mapping for Parts system DTOs
 */

/**
 * Strips UI-only properties from preset items to prepare them for backend ingestion.
 * Ensures only savedPartId and quantity are sent.
 */
export function mapPresetItemsToDto(items: { savedPartId: string; quantity: number; [key: string]: any }[]) {
  return items.map(item => ({
    savedPartId: item.savedPartId,
    quantity: item.quantity
  }));
}
