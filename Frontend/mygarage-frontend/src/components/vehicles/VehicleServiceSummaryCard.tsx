'use client';

import { useState } from 'react';
import { ServiceSummaryViewModel } from "@/lib/mappers/service";
import { formatNumber, formatDisplayDate } from "@/lib/date-utils";
import { usePreferences } from "@/lib/preferences";
import { Calendar, Gauge, RefreshCw, AlertCircle, CheckCircle2, Settings2, Edit2 } from "lucide-react";
import { VehicleServiceSettingsEditor } from "./VehicleServiceSettingsEditor";
import { VehicleOdometerEditor } from "./VehicleOdometerEditor";
import { MaintenanceStatus } from "./MaintenanceStatusBadge";

interface VehicleServiceSummaryCardProps {
  vehicleId: string;
  summary: ServiceSummaryViewModel;
}

/**
 * VehicleServiceSummaryCard
 * 
 * Displays a prominent summary of the vehicle's service status.
 */
export function VehicleServiceSummaryCard({ vehicleId, summary }: VehicleServiceSummaryCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOdometerOpen, setIsOdometerOpen] = useState(false);
  const { formatDistance, getUnitLabel } = usePreferences();

  const {
    currentOdometer,
    baselineSource,
    lastServiceDate,
    lastServiceKms,
    serviceIntervalMonths,
    serviceIntervalKms,
    nextServiceDueDate,
    nextServiceDueKms,
    kmsUntilNextService,
    status,
    hasEnoughData,
    isFallbackBaseline,
    baselineKms
  } = summary;

  // State-independent status mapping for deterministic hydration
  const statusColors = {
    overdue: { 
      text: 'text-red-600 dark:text-red-400', 
      icon: 'text-red-500', 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/20' 
    },
    due_soon: { 
      text: 'text-yellow-600 dark:text-yellow-400', 
      icon: 'text-yellow-500', 
      bg: 'bg-yellow-500/10', 
      border: 'border-yellow-500/20' 
    },
    up_to_date: { 
      text: 'text-green-600 dark:text-green-500/80', 
      icon: 'text-green-600 dark:text-green-500/60', 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/20' 
    },
    insufficient_data: { 
      text: 'text-muted', 
      icon: 'text-dim', 
      bg: 'bg-card-overlay', 
      border: 'border-subtle' 
    }
  };

  const currentStatusColors = statusColors[status as keyof typeof statusColors] || statusColors.insufficient_data;

  if (!hasEnoughData) {
    return (
      <div className="rounded-[40px] border border-subtle bg-card-overlay p-10 shadow-2xl backdrop-blur-md transition-colors duration-300">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 rounded-2xl bg-foreground/5 p-5 text-muted">
            <AlertCircle size={36} strokeWidth={1.5} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground opacity-60 mb-2">Service Summary Unavailable</h3>
          <p className="max-w-[280px] text-[11px] font-medium leading-relaxed text-muted mb-10">
            Add your last service record or set service intervals in vehicle settings to see your maintenance dashboard.
          </p>
          <button 
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="relative z-20 flex h-12 items-center justify-center gap-3 rounded-xl bg-foreground text-background px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
          >
            <Settings2 size={14} />
            Set Service Settings
          </button>
        </div>
        
        <VehicleServiceSettingsEditor 
          key={`settings-editor-empty-${vehicleId}`}
          vehicleId={vehicleId}
          currentOdometer={currentOdometer}
          serviceIntervalKms={serviceIntervalKms || undefined}
          serviceIntervalMonths={serviceIntervalMonths || undefined}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-[40px] border border-border-strong bg-gradient-to-br from-foreground/5 to-transparent p-8 shadow-2xl backdrop-blur-md transition-all duration-500">
      
      {/* Top Summary Block: Robust Multi-Row Architecture */}
      <div className="flex flex-col gap-y-10 mb-10">
        
        {/* Row 1: Context & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col items-start gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Maintenance Intelligence</span>
              <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase whitespace-nowrap leading-none">Service Status</h2>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${currentStatusColors.bg} border ${currentStatusColors.border} ring-1 ring-inset ring-foreground/5 shrink-0`}>
              <CheckCircle2 size={12} className={currentStatusColors.icon} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${currentStatusColors.text}`}>
                {status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setIsOdometerOpen(true)}
              className="h-11 flex items-center justify-center gap-3 rounded-2xl bg-foreground/5 border border-border-strong px-5 text-[10px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 hover:text-foreground transition-all shadow-xl active:scale-95"
              title="Update Odometer"
            >
              <Edit2 size={14} />
              <span>Update</span>
            </button>
            <button 
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="h-11 w-11 flex items-center justify-center rounded-2xl bg-foreground/5 border border-border-strong text-dim hover:bg-foreground/10 hover:text-foreground transition-all shadow-xl active:scale-95"
              title="Service Settings"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>

        {/* Row 2: Authoritative Metrics (Independent of title alignment) */}
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted opacity-40">Current Odometer</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-none">
                {currentOdometer !== null ? formatNumber(currentOdometer) : "—"}
              </span>
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">{getUnitLabel()}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/40 dark:text-blue-400/30">Next Due At</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic tracking-tighter text-blue-600 dark:text-blue-400 uppercase leading-none">
                {nextServiceDueKms !== null ? formatNumber(nextServiceDueKms) : "—"}
              </span>
              <span className="text-[10px] font-black text-blue-600/30 dark:text-blue-400/20 uppercase tracking-widest">{getUnitLabel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Subdivisions: All Facts preserved in high density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-border-subtle pt-8">
        <SummaryDetailCompact 
          label="Next Date Due" 
          value={nextServiceDueDate ? formatDisplayDate(nextServiceDueDate) : "Not calc"} 
          secondaryText={kmsUntilNextService !== null ? (
            kmsUntilNextService <= 0 ? 'Overdue' : `${formatDistance(kmsUntilNextService)} remaining`
          ) : undefined}
          tone={kmsUntilNextService !== null && kmsUntilNextService <= 0 ? 'critical' : 'neutral'}
        />
        <SummaryDetailCompact 
          label="Last Service" 
          value={lastServiceDate ? formatDisplayDate(lastServiceDate) : "Not recorded"} 
          secondaryText={lastServiceKms ? formatDistance(lastServiceKms) : undefined}
        />
        <SummaryDetailCompact 
          label="Interval (Time)" 
          value={serviceIntervalMonths ? `${serviceIntervalMonths} Mo` : "Not set"} 
        />
        <SummaryDetailCompact 
          label="Interval (Kms)" 
          value={serviceIntervalKms ? formatDistance(serviceIntervalKms) : "Not set"} 
        />
      </div>

      {/* Baseline Context Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-border-subtle opacity-50 pt-6">
        <div className="flex items-center gap-3">
          <div className={`h-1.5 w-1.5 rounded-full ${baselineSource === 'main_service' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-foreground/10'}`} />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">
            {baselineSource === 'main_service' 
              ? 'Latest Main Service Baseline' 
              : 'Settings Baseline (No Main Service Record)'}
          </p>
        </div>
        {isFallbackBaseline && (
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-dim italic">
            Manual configuration active
          </p>
        )}
      </div>

      <VehicleServiceSettingsEditor 
        key={`settings-editor-${vehicleId}`}
        vehicleId={vehicleId}
        currentOdometer={currentOdometer}
        baselineKms={baselineKms}
        baselineSource={baselineSource}
        serviceIntervalKms={serviceIntervalKms || undefined}
        serviceIntervalMonths={serviceIntervalMonths || undefined}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
      
      <VehicleOdometerEditor
        key={`odometer-editor-${vehicleId}`}
        vehicleId={vehicleId}
        currentOdometer={currentOdometer}
        baselineKms={baselineKms}
        baselineSource={baselineSource}
        isOpen={isOdometerOpen}
        onClose={() => setIsOdometerOpen(false)}
      />
    </div>
  );
}

function SummaryDetailCompact({ label, value, secondaryText, tone = 'neutral' }: { 
  label: string; 
  value: string; 
  secondaryText?: string;
  tone?: 'neutral' | 'critical';
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className={`h-2 w-2 rounded-full ${
            tone === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-foreground/10'
          }`} />
          <p className="text-sm font-black text-foreground opacity-90 uppercase italic tracking-tight">{value}</p>
        </div>
        {secondaryText && (
          <p className={`text-[10px] font-bold uppercase tracking-widest pl-[1.125rem] ${
            tone === 'critical' ? 'text-red-500/60 dark:text-red-400/50' : 'text-muted'
          }`}>
            {secondaryText}
          </p>
        )}
      </div>
    </div>
  );
}
