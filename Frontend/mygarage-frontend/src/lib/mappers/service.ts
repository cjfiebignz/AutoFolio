import { ServiceEvent, ServiceAttachment } from "@/types/autofolio";
import { formatDisplayDate, formatNumber } from "@/lib/date-utils";

export interface ServiceEntryViewModel {
  id: string;
  title: string;
  date: string;
  odometer: string;
  odometerDisplay: string;
  rawOdometer?: number | null;
  cost: string;
  rawCost: number;
  rawTotalCost: number;
  type: 'workshop' | 'diy';
  serviceType: string;
  isMainService?: boolean;
  notes?: string;
  attachments: ServiceAttachment[];
}

export function mapToServiceHistoryViewModel(raw: ServiceEvent[]): ServiceEntryViewModel[] {
  if (!raw) return [];
  
  return raw.map(item => {
    const rawCost = item.totalCost ? Number(item.totalCost) : 0;
    const formattedOdometer = item.odometerAtEvent ? `${formatNumber(item.odometerAtEvent)} km` : 'N/A';

    return {
      id: item.id,
      title: item.title,
      date: formatDisplayDate(item.eventDate),
      odometer: formattedOdometer,
      odometerDisplay: formattedOdometer,
      rawOdometer: item.odometerAtEvent,
      cost: item.totalCost ? `$${Number(item.totalCost).toFixed(2)}` : '$0.00',
      rawCost: rawCost,
      rawTotalCost: rawCost,
      type: (item.serviceType as 'workshop' | 'diy') || 'workshop',
      serviceType: item.serviceType === 'diy' ? 'DIY' : 'Workshop',
      isMainService: item.isMainService,
      notes: item.notes,
      attachments: (item.attachments || []).map(a => ({
        ...a,
        createdAt: (a.createdAt as any) instanceof Date ? (a.createdAt as any).toISOString() : String(a.createdAt)
      }))
    };
  });
}
