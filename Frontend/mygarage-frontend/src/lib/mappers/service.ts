import { ServiceEvent, ServiceAttachment } from "@/types/autofolio";
import { formatDisplayDate, formatNumber } from "@/lib/date-utils";

export interface ServiceEntryViewModel {
  id: string;
  title: string;
  date: string;
  odometer: string;
  rawOdometer?: number | null;
  cost: string;
  rawCost: number;
  type: 'workshop' | 'diy';
  isMainService?: boolean;
  notes?: string;
  attachments: ServiceAttachment[];
}

export function mapToServiceHistoryViewModel(raw: ServiceEvent[]): ServiceEntryViewModel[] {
  if (!raw) return [];
  
  return raw.map(item => ({
    id: item.id,
    title: item.title,
    date: formatDisplayDate(item.eventDate),
    odometer: item.odometerAtEvent ? `${formatNumber(item.odometerAtEvent)} km` : 'N/A',
    rawOdometer: item.odometerAtEvent,
    cost: item.totalCost ? `$${Number(item.totalCost).toFixed(2)}` : '$0.00',
    rawCost: item.totalCost ? Number(item.totalCost) : 0,
    type: (item.serviceType as 'workshop' | 'diy') || 'workshop',
    isMainService: item.isMainService,
    notes: item.notes,
    attachments: (item.attachments || []).map(a => ({
      ...a,
      createdAt: (a.createdAt as any) instanceof Date ? (a.createdAt as any).toISOString() : String(a.createdAt)
    }))
  }));
}
