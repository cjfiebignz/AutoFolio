import { Document } from "@/types/autofolio";
import { formatDisplayDate } from "@/lib/date-utils";

export type DocumentCategory = 'receipt' | 'registration' | 'insurance' | 'manual' | 'other';

export interface DocumentViewModel {
  id: string;
  title: string;
  category: DocumentCategory;
  date: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  notes?: string;
}

export function mapToDocumentsViewModel(raw: Document[]): DocumentViewModel[] {
  if (!raw) return [];
  
  return raw.map(item => ({
    id: item.id,
    title: item.title,
    category: (item.category as DocumentCategory) || 'other',
    date: formatDisplayDate(item.date),
    fileUrl: item.fileUrl,
    fileType: item.fileType,
    fileSize: item.fileSize ? formatFileSize(item.fileSize) : undefined,
    notes: item.notes,
    createdAt: (item.createdAt as any) instanceof Date ? (item.createdAt as any).toISOString() : String(item.createdAt)
  }));
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
