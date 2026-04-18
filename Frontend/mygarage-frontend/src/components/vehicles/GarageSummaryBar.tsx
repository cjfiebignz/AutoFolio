'use client';

import { useState, useMemo } from 'react';
import { UserVehicle } from "@/types/autofolio";
import { evaluateVehicleAttention, AttentionItem } from "@/lib/attention-utils";
import { mapToVehicleViewModel } from "@/lib/mappers/vehicle";
import { mapToRemindersViewModel } from "@/lib/mappers/reminder";
import { mapToDocumentsViewModel } from "@/lib/mappers/document";
import { mapToServiceSummaryViewModel } from "@/lib/mappers/service";
import { AlertCircle, AlertTriangle, Bell, ChevronRight, Zap, Loader2, Gauge, Flame, X, ChevronDown, Check } from "lucide-react";
import { GarageAlertsModal } from "./GarageAlertsModal";
import { isMaintenanceAcknowledged } from '@/lib/maintenance-ack-utils';
import { getDailyVehicleStreak, updateVehicleOdometer } from '@/lib/api';
import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { DailyVehicleStreak } from '@/types/autofolio';
import { GarageCalendarTrigger } from './GarageCalendarTrigger';
import { usePreferences } from '@/lib/preferences';

interface GarageSummaryBarProps {
  vehicles: UserVehicle[];
}

