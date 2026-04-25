'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  X, AlertCircle, AlertTriangle, ArrowRight, Bell,
  Clock, ShieldCheck, FileText, Wrench, Landmark, Check,
  Activity, Gauge, Calendar, ChevronRight
} from 'lucide-react';
import { AttentionItem } from "@/lib/attention-utils";
import Link from 'next/link';
import { isMaintenanceAcknowledged, acknowledgeMaintenance } from '@/lib/maintenance-ack-utils';
import { UserVehicle } from "@/types/autofolio";
import { mapToVehicleViewModel } from "@/lib/mappers/vehicle";
import { mapToRemindersViewModel } from "@/lib/mappers/reminder";
import { mapToDocumentsViewModel } from "@/lib/mappers/document";
import { mapToServiceSummaryViewModel } from "@/lib/mappers/service";
import { evaluateVehicleAttention } from "@/lib/attention-utils";

interface GarageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: UserVehicle[];
}

type ExtendedAttentionItem = AttentionItem & { 
  vehicleName: string; 
  vehicleId: string; 
  status: string;
};

export function GarageAlertsModal({ isOpen, onClose, vehicles }: GarageAlertsModalProps) {
  // Local dismissal tracking to refresh UI immediately
  const [dismissalNonce, setDismissalCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Process all garage data into high-level dashboard state
  const dashboard = useMemo(() => {
    const nextActions: ExtendedAttentionItem[] = [];
    const upcomingItems: ExtendedAttentionItem[] = [];
    let vehiclesOnTrack = 0;
    let criticalTotal = 0;

    vehicles.forEach(rawVehicle => {
      const vehicle = mapToVehicleViewModel(rawVehicle);
      const reminders = mapToRemindersViewModel(rawVehicle.reminders || []);
      const documents = mapToDocumentsViewModel(rawVehicle.documents || []);
      const serviceSummary = mapToServiceSummaryViewModel(rawVehicle.serviceSummary);
      
      const items = evaluateVehicleAttention({
        vehicle,
        reminders,
        documents,
        serviceSummary
      });

      const status = serviceSummary?.status || 'unknown';
      let hasAlert = false;

      items.forEach(item => {
        // Hydration-safe persistent filter for acknowledgements
        const isAck = mounted && isMaintenanceAcknowledged(vehicle.id, item.key, status);
        if (isAck) return;

        const extendedItem: ExtendedAttentionItem = {
          ...item,
          vehicleName: vehicle.nickname,
          vehicleId: vehicle.id,
          status
        };

        if (item.severity === 'critical' || item.severity === 'warning') {
          nextActions.push(extendedItem);
          hasAlert = true;
          if (item.severity === 'critical') criticalTotal++;
        } else if (item.severity === 'info') {
          upcomingItems.push(extendedItem);
        }
      });

      if (!hasAlert) vehiclesOnTrack++;
    });

    return {
      nextActions: nextActions.sort((a, b) => (a.severity === 'critical' ? -1 : 1)).slice(0, 5),
      upcomingItems: upcomingItems.slice(0, 5),
      stats: {
        totalVehicles: vehicles.length,
        onTrack: vehiclesOnTrack,
        attentionNeeded: nextActions.length,
        critical: criticalTotal
      }
    };
  }, [vehicles, mounted, dismissalNonce]);

  if (!isOpen) return null;

  const handleDismiss = (e: React.MouseEvent, alert: ExtendedAttentionItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 1. Persist acknowledgement
    acknowledgeMaintenance(alert.vehicleId, alert.key, alert.status);
    
    // 2. Trigger local re-calc
    setDismissalCount(prev => prev + 1);
  };

  const getAttentionIcon = (category: string) => {
    switch (category) {
      case 'registration': return <Landmark size={16} />;
      case 'insurance': return <ShieldCheck size={16} />;
      case 'service': return <Wrench size={16} />;
      case 'reminder': return <Bell size={16} />;
      case 'documents': return <FileText size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-6 transition-all animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-t-[40px] sm:rounded-[40px] border border-border-strong bg-surface shadow-premium transition-all max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8 shrink-0 bg-card-overlay/50">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-muted border border-border-subtle shadow-inner">
              <Bell size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Garage Overview</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">Portfolio Intelligence Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 no-scrollbar">
          
          {/* Section 1: Health Summary & Stats Grid */}
          <section className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBlock 
                label="Vehicles" 
                value={dashboard.stats.totalVehicles} 
                icon={<Activity size={12} />} 
              />
              <StatBlock 
                label="Attention" 
                value={dashboard.stats.attentionNeeded} 
                icon={<AlertTriangle size={12} />} 
                highlight={dashboard.stats.attentionNeeded > 0 ? 'warning' : undefined}
              />
              <StatBlock 
                label="On Track" 
                value={dashboard.stats.onTrack} 
                icon={<Check size={12} />} 
                highlight={dashboard.stats.onTrack === dashboard.stats.totalVehicles ? 'success' : undefined}
              />
              <StatBlock 
                label="Critical" 
                value={dashboard.stats.critical} 
                icon={<AlertCircle size={12} />} 
                highlight={dashboard.stats.critical > 0 ? 'danger' : undefined}
              />
            </div>
          </section>

          {/* Section 2: Next Actions (Urgent/Warning) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Next Actions</h4>
              {dashboard.nextActions.length > 0 && (
                <span className="text-[8px] font-black uppercase tracking-widest text-accent px-2 py-0.5 rounded bg-accent/5">Prioritized</span>
              )}
            </div>

            <div className="space-y-2.5">
              {dashboard.nextActions.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-border-subtle bg-foreground/[0.01] p-10 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dim italic">No urgent actions. Your garage is looking healthy.</p>
                </div>
              ) : (
                dashboard.nextActions.map((item) => (
                  <ActionRow 
                    key={`${item.vehicleId}-${item.key}`} 
                    item={item} 
                    onClose={onClose} 
                    onDismiss={(e) => handleDismiss(e, item)} 
                  />
                ))
              )}
            </div>
          </section>

          {/* Section 3: Upcoming (Info/Non-Urgent) */}
          {dashboard.upcomingItems.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted px-1">Upcoming & Pipeline</h4>
              <div className="space-y-2">
                {dashboard.upcomingItems.map((item) => (
                  <Link
                    key={`${item.vehicleId}-${item.key}`}
                    href={item.href || '#'}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-card-overlay/30 p-4 transition-all hover:bg-card-overlay-hover active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-foreground/5 text-muted border border-border-subtle">
                        {getAttentionIcon(item.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-dim truncate">{item.vehicleName}</p>
                        <h5 className="text-xs font-bold text-foreground opacity-80 group-hover:opacity-100 truncate">{item.title}</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-muted/40 uppercase tracking-widest hidden sm:block italic">{item.subLabel}</span>
                      <ChevronRight size={14} className="text-muted/20 group-hover:text-muted transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Footer info */}
        <div className="p-6 bg-foreground/[0.01] border-t border-border-subtle text-center shrink-0">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-dim">
            Portfolio Health v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: 'success' | 'warning' | 'danger' }) {
  const highlightStyles = {
    success: 'bg-green-500/5 text-green-500 border-green-500/10',
    warning: 'bg-yellow-500/5 text-yellow-500 border-yellow-500/10',
    danger: 'bg-red-500/5 text-red-500 border-red-500/10',
  };

  return (
    <div className={`flex flex-col gap-1 rounded-2xl border p-4 text-center transition-all ${highlight ? highlightStyles[highlight] : 'bg-card-overlay/50 border-border-subtle text-muted'}`}>
      <div className="flex items-center justify-center gap-1.5 opacity-40">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black italic tracking-tighter uppercase leading-none">{value}</p>
    </div>
  );
}

function ActionRow({ item, onClose, onDismiss }: { item: ExtendedAttentionItem; onClose: () => void; onDismiss: (e: React.MouseEvent) => void }) {
  const getAttentionIcon = (category: string) => {
    switch (category) {
      case 'registration': return <Landmark size={18} />;
      case 'insurance': return <ShieldCheck size={18} />;
      case 'service': return <Wrench size={18} />;
      case 'reminder': return <Bell size={18} />;
      case 'documents': return <FileText size={18} />;
      default: return <Clock size={18} />;
    }
  };

  return (
    <Link 
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
          {getAttentionIcon(item.category)}
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
      <div className="flex flex-col gap-2 shrink-0">
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-card-overlay text-dim group-hover:text-muted transition-all border border-border-subtle group-hover:border-border-strong shadow-sm">
          <ArrowRight size={18} />
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-card-overlay border border-border-subtle text-dim hover:text-green-500 hover:border-green-500/20 transition-all shadow-sm active:scale-90"
          title="Acknowledge & Dismiss"
        >
          <Check size={18} strokeWidth={3} />
        </button>
      </div>
    </Link>
  );
}
