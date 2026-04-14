'use client';

import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export type MaintenanceStatus = 'up_to_date' | 'due_soon' | 'overdue' | 'insufficient_data';

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function MaintenanceStatusBadge({ status, size = 'md', className = '' }: MaintenanceStatusBadgeProps) {
  const config = {
    up_to_date: {
      label: 'On Track',
      icon: <CheckCircle2 size={size === 'sm' ? 10 : 14} />,
      styles: 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
      dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
    },
    due_soon: {
      label: 'Due Soon',
      icon: <AlertTriangle size={size === 'sm' ? 10 : 14} />,
      styles: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
      dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
    },
    overdue: {
      label: 'Overdue',
      icon: <AlertCircle size={size === 'sm' ? 10 : 14} />,
      styles: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
      dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
    },
    insufficient_data: {
      label: 'Setup Required',
      icon: <HelpCircle size={size === 'sm' ? 10 : 14} />,
      styles: 'bg-white/5 text-white/40 border-white/10',
      dot: 'bg-white/20'
    }
  }[status];

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${config.styles} ${className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
