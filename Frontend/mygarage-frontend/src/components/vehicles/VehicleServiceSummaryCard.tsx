'use client';

import { useState } from 'react';
import { ServiceSummary } from "@/types/autofolio";
import { formatNumber, formatDisplayDate } from "@/lib/date-utils";
import { usePreferences } from "@/lib/preferences";
import { Calendar, Gauge, RefreshCw, AlertCircle, CheckCircle2, Settings2, Edit2 } from "lucide-react";
import { VehicleServiceSettingsEditor } from "./VehicleServiceSettingsEditor";
import { VehicleOdometerEditor } from "./VehicleOdometerEditor";

interface VehicleServiceSummaryCardProps {
  vehicleId: string;
  summary: ServiceSummary['serviceSummary'];
}

/**
 * VehicleServiceSummaryCard
 * 
 * Displays a prominent summary of the vehicle's service status.
 * Optimized for hydration stability by maintaining a constant DOM structure
 * and avoiding conditional structural changes between server and client.
 */
export function VehicleServiceSummaryCard({ vehicleId, summary }: VehicleServiceSummaryCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOdometerOpen, setIsOdometerOpen] = useState(false);
  const { formatDistance, getUnitLabel } = usePreferences();

  const {
    currentKms,
    baselineSource,
    baselineDate,
    baselineKms,
    lastServiceDate,
    lastServiceKms,
    serviceIntervalMonths,
    serviceIntervalKms,
    nextServiceDueDate,
    nextServiceDueKms,
    kmsUntilNextService,
    status,
    hasEnoughData
  } = summary;

  const isFallback = baselineSource === 'settings_baseline';

  // State-independent status mapping for deterministic hydration
  const statusColors = {
    overdue: { text: 'text-red-400', icon: 'text-red-500' },
    due_soon: { text: 'text-yellow-400', icon: 'text-yellow-500' },
    up_to_date: { text: 'text-green-500/80', icon: 'text-green-500/60' },
    insufficient_data: { text: 'text-white/20', icon: 'text-white/10' }
  };

  const currentStatusColors = statusColors[status as keyof typeof statusColors] || statusColors.insufficient_data;

  if (!hasEnoughData) {
    return (
      <div className="rounded-[40px] border border-white/5 bg-white/[0.02] p-10 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 rounded-2xl bg-white/5 p-5 text-white/20">
            <AlertCircle size={36} strokeWidth={1.5} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Service Summary Unavailable</h3>
          <p className="max-w-[280px] text-[11px] font-medium leading-relaxed text-white/30 mb-10">
            Add your last service record or set service intervals in vehicle settings to see your maintenance dashboard.
          </p>
          <button 
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="relative z-20 flex h-12 items-center justify-center gap-3 rounded-xl bg-white/5 px-6 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 active:scale-95"
          >
            <Settings2 size={14} />
            Set Service Settings
          </button>
        </div>
        
        <VehicleServiceSettingsEditor 
          key={`settings-editor-empty-${vehicleId}`}
          vehicleId={vehicleId}
          currentOdometer={currentKms}
          serviceIntervalKms={serviceIntervalKms || undefined}
          serviceIntervalMonths={serviceIntervalMonths || undefined}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] shadow-2xl backdrop-blur-md transition-all duration-500 hover:border-white/10">
      {/* Primary Dashboard Area */}
      <div className="grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 border-b border-white/5 bg-white/[0.01]">
        {/* Current Odometer Panel */}
        <div className="p-8 sm:p-10 relative">
          <div className="mb-8 flex items-center justify-between gap-4 h-6">
            <div className="flex shrink-0 items-center gap-2 text-white/20">
              <Gauge size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">Current Odometer</span>
            </div>
          </div>
          
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <h4 className="text-4xl font-black italic tracking-tighter text-white sm:text-5xl min-h-[1.2em] leading-none">
                <span className="inline-flex items-baseline gap-x-2.5 whitespace-nowrap max-w-full overflow-visible">
                  <span>{currentKms !== null ? formatDistance(currentKms, false) : "Not set"}</span>
                  {currentKms !== null && (
                    <span className="text-[14px] sm:text-[18px] font-black not-italic tracking-[0.2em] text-white/20 uppercase">{getUnitLabel()}</span>
                  )}
                </span>
              </h4>
              <div className="h-4" /> {/* Alignment Spacer */}
            </div>
            
            {/* Stable Action Group in Bottom Left */}
            <div className="flex items-center gap-1.5 pt-1">
              <button 
                type="button"
                onClick={() => setIsOdometerOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-95 border border-white/5"
              >
                <Edit2 size={10} />
                Update
              </button>
              <button 
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/20 transition-all hover:bg-white hover:text-black active:scale-90 border border-white/5"
                title="Service Settings"
              >
                <Settings2 size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-2 text-blue-400/40 h-6">
            <RefreshCw size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Next Service Due</span>
          </div>
          
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <h4 className="text-3xl font-black italic tracking-tighter text-blue-400 sm:text-4xl min-h-[1.2em] leading-none">
                <span className="inline-flex items-baseline gap-x-2.5 whitespace-nowrap max-w-full overflow-visible">
                  <span>{nextServiceDueKms !== null ? formatDistance(nextServiceDueKms, false) : "Pending"}</span>
                  {nextServiceDueKms !== null && (
                    <span className="text-[14px] sm:text-[16px] font-black not-italic tracking-[0.2em] text-blue-400/30 uppercase">{getUnitLabel()}</span>
                  )}
                </span>
              </h4>
              <div className="h-4">
                {nextServiceDueKms !== null && kmsUntilNextService !== null ? (
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${kmsUntilNextService <= 0 ? 'text-red-400' : kmsUntilNextService <= 1000 ? 'text-yellow-400' : 'text-blue-400/50'}`}>
                    {kmsUntilNextService <= 0 ? 'Overdue' : (
                      <span className="inline-flex gap-x-1.5 whitespace-nowrap items-center">
                        <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                        <span>{formatDistance(kmsUntilNextService)} REMAINING</span>
                      </span>
                    )}
                  </p>
                ) : null}
              </div>
            </div>
            
            <div className="h-5">
              {nextServiceDueDate ? (
                <div className="flex items-center gap-2.5">
                  <Calendar size={12} className="text-white/20" />
                  <p className="text-sm font-black uppercase tracking-[0.15em] text-white/80">
                    {formatDisplayDate(nextServiceDueDate)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Details Area - Refined Grid & Typography */}
      <div className="grid grid-cols-2 gap-px bg-white/5 lg:grid-cols-4">
        <SummaryDetail 
          label="Last Service" 
          value={lastServiceDate ? formatDisplayDate(lastServiceDate) : "Not recorded"} 
          subValue={lastServiceKms ? formatDistance(lastServiceKms) : undefined}
        />
        <SummaryDetail 
          label="Interval (Time)" 
          value={serviceIntervalMonths ? `${serviceIntervalMonths} Months` : "Not set"} 
        />
        <SummaryDetail 
          label="Interval (Kms)" 
          value={serviceIntervalKms ? formatDistance(serviceIntervalKms) : "Not set"} 
        />
        
        <div className="bg-[#0b0b0c] p-7 lg:p-9 flex flex-col justify-center items-center text-center lg:text-left lg:items-start min-h-[110px]">
           <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 size={14} className={currentStatusColors.icon} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Status</p>
           </div>
           <p className={`text-[17px] font-black italic tracking-tight uppercase leading-tight ${currentStatusColors.text}`}>
             {status.replace(/_/g, ' ')}
           </p>
        </div>
      </div>

      {/* Baseline Attribution Banner */}
      <div className="border-t border-white/5 bg-white/[0.01] px-10 py-3.5 flex items-center justify-between min-h-[44px]">
        <div className="flex items-center gap-3">
          <div className={`h-1.5 w-1.5 rounded-full ${baselineSource === 'main_service' ? 'bg-blue-500' : 'bg-white/20'}`} />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 text-left leading-none">
            {baselineSource === 'main_service' 
              ? 'Based on your latest Main Service' 
              : 'Based on your Service Settings Baseline'}
          </p>
        </div>
        <div className="flex items-center">
          {isFallback && (
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/10 italic">
              No Main Service recorded yet
            </p>
          )}
        </div>
      </div>

      <VehicleServiceSettingsEditor 
        key={`settings-editor-${vehicleId}`}
        vehicleId={vehicleId}
        currentOdometer={currentKms}
        serviceIntervalKms={serviceIntervalKms || undefined}
        serviceIntervalMonths={serviceIntervalMonths || undefined}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
      
      <VehicleOdometerEditor
        key={`odometer-editor-${vehicleId}`}
        vehicleId={vehicleId}
        currentOdometer={currentKms}
        baselineKms={baselineKms}
        baselineSource={baselineSource}
        isOpen={isOdometerOpen}
        onClose={() => setIsOdometerOpen(false)}
      />
    </div>
  );
}

function SummaryDetail({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-[#0b0b0c] p-7 lg:p-9 space-y-2.5 min-h-[110px] flex flex-col justify-center">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">{label}</p>
      <div className="space-y-1.5">
        <p className="text-[15px] font-black italic tracking-tight text-white uppercase leading-tight">{value}</p>
        <div className="h-4"> {/* Stabilized subValue wrapper */}
          {subValue && (
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}
