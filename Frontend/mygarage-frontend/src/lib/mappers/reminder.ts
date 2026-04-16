import { Reminder } from "@/types/autofolio";
import { formatDisplayDate, calculateDaysRemaining, getReminderUrgency } from "@/lib/date-utils";

export interface ReminderViewModel {
  id: string;
  title: string;
  dueDate: string;
  daysRemaining: number | null;
  type: string;
  status: 'open' | 'done' | 'dismissed';
  urgency: 'overdue' | 'soon' | 'upcoming';
  notes?: string;
}

export function mapToRemindersViewModel(raw: Reminder[]): ReminderViewModel[] {
  if (!raw) return [];

  return raw.map(item => {
    const diffDays = calculateDaysRemaining(item.dueDate);
    const urgency = getReminderUrgency(diffDays);

    return {
      id: item.id,
      title: item.title,
      dueDate: formatDisplayDate(item.dueDate),
      daysRemaining: diffDays,
      type: item.type,
      status: item.status,
      urgency,
      notes: item.notes,
    };
  });
}
