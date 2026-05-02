'use client';

import { useState, useMemo } from 'react';
import { UserVehicle } from "@/types/autofolio";
import { evaluateVehicleAttention, AttentionItem } from "@/lib/attention-utils";
import { mapToVehicleViewModel } from "@/lib/mappers/vehicle";
import { mapToRemindersViewModel } from "@/lib/mappers/reminder";
import { mapToDocumentsViewModel } from "@/lib/mappers/document";
import { mapToServiceSummaryViewModel } from "@/lib/mappers/service";
import { AlertCircle, AlertTriangle, Bell, ChevronRight, Zap, Loader2, Gauge, Flame, X, ChevronDown, Check, Wrench, Info, MinusCircle } from "lucide-react";
import { GarageAlertsModal } from "./GarageAlertsModal";
import { isMaintenanceAcknowledged } from '@/lib/maintenance-ack-utils';
import { getDailyVehicleStreak, recordDailyOdometerUpdate } from '@/lib/api';
import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DailyVehicleStreak } from '@/types/autofolio';
import { GarageCalendarTrigger } from './GarageCalendarTrigger';
import { usePreferences } from '@/lib/preferences';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { DueReminders } from './DueReminders';

interface GarageSummaryBarProps {
  vehicles: UserVehicle[];
  effectiveNow?: string;
}

