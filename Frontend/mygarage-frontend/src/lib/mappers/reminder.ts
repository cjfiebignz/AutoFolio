import { Reminder } from "@/types/autofolio";
import { formatDisplayDate } from "@/lib/date-utils";

export interface ReminderViewModel {
  id: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  type: string;
  status: 'open' | 'done' | 'dismissed';
  urgency: 'overdue' | 'soon' | 'upcoming';
  notes?: string;
}

export function mapToRemindersViewModel(raw: Reminder[]): ReminderViewModel[] {
  if (!raw) return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return raw.map(item => {
    const dueDate = new Date(item.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let urgency: 'overdue' | 'soon' | 'upcoming' = 'upcoming';
    if (diffDays < 0) urgency = 'overdue';
    else if (diffDays <= 14) urgency = 'soon';

    return {
      id: item.id,
      title: item.title,
      dueDate: formatDisplayDate(dueDate),
      daysRemaining: diffDays,
      type: item.type,
      status: item.status,
      urgency,
      notes: item.notes,
    };
  });
}
