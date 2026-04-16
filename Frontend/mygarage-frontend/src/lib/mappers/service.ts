import { ServiceEvent, ServiceAttachment, ServiceSummary as RawServiceSummary } from "@/types/autofolio";
import { formatDisplayDate, formatNumber } from "@/lib/date-utils";

export interface ServiceEntryViewModel {
  id: string;
  title: string;
  date: string;
  odometerDisplay: string;
  rawOdometer: number | null;
  totalCostDisplay: string;
  rawTotalCost: number;
  type: 'workshop' | 'diy';
  serviceTypeLabel: string;
  isMainService: boolean;
  notes: string;
  attachments: ServiceAttachment[];
}

export interface ServiceSummaryViewModel {
  currentOdometer: number | null;
  baselineSource: 'main_service' | 'settings_baseline' | 'none';
  baselineDate: string | null;
  baselineKms: number | null;
  lastServiceDate: string | null;
  lastServiceKms: number | null;
  serviceIntervalMonths: number | null;
  serviceIntervalKms: number | null;
  nextServiceDueDate: string | null;
  nextServiceDueKms: number | null;
  kmsUntilNextService: number | null;
  status: 'up_to_date' | 'due_soon' | 'overdue' | 'insufficient_data';
  hasEnoughData: boolean;
  isFallbackBaseline: boolean;
}

export function mapToServiceHistoryViewModel(raw: ServiceEvent[]): ServiceEntryViewModel[] {
  if (!raw) return [];
  
  return raw.map(item => {
    const rawTotalCost = item.totalCost ? Number(item.totalCost) : 0;
    const odometerDisplay = item.odometerAtEvent ? `${formatNumber(item.odometerAtEvent)} km` : 'N/A';

    return {
      id: item.id,
      title: item.title,
      date: formatDisplayDate(item.eventDate),
      odometerDisplay,
      rawOdometer: item.odometerAtEvent || null,
      totalCostDisplay: item.totalCost ? `$${Number(item.totalCost).toFixed(2)}` : '$0.00',
      rawTotalCost,
      type: (item.serviceType as 'workshop' | 'diy') || 'workshop',
      serviceTypeLabel: item.serviceType === 'diy' ? 'DIY' : 'Workshop',
      isMainService: !!item.isMainService,
      notes: item.notes || '',
      attachments: (item.attachments || []).map(a => ({
        ...a,
        createdAt: (a.createdAt as any) instanceof Date ? (a.createdAt as any).toISOString() : String(a.createdAt)
      }))
    };
  });
}

export function mapToServiceSummaryViewModel(raw: RawServiceSummary['serviceSummary'] | null | undefined): ServiceSummaryViewModel | null {
  if (!raw) return null;

  return {
    currentOdometer: raw.currentKms,
    baselineSource: (raw.baselineSource as any) || 'none',
    baselineDate: raw.baselineDate,
    baselineKms: raw.baselineKms,
    lastServiceDate: raw.lastServiceDate,
    lastServiceKms: raw.lastServiceKms,
    serviceIntervalMonths: raw.serviceIntervalMonths,
    serviceIntervalKms: raw.serviceIntervalKms,
    nextServiceDueDate: raw.nextServiceDueDate,
    nextServiceDueKms: raw.nextServiceDueKms,
    kmsUntilNextService: raw.kmsUntilNextService,
    status: raw.status,
    hasEnoughData: raw.hasEnoughData,
    isFallbackBaseline: raw.baselineSource === 'settings_baseline'
  };
}