export function GarageSummaryBar({ vehicles }: GarageSummaryBarProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  // Streak state
  const [streakData, setStreakData] = useState<DailyVehicleStreak | null>(null);
  const [isStreakLoading, setIsStreakLoading] = useState(true);

  // Trace and reduce duplicate fetches
  const lastFetchedUserId = useRef<string | null>(null);

  // Track dismissals locally to trigger re-renders without full page refresh
  const [dismissalCount, setDismissalCount] = useState(0);

  const fetchStreak = async (force = false) => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Prevent duplicate back-to-back fetches on same userId unless forced
    if (!force && lastFetchedUserId.current === userId && streakData) {
      return;
    }

    try {
      setIsStreakLoading(true);
      const data = await getDailyVehicleStreak(userId);
      setStreakData(data);
      lastFetchedUserId.current = userId;
    } catch (err) {
      console.error("[GarageSummaryBar] Failed to fetch streak:", err);
    } finally {
      setIsStreakLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStreak();
  }, [session?.user?.id]);

  // Re-fetch only if vehicles length changes (new/deleted vehicle) 
  // or if a new daily vehicle is assigned
  const dailyVehicleIdFromProps = useMemo(() => vehicles.find(v => v.isDaily)?.id, [vehicles]);
  
  useEffect(() => {
    if (mounted && session?.user?.id) {
        fetchStreak(true);
    }
  }, [vehicles.length, dailyVehicleIdFromProps]);

  // Daily vehicle context
  const dailyVehicleId = streakData?.dailyVehicleId || dailyVehicleIdFromProps;
  const dailyVehicleNickname = streakData?.dailyVehicleNickname || vehicles.find(v => v.id === dailyVehicleId)?.nickname || 'Daily Vehicle';
  
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

  const criticalCount = activeAlerts.filter(i => i.severity === 'critical').length;
  const warningCount = activeAlerts.filter(i => i.severity === 'warning').length;
  const vehiclesWithAlerts = new Set(activeAlerts.map(i => i.vehicleName)).size;

  const handleModalClose = () => {
    setIsModalOpen(false);
    setDismissalCount(prev => prev + 1);
  };

  return (
    <>
      <div className="mb-8 space-y-6">
        {/* ROW 1: Streak | Update Odometer */}
        <div className="flex items-center justify-between px-1">
          {/* Streak Surface */}
          <div className={`flex h-10 px-4 items-center gap-2.5 rounded-2xl border transition-all duration-500 ${
            !hasDailyVehicle 
              ? 'bg-foreground/[0.02] border-border-subtle opacity-40' 
              : isFulfilledToday
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
          }`}>
            <Flame size={16} className={isFulfilledToday ? 'fill-current' : 'fill-current animate-pulse'} />
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Streak</span>
              <span className="text-sm font-black italic tracking-tighter leading-none">
                {isStreakLoading && !streakData ? '...' : (streakData?.currentStreak ?? 0)}
              </span>
            </div>
            {mounted && hasDailyVehicle && (
              <div className="ml-1 flex flex-col -space-y-1 items-start hidden sm:flex">
                <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Status</span>
                <span className="text-[9px] font-bold truncate max-w-[80px] uppercase">
                  {isFulfilledToday ? 'Fulfilled' : 'Due Today'}
                </span>
              </div>
            )}
          </div>

          {/* Update Odometer Button (Persistent action for any vehicle) */}
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

        {/* ROW 2: Vehicle Count | Calendar */}
        <div className="flex items-center justify-between border-t border-border-subtle pt-6 px-1">
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
            <GarageCalendarTrigger vehicles={vehicles} />
          </div>
        </div>

        {/* Main Insight Bar (Existing Alerts) */}
        {activeAlerts.length > 0 && (
          <div className="overflow-hidden rounded-[28px] border border-subtle bg-card-overlay p-1 shadow-2xl backdrop-blur-sm transition-colors duration-300 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-6 py-4">
              <div className="flex -space-x-2">
                {criticalCount > 0 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-500 ring-4 ring-background z-20">
                    <AlertCircle size={18} strokeWidth={2.5} />
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 ring-4 ring-background z-10">
                    <AlertTriangle size={18} strokeWidth={2.5} />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-0.5">
                <p className="text-xs font-black uppercase tracking-widest text-foreground opacity-80 italic leading-none">
                  {criticalCount > 0 
                    ? `${criticalCount} Critical Action${criticalCount > 1 ? 's' : ''} Pending` 
                    : `${warningCount} Attention Item${warningCount > 1 ? 's' : ''} Identified`}
                </p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Summarized across {vehiclesWithAlerts} {vehiclesWithAlerts === 1 ? 'vehicle' : 'vehicles'}
                </p>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-3 rounded-2xl bg-foreground/[0.03] pl-4 pr-3 py-2 border border-subtle transition-all hover:bg-foreground/[0.05] hover:border-border-strong active:scale-95 shadow-lg"
              >
                <Bell size={12} className="text-muted group-hover:text-foreground transition-colors" />
                <span className="text-[10px] font-black text-muted group-hover:text-foreground uppercase tracking-tighter transition-colors">
                  {activeAlerts.length} Garage Alerts
                </span>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/5 text-muted group-hover:bg-foreground/10 group-hover:text-foreground transition-all">
                  <ChevronRight size={12} strokeWidth={3} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <GarageAlertsModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        alerts={activeAlerts} 
      />

      {isUpdateModalOpen && vehicles.length > 0 && (
        <OdometerUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          vehicles={vehicles}
          initialVehicleId={dailyVehicleId || vehicles[0].id}
          onSuccess={() => {
            fetchStreak(true);
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
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [odometer, setOdometer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { formatDistance } = usePreferences();
  const selectorRef = useRef<HTMLDivElement>(null);

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId), 
    [vehicles, selectedVehicleId]
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odometer || isSubmitting || !selectedVehicleId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateVehicleOdometer(selectedVehicleId, parseInt(odometer, 10));
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
              <h4 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Update Vehicle</h4>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">New Odometer Reading</label>
                <input 
                  autoFocus
                  type="number"
                  placeholder="Enter kms..."
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/[0.03] p-5 text-2xl font-black italic tracking-tighter text-foreground placeholder:text-muted/20 focus:border-blue-500/50 focus:bg-foreground/[0.05] focus:outline-none transition-all"
                />
              </div>

              {selectedVehicle?.isDaily && (
                <p className="text-[9px] font-medium text-blue-500/60 text-center italic">
                  Note: Updating your Daily vehicle fulfills your streak for today.
                </p>
              )}

              {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">{error}</p>}

              <button
                type="submit"
                disabled={!odometer || isSubmitting}
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
