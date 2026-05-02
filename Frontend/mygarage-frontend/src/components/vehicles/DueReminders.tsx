'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getDueReminders } from '@/lib/api';
import { DueReminder, DueRemindersResponse } from '@/types/autofolio';
import { 
  Bell, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface DueRemindersProps {
  onUpdate?: (count: number, maxSeverity: 'overdue' | 'due_now' | 'due_soon' | null) => void;
  compact?: boolean;
}

export function DueReminders({ onUpdate, compact = false }: DueRemindersProps) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [data, setData] = useState<DueRemindersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getDueReminders(userId);
      
      // Defensive Dedupe: vehicleId + type
      const seen = new Set();
      const uniqueReminders = res.reminders.filter(r => {
        const key = `${r.vehicleId}-${r.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const dedupedData = {
        ...res,
        reminders: uniqueReminders
      };

      setData(dedupedData);
      
      // Calculate max severity
      let maxSeverity: 'overdue' | 'due_now' | 'due_soon' | null = null;
      if (uniqueReminders.length > 0) {
        if (uniqueReminders.some(r => r.severity === 'overdue')) maxSeverity = 'overdue';
        else if (uniqueReminders.some(r => r.severity === 'due_now')) maxSeverity = 'due_now';
        else maxSeverity = 'due_soon';
      }
      
      onUpdate?.(uniqueReminders.length, maxSeverity);
      setError(false);
    } catch (err) {
      console.error('Failed to fetch due reminders:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, onUpdate]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchReminders();
    
    // Listen for refresh events (odometer updates, etc.)
    const handleRefresh = () => fetchReminders();
    window.addEventListener('garage-refresh', handleRefresh);
    window.addEventListener('odometer-updated', handleRefresh);
    
    return () => {
      window.removeEventListener('garage-refresh', handleRefresh);
      window.removeEventListener('odometer-updated', handleRefresh);
    };
  }, [fetchReminders, status, userId]);

  if (loading || error || !data || data.reminders.length === 0) {
    return null;
  }

  // Group by severity
  const overdue = data.reminders.filter(r => r.severity === 'overdue');
  const dueNow = data.reminders.filter(r => r.severity === 'due_now');
  const dueSoon = data.reminders.filter(r => r.severity === 'due_soon');

  const totalCount = data.reminders.length;

  return (
    <section className="animate-in fade-in slide-in-from-top-4 duration-700">
      {!compact && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-blue-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Active Reminders</h3>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/10 text-[8px] font-black text-blue-500 ring-1 ring-inset ring-blue-500/20">
              {totalCount}
            </span>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'gap-2' : 'gap-3'}`}>
        {overdue.map(reminder => (
          <ReminderItem key={reminder.id} reminder={reminder} compact={compact} />
        ))}
        {dueNow.map(reminder => (
          <ReminderItem key={reminder.id} reminder={reminder} compact={compact} />
        ))}
        {dueSoon.map(reminder => (
          <ReminderItem key={reminder.id} reminder={reminder} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function ReminderItem({ reminder, compact }: { reminder: DueReminder; compact?: boolean }) {
  const getSeverityStyles = () => {
    switch (reminder.severity) {
      case 'overdue': 
        return {
          container: 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.05)]',
          icon: <AlertCircle size={compact ? 12 : 14} className="text-red-500" />,
          badge: 'bg-red-500/10 text-red-500 ring-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]',
          label: 'Overdue'
        };
      case 'due_now':
        return {
          container: 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.05)]',
          icon: <Zap size={compact ? 12 : 14} className="text-orange-500" />,
          badge: 'bg-orange-500/10 text-orange-500 ring-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.2)]',
          label: 'Due Now'
        };
      case 'due_soon':
      default:
        return {
          container: 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.05)]',
          icon: <Clock size={compact ? 12 : 14} className="text-blue-500" />,
          badge: 'bg-blue-500/10 text-blue-500 ring-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.2)]',
          label: 'Upcoming'
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <Link 
      href={`/vehicles/${reminder.vehicleId}`}
      className={`group flex items-center justify-between rounded-2xl border transition-all active:scale-[0.98] ${styles.container} ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className={`${compact ? 'mt-0.5' : 'mt-1'} shrink-0`}>
          {styles.icon}
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground opacity-90 truncate max-w-[120px]">
              {reminder.vehicleDisplayName}
            </span>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ring-1 ring-inset ${styles.badge}`}>
              <div className="h-1 w-1 rounded-full bg-current animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest">
                {styles.label}
              </span>
            </div>
          </div>
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-foreground opacity-80 leading-tight truncate`}>
            {reminder.title}
          </p>
          {!compact && (
            <p className="text-[10px] font-medium text-muted leading-relaxed italic line-clamp-2">
              {reminder.message}
            </p>
          )}
        </div>
      </div>
      
      <ChevronRight size={14} className="text-muted opacity-20 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
