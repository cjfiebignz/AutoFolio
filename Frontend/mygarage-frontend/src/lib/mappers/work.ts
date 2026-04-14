import { WorkJob, WorkAttachment, WorkJobPart, WorkJobSpec } from "@/types/autofolio";
import { formatDisplayDate, formatNumber } from "@/lib/date-utils";

export interface WorkJobViewModel {
  id: string;
  title: string;
  status: 'planned' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  date?: string;
  notes?: string;
  estimate?: string; // Legacy formatted string
  rawEstimate: number | null;
  attachments: WorkAttachment[];
  parts: WorkJobPart[];
  specs: WorkJobSpec[];
}

export function mapToWorkJobsViewModel(raw: WorkJob[]): WorkJobViewModel[] {
  if (!raw) return [];
  
  return raw.map(item => {
    const rawEstimate = item.estimate ? Number(item.estimate) : null;
    const normalizedEstimate = (rawEstimate !== null && !isNaN(rawEstimate)) ? rawEstimate : null;

    return {
      id: item.id,
      title: item.title,
      status: (item.status as 'planned' | 'in-progress' | 'done') || 'planned',
      priority: (item.priority as 'low' | 'medium' | 'high') || 'medium',
      date: item.date ? formatDisplayDate(item.date) : undefined,
      notes: item.notes,
      rawEstimate: normalizedEstimate,
      // Keep legacy estimate for backwards compatibility if needed, but normalized
      estimate: normalizedEstimate !== null 
        ? `$${formatNumber(normalizedEstimate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : undefined,
      attachments: (item.attachments || []).map(a => ({
        ...a,
        createdAt: (a.createdAt as any) instanceof Date ? (a.createdAt as any).toISOString() : String(a.createdAt)
      })),
      parts: item.parts || [],
      specs: item.specs || [],
    };
  });
}
