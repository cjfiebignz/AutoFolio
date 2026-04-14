'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createReminder, updateReminderMetadata, CreateReminderData } from '@/lib/api';
import { FormInput, FormSection, FormSelect, FormTextArea } from '@/components/ui/FormComponents';
import { Bell, Clock, Tag } from 'lucide-react';

interface ReminderFormProps {
  vehicleId: string;
  initialData?: any;
  reminderId?: string;
}

export function ReminderForm({ vehicleId, initialData, reminderId }: ReminderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueType, setDueType] = useState<'fixed' | 'relative'>('fixed');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    let dueDate = formData.get('dueDate') as string;

    if (dueType === 'relative' && !reminderId) {
      const amount = Number(formData.get('relativeAmount'));
      const unit = formData.get('relativeUnit') as string;
      const computedDate = new Date();
      
      if (unit === 'days') computedDate.setDate(computedDate.getDate() + amount);
      else if (unit === 'months') computedDate.setMonth(computedDate.getMonth() + amount);
      else if (unit === 'years') computedDate.setFullYear(computedDate.getFullYear() + amount);
      
      dueDate = computedDate.toISOString().split('T')[0];
    }
    
    try {
      const data: CreateReminderData = {
        title: formData.get('title') as string,
        dueDate,
        type: formData.get('type') as string,
        notes: (formData.get('notes') as string) || undefined,
      };

      if (reminderId) {
        await updateReminderMetadata(vehicleId, reminderId, data);
      } else {
        await createReminder(vehicleId, data);
      }

      // Small delay to ensure "Saving..." state is visible for UX consistency
      await new Promise(resolve => setTimeout(resolve, 300));

      router.push(`/vehicles/${vehicleId}?tab=overview`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save reminder');
      setIsSubmitting(false);
    }
  };

  const formattedDate = initialData?.dueDate 
    ? new Date(initialData.dueDate).toISOString().split('T')[0] 
    : '';

  return (
    <form onSubmit={handleSubmit} method="POST" className="space-y-10">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
          {error}
        </div>
      )}

      {/* Reminder Details */}
      <FormSection title="Reminder Details" icon={<Bell size={14} />}>
        <FormInput 
          name="title" 
          label="What's due?" 
          placeholder="e.g. Annual Service" 
          required 
          defaultValue={initialData?.title}
          disabled={isSubmitting} 
        />
        <FormSelect 
          name="type" 
          label="Task Category" 
          disabled={isSubmitting}
          options={[
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'registration', label: 'Registration' },
            { value: 'insurance', label: 'Insurance' },
            { value: 'other', label: 'Other' }
          ]} 
          defaultValue={initialData?.type || "maintenance"}
        />
      </FormSection>

      {/* Timing Section */}
      <FormSection title="Timing" icon={<Clock size={14} />}>
        {!reminderId && (
          <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl ring-1 ring-white/10 mb-2">
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={() => setDueType('fixed')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dueType === 'fixed' ? 'bg-white text-black' : 'text-white/40 hover:text-white/60'}`}
            >
              Exact Date
            </button>
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={() => setDueType('relative')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dueType === 'relative' ? 'bg-white text-black' : 'text-white/40 hover:text-white/60'}`}
            >
              Relative
            </button>
          </div>
        )}

        {dueType === 'fixed' || reminderId ? (
          <FormInput 
            name="dueDate" 
            label="Due Date" 
            type="date" 
            required 
            defaultValue={formattedDate}
            disabled={isSubmitting} 
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormInput name="relativeAmount" label="In..." type="number" defaultValue="1" min="1" required disabled={isSubmitting} />
            <FormSelect 
              name="relativeUnit" 
              label="Unit" 
              disabled={isSubmitting}
              options={[
                { value: 'days', label: 'Days' },
                { value: 'months', label: 'Months' },
                { value: 'years', label: 'Years' }
              ]} 
              defaultValue="months"
            />
          </div>
        )}
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes" icon={<Tag size={14} />}>
        <FormTextArea 
          name="notes"
          label="Additional Notes"
          rows={4}
          defaultValue={initialData?.notes}
          disabled={isSubmitting}
          placeholder="Specific details about what needs to be done..."
        />
      </FormSection>

      {/* Form Actions */}
      <footer className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <Link 
          href={`/vehicles/${vehicleId}?tab=overview`}
          className={`flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </Link>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : (reminderId ? "Save Changes" : "Set Reminder")}
        </button>
      </footer>
    </form>
  );
}
