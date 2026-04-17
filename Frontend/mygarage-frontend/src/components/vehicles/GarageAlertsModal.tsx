'use client';

import React from 'react';
import { 
  X, AlertCircle, AlertTriangle, ArrowRight, Bell,
  Clock, ShieldCheck, FileText, Wrench, Landmark
} from 'lucide-react';
import { AttentionItem } from "@/lib/attention-utils";
import Link from 'next/link';

interface GarageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: (AttentionItem & { vehicleName: string })[];
}

export function GarageAlertsModal({ isOpen, onClose, alerts }: GarageAlertsModalProps) {
  if (!isOpen) return null;

  const getAttentionIcon = (item: AttentionItem) => {
    switch (item.category) {
      case 'registration':
        return <Landmark size={18} />;
      case 'insurance':
        return <ShieldCheck size={18} />;
      case 'service':
        return <Wrench size={18} />;
      case 'reminder':
        return <Bell size={18} />;
      case 'documents':
        return <FileText size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-6 transition-all animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-t-[40px] sm:rounded-[40px] border border-border-strong bg-surface shadow-premium transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-500 shadow-inner">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Garage Alerts</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">{alerts.length} Action Items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-3 no-scrollbar">
          {alerts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-dim italic">No active alerts found</p>
            </div>
          ) : (
            alerts.map((item, idx) => (
              <Link 
                key={idx}
                href={item.href || '#'}
                onClick={onClose}
                className={`group flex items-center justify-between gap-4 rounded-3xl border border-border-subtle bg-card-overlay p-5 transition-all hover:border-border-strong hover:bg-card-overlay-hover active:scale-[0.98] ${
                  item.severity === 'critical' ? 'ring-1 ring-inset ring-red-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl border ${
                    item.severity === 'critical' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500' 
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-500'
                  }`}>
                    {getAttentionIcon(item)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5 truncate">
                      {item.vehicleName}
                    </p>
                    <h4 className="text-sm font-black italic tracking-tight text-foreground opacity-90 uppercase group-hover:text-foreground transition-colors truncate">
                      {item.title}
                    </h4>
                    {item.subLabel && (
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                        item.severity === 'critical' ? 'text-red-600/60 dark:text-red-400/60' : 'text-muted'
                      }`}>
                        {item.subLabel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-overlay text-dim group-hover:text-muted transition-all">
                  <ArrowRight size={18} />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-foreground/[0.01] border-t border-border-subtle text-center shrink-0">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-dim">
            Automotive Ecosystem Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