export function GarageSummaryBar({ vehicles, effectiveNow }: GarageSummaryBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  // Intelligence state
  const [streakData, setStreakData] = useState<DailyVehicleStreak | null>(null);
  const [isStreakLoading, setIsStreakLoading] = useState(true);
  const [reminderCount, setReminderCount] = useState(0);
  const [maxSeverity, setMaxSeverity] = useState<'overdue' | 'due_now' | 'due_soon' | null>(null);

  // Trace and reduce duplicate fetches
  const lastFetchedUserId = useRef<string | null>(null);
  const lastFetchedParams = useRef<string>('');

  // Track dismissals locally to trigger re-renders without full page refresh
  const [dismissalCount, setDismissalCount] = useState(0);

  const fetchStreak = async (force = false) => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Daily vehicle context for param tracking
    const dailyVehicleIdFromProps = vehicles.find(v => v.isDaily)?.id;
    const currentParams = `${vehicles.length}-${dailyVehicleIdFromProps || ''}`;

    // Prevent duplicate back-to-back fetches on same userId + params unless forced
    if (!force && lastFetchedUserId.current === userId && lastFetchedParams.current === currentParams && streakData) {
      return;
    }

    try {
      setIsStreakLoading(true);
      const data = await getDailyVehicleStreak(userId);
      setStreakData(data);
      lastFetchedUserId.current = userId;
      lastFetchedParams.current = currentParams;
    } catch (err) {
      console.error("[GarageSummaryBar] Failed to fetch streak:", err);
    } finally {
      setIsStreakLoading(false);
    }
  };

  const dailyVehicleIdFromProps = useMemo(() => vehicles.find(v => v.isDaily)?.id, [vehicles]);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      // Initial fetch handled here
      if (session?.user?.id) {
        fetchStreak();
      }
      return;
    }

    // Subsequent updates if dependencies change
    if (session?.user?.id) {
        fetchStreak(true);
    }
  }, [session?.user?.id, vehicles.length, dailyVehicleIdFromProps]);

  // Daily vehicle context
  const dailyVehicleId = streakData?.dailyVehicleId || dailyVehicleIdFromProps;
  
  const hasDailyVehicle = !!dailyVehicleId;
  const isFulfilledToday = !!streakData?.updatedToday;

  // Aggregate and filter alerts
  const activeAlerts = useMemo(() => {
    const alerts: (AttentionItem & { vehicleName: string; vehicleId: string; status: string })[] = [];
    
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

      // Filter for only critical and warning items
      items.filter(i => i.severity === 'critical' || i.severity === 'warning').forEach(item => {
        // Hydration-safe persistent filter
        const status = serviceSummary?.status || 'unknown';
        if (!mounted || !isMaintenanceAcknowledged(vehicle.id, item.key, status)) {
          alerts.push({
            ...item,
            vehicleName: vehicle.nickname,
            vehicleId: vehicle.id,
            status
          });
        }
      });
    });

    return alerts;
  }, [vehicles, mounted, dismissalCount]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setDismissalCount(prev => prev + 1);
  };

  return (
    <>
      <div className="mb-8 space-y-6">
        {/* ROW 1: Vehicle Count | Calendar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-overlay border border-border-subtle shadow-xl">
              <span className="text-xl font-black text-foreground opacity-90">
                {vehicles.length}
              </span>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-dim leading-tight">
                Vehicles Active
              </p>
              <p className="text-[10px] font-bold text-muted opacity-60 leading-tight">
                Across your garage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-dim hidden sm:block">Garage Pipeline</span>
            <GarageCalendarTrigger vehicles={vehicles} effectiveNow={streakData?.effectiveNow} />
          </div>
        </div>

        {/* Garage Overview Entry (Expandable) */}
        <div 
          className={`group overflow-hidden rounded-[28px] border transition-all duration-500 shadow-2xl backdrop-blur-sm ${
            isExpanded 
              ? 'border-border-strong bg-card-overlay-hover ring-1 ring-inset ring-white/5' 
              : 'border-border-subtle bg-card-overlay hover:bg-card-overlay-hover hover:border-border-strong'
          }`}
        >
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex cursor-pointer flex-col sm:flex-row items-center gap-4 sm:gap-6 px-6 py-4"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all border border-border-subtle ${
              isExpanded ? 'bg-foreground text-background shadow-xl' : 'bg-foreground/5 text-muted group-hover:bg-foreground/10 group-hover:text-foreground'
            }`}>
              <Bell size={24} strokeWidth={1.5} className={isExpanded ? 'animate-in zoom-in-50 duration-500' : ''} />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-0.5">
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground italic leading-none">
                  Garage Overview
                </h4>
                {(activeAlerts.length > 0 || reminderCount > 0) && !isExpanded && (() => {
                  const total = activeAlerts.length + reminderCount;
                  const hasCritical = activeAlerts.some(a => a.severity === 'critical') || maxSeverity === 'overdue';
                  const hasWarning = activeAlerts.some(a => a.severity === 'warning') || maxSeverity === 'due_now';
                  
                  let badgeStyles = "bg-blue-500/10 text-blue-500 ring-1 ring-inset ring-blue-500/20";
                  if (hasCritical) badgeStyles = "bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.2)]";
                  else if (hasWarning) badgeStyles = "bg-orange-500/10 text-orange-500 ring-1 ring-inset ring-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.2)]";

                  return (
                    <div className={`mx-auto sm:mx-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full animate-in fade-in zoom-in-95 ${badgeStyles}`}>
                      <div className={`h-1 w-1 rounded-full bg-current ${hasCritical || hasWarning ? 'animate-pulse' : ''}`} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">
                        {total} item{total === 1 ? '' : 's'} need attention
                      </span>
                    </div>
                  );
                })()}
              </div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Review vehicle health, upcoming dates, and next actions.
              </p>
            </div>

            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted transition-all ${
              isExpanded ? 'rotate-180 bg-foreground text-background' : 'group-hover:bg-foreground/10 group-hover:text-foreground'
            }`}>
              <ChevronDown size={16} strokeWidth={3} />
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="border-t border-border-subtle bg-foreground/[0.01] p-6 space-y-8 animate-in slide-in-from-top-4 duration-500">
              {/* Reminders Section */}
              <div className="space-y-4">
                <DueReminders 
                  compact={true} 
                  onUpdate={(count, severity) => {
                    setReminderCount(count);
                    setMaxSeverity(severity);
                  }}
                />
              </div>

              {/* Alerts Link */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-border-subtle hover:bg-foreground/10 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="text-muted" />
                  <div>
                    <p className="text-xs font-bold text-foreground opacity-80 uppercase tracking-widest">Advanced Health Report</p>
                    <p className="text-[10px] font-medium text-muted italic">Check maintenance cycles, document expiries and critical alerts.</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted opacity-40" />
              </button>
            </div>
          )}
        </div>

        {/* ROW 2: Streak & Savers | Update Odometer */}
        <div className="flex flex-wrap items-center justify-between border-t border-border-subtle pt-6 px-1 gap-y-4">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Streak Pill */}
            <div className={`flex h-10 px-4 items-center gap-2.5 rounded-2xl border transition-all duration-500 ${
              !hasDailyVehicle 
                ? 'bg-foreground/[0.02] border-border-subtle opacity-40' 
                : isFulfilledToday
                  ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
            }`}>
              <Flame size={16} className={isFulfilledToday ? 'fill-current' : 'fill-current animate-pulse'} />
              
              <div className="flex flex-col -space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">STREAK</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black italic tracking-tighter leading-none">
                    {isStreakLoading && !streakData ? '...' : (streakData?.currentStreak ?? 0)}
                  </span>
                  {mounted && hasDailyVehicle && (
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 leading-none px-1.5 py-0.5 rounded-md border border-current/20 bg-current/5">
                      {isFulfilledToday ? 'SECURED' : 'UPDATE TODAY'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Streak Savers (Spanners) */}
            {mounted && hasDailyVehicle && (
              <div className="group/savers relative flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5 px-0.5">
                  {[...Array(streakData?.maxStreakSavers || 3)].map((_, i) => {
                    const isAvailable = i < (streakData?.streakSavers || 0);
                    return (
                      <div 
                        key={i} 
                        className={`transition-all duration-500 ${
                          isAvailable 
                            ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] opacity-100' 
                            : 'text-muted opacity-20'
                        }`}
                      >
                        <Wrench size={12} strokeWidth={3} className={isAvailable ? 'fill-current' : ''} />
                      </div>
                    );
                  })}
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest text-muted opacity-40 leading-none px-0.5 whitespace-nowrap">
                  {streakData?.streakSavers === streakData?.maxStreakSavers 
                    ? 'MAX SAVERS' 
                    : `${streakData?.saverProgressDays || 0}/${streakData?.saverProgressTarget || 5} TO NEXT`}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-0 mb-3 w-48 rounded-xl bg-surface border border-border-strong p-3 shadow-2xl opacity-0 pointer-events-none group-hover/savers:opacity-100 transition-opacity z-50">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2 text-blue-500">
                      <Info size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Streak Saver Charges</span>
                    </div>
                    <p className="text-[10px] font-medium text-muted leading-relaxed italic">
                      Updates are midnight-to-midnight. Miss a day and a spanner protects your streak. Earn a new spanner every 5 days.
                    </p>
                  </div>
                  <div className="absolute top-full left-6 w-2 h-2 bg-surface border-r border-b border-border-strong rotate-45 -translate-y-1" />
                </div>
              </div>
            )}
          </div>

          {/* Update Odometer Button */}
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            disabled={vehicles.length === 0}
            className={`group flex h-10 items-center gap-2.5 rounded-2xl border px-4 transition-all active:scale-95 shadow-premium ${
              vehicles.length === 0
                ? 'bg-foreground/[0.02] border-border-subtle text-muted opacity-30 cursor-not-allowed'
                : 'bg-foreground border-foreground text-background hover:opacity-90'
            }`}
          >
            <Zap size={14} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Update Odometer
            </span>
          </button>
        </div>
      </div>

      <GarageAlertsModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        vehicles={vehicles}
      />

      {isUpdateModalOpen && vehicles.length > 0 && (
        <OdometerUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          vehicles={vehicles}
          initialVehicleId={dailyVehicleId || vehicles[0].id}
          onSuccess={() => {
            fetchStreak(true);
            window.dispatchEvent(new Event('odometer-updated'));
            router.refresh();
            setIsUpdateModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function OdometerUpdateModal({ 
  isOpen, 
  onClose, 
  vehicles,
  initialVehicleId,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  vehicles: UserVehicle[];
  initialVehicleId: string;
  onSuccess: () => void;
}) {
  const { data: session } = useSession();
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [odometer, setOdometer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { formatDistance } = usePreferences();
  const selectorRef = useRef<HTMLDivElement>(null);

  // Odometer Warning Confirmation
  const {
    confirmState: showBackwardsConfirm,
    enterConfirm: enterBackwardsConfirm,
    cancelConfirm: cancelBackwardsConfirm
  } = useActionConfirm();

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId), 
    [vehicles, selectedVehicleId]
  );

  // Reset validation state on open or vehicle change
  useEffect(() => {
    if (isOpen) {
      setError(null);
      cancelBackwardsConfirm();
    }
  }, [isOpen, selectedVehicleId]);

  // Close selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e?: React.FormEvent, mode: 'odometer' | 'no_change' = 'odometer') => {
    if (e) e.preventDefault();
    
    const userId = session?.user?.id;
    if (!userId || isSubmitting || !selectedVehicleId) return;

    if (mode === 'odometer') {
      if (!odometer) return;
      const newValue = parseInt(odometer, 10);
      const currentValue = selectedVehicle?.currentOdometer;
      const baselineKms = selectedVehicle?.serviceSummary?.baselineKms;
      const isMainServiceBaseline = selectedVehicle?.serviceSummary?.baselineSource === 'main_service';

      // 1. BLOCK: Below main service baseline (Priority)
      if (isMainServiceBaseline && baselineKms !== null && baselineKms !== undefined && newValue < baselineKms) {
        cancelBackwardsConfirm();
        setError(`Cannot set odometer below the latest main service record. To correct this, edit the service log directly.`);
        return;
      }

      // 2. WARN: General backwards correction
      if (currentValue !== undefined && currentValue !== null && newValue < currentValue && !showBackwardsConfirm) {
        setError(null);
        enterBackwardsConfirm();
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const odometerValue = mode === 'odometer' ? parseInt(odometer, 10) : null;
      const noChange = mode === 'no_change';
      await recordDailyOdometerUpdate(userId, selectedVehicleId, odometerValue, noChange);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update odometer");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-t-[40px] sm:rounded-[40px] border border-border-strong bg-surface shadow-premium flex flex-col animate-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 space-y-6">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-500">
                <Gauge size={16} strokeWidth={2.5} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Odometer Control</h3>
              </div>
              <h4 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Daily Check-in</h4>
            </div>
            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-card-overlay text-muted hover:text-foreground transition-all">
              <X size={20} />
            </button>
          </header>

          <div className="space-y-6">
            {/* Custom Vehicle Selector */}
            <div className="space-y-2" ref={selectorRef}>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Select Vehicle</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                  className={`flex w-full items-center justify-between rounded-2xl border bg-foreground/[0.03] p-4 text-sm font-bold text-foreground transition-all ${
                    isSelectorOpen ? 'border-border-strong bg-foreground/[0.05]' : 'border-border-subtle hover:bg-foreground/[0.05]'
                  }`}
                >
                  <span className="truncate">
                    {selectedVehicle?.nickname || `${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model}`}
                    {selectedVehicle?.isDaily && <span className="ml-2 text-[10px] text-blue-500 opacity-60 italic">(Daily)</span>}
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSelectorOpen && (
                  <div className="absolute top-full left-0 z-[120] mt-2 w-full overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-premium animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 no-scrollbar">
                      {vehicles.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            setIsSelectorOpen(false);
                            setOdometer('');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                            selectedVehicleId === v.id 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'text-foreground hover:bg-foreground/[0.05]'
                          }`}
                        >
                          <span className="truncate">
                            {v.nickname || `${v.year} ${v.make} ${v.model}`}
                          </span>
                          {selectedVehicleId === v.id ? (
                            <Check size={14} strokeWidth={3} />
                          ) : v.isDaily ? (
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 opacity-40 italic">Daily</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Odometer Reference */}
            <div className="rounded-2xl border border-border-subtle bg-foreground/[0.02] p-4 flex items-center justify-between transition-colors">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted opacity-40">Recorded Odometer</p>
                <p className="text-sm font-bold text-foreground opacity-60 italic">
                  {selectedVehicle?.currentOdometer !== undefined && selectedVehicle?.currentOdometer !== null 
                    ? formatDistance(selectedVehicle.currentOdometer) 
                    : "No history recorded yet"}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-foreground/[0.03] flex items-center justify-center">
                <Gauge size={14} className="text-muted opacity-20" />
              </div>
            </div>

            <form onSubmit={(e) => handleSubmit(e, 'odometer')} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">New Odometer Reading</label>
                <input 
                  autoFocus
                  type="number"
                  placeholder="Enter kms..."
                  value={odometer}
                  onChange={(e) => {
                    setOdometer(e.target.value);
                    setError(null);
                    if (showBackwardsConfirm) cancelBackwardsConfirm();
                  }}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/[0.03] p-5 text-2xl font-black italic tracking-tighter text-foreground placeholder:text-muted/20 focus:border-blue-500/50 focus:bg-foreground/[0.05] focus:outline-none transition-all"
                />
              </div>

              {showBackwardsConfirm && (
                <div className="rounded-[24px] border border-orange-500/20 bg-orange-500/5 p-6 animate-in zoom-in-95 duration-300 shadow-premium">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                      <AlertCircle size={20} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Odometer going backwards?</h4>
                        <p className="text-[11px] font-medium text-muted leading-relaxed italic">
                          This odometer reading is lower than the current recorded value. This may affect service due calculations and mileage history. Are you sure?
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSubmit(undefined, 'odometer')}
                          className="flex-1 h-10 rounded-xl bg-orange-600 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500 active:scale-95 shadow-lg"
                        >
                          Confirm & Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelBackwardsConfirm}
                          className="flex-1 h-10 rounded-xl bg-card-overlay border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:bg-card-overlay-hover active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Change Section */}
              {!showBackwardsConfirm && (
                <div className="rounded-[24px] border border-border-subtle bg-foreground/[0.01] p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MinusCircle size={18} className="text-muted opacity-40 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-tight text-foreground">No Change Today</p>
                      <p className="text-[10px] font-medium text-muted leading-relaxed italic">
                        Vehicle not used today? Keep your streak without changing the odometer.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmit(undefined, 'no_change')}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-foreground/5 border border-border-subtle text-[9px] font-black uppercase tracking-widest text-muted hover:bg-foreground/10 hover:text-foreground transition-all active:scale-95 disabled:opacity-50"
                  >
                    Record No Change
                  </button>
                </div>
              )}

              {selectedVehicle?.isDaily && (
                <p className="text-[9px] font-medium text-blue-500/60 text-center italic">
                  Note: Record an odometer update or No Change to secure today’s streak.
                </p>
              )}

              {error && (
                <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 animate-in zoom-in-95 duration-300">
                   <div className="flex items-start gap-4 text-center sm:text-left">
                    <div className="mx-auto sm:mx-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                      <AlertCircle size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[11px] font-bold text-red-500 leading-relaxed uppercase tracking-widest italic">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!odometer || isSubmitting || (!!error && !showBackwardsConfirm)}
                className="w-full flex h-16 items-center justify-center rounded-[24px] bg-foreground text-background text-sm font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Record Update"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
