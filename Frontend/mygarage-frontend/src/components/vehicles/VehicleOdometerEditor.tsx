'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Save, Gauge, ArrowRight, Loader2 } from 'lucide-react';
import { updateVehicle } from '@/lib/api';
import { formatNumber } from '@/lib/date-utils';
import { usePreferences, KM_TO_MILES } from '@/lib/preferences';

interface VehicleOdometerEditorProps {
  vehicleId: string;
  currentOdometer?: number | null;
  baselineKms?: number | null;
  baselineSource?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleOdometerEditor({
  vehicleId,
  currentOdometer,
  baselineKms,
  baselineSource,
  isOpen,
  onClose
}: VehicleOdometerEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { preferences, formatDistance, getUnitLabel, getDistanceValue } = usePreferences();

  // Mode state
  const [entryMode, setEntryMode] = useState<'direct' | 'add'>('direct');
  
  // Direct entry state
  const [directValue, setDirectValue] = useState("");
  
  // Add distance state
  const [baseSource, setBaseSource] = useState<'current' | 'last_main'>('current');
  const [travelledAmount, setTravelledAmount] = useState("");

  const wasOpen = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state with props and reset whenever the modal opens
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const displayVal = getDistanceValue(currentOdometer);
      setDirectValue(displayVal?.toString() ?? "");
      setTravelledAmount("");
      setEntryMode('direct');
      setBaseSource('current');
      setError(null);

      // Focus main input on open
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      wasOpen.current = true;
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      wasOpen.current = false;
    }
  }, [isOpen, currentOdometer, getDistanceValue]);

  if (!mounted) return null;

  const hasMainBaseline = baselineSource === 'main_service' && baselineKms != null;
  const currentDisplayVal = getDistanceValue(currentOdometer) || 0;
  const lastMainDisplayVal = getDistanceValue(baselineKms) || 0;

  // Compute final resulting odometer
  const getFinalOdometer = () => {
    if (entryMode === 'direct') {
      return parseInt(directValue) || 0;
    } else {
      const base = baseSource === 'current' ? currentDisplayVal : lastMainDisplayVal;
      const added = parseInt(travelledAmount) || 0;
      return base + added;
    }
  };

  const finalValue = getFinalOdometer();

  const handleSave = async () => {
    setError(null);
    
    let parsed = finalValue;
    if (preferences.distanceUnit === 'miles') {
      parsed = Math.round(parsed / KM_TO_MILES);
    }

    const data = {
      currentOdometer: parsed === 0 && entryMode === 'direct' && directValue === "" ? null : parsed,
    };

    try {
      await updateVehicle(vehicleId, data as any);
      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update odometer');
    }
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="flex items-center justify-between border-b border-border-subtle p-6">
          <h3 className="text-xl font-black italic tracking-tight text-foreground uppercase">Update {getUnitLabel()}</h3>
          <button 
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-muted opacity-40 hover:bg-foreground/10 hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-[11px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Mode Selector */}
          <div className="flex p-1 rounded-2xl bg-foreground/[0.03] border border-border-subtle">
            <button
              onClick={() => setEntryMode('direct')}
              className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'direct' ? 'bg-surface text-foreground shadow-sm' : 'text-muted opacity-40 hover:text-foreground'}`}
            >
              Direct Entry
            </button>
            <button
              onClick={() => {
                setEntryMode('add');
                setTimeout(() => addInputRef.current?.focus(), 10);
              }}
              className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'add' ? 'bg-surface text-foreground shadow-sm' : 'text-muted opacity-40 hover:text-foreground'}`}
            >
              Add Distance
            </button>
          </div>

          <div className="min-h-[160px] space-y-6">
            {entryMode === 'direct' ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-2 px-1">
                  <div className="text-muted opacity-40"><Gauge size={14} /></div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-60">Full Odometer Value ({getUnitLabel()})</label>
                </div>
                <input
                  ref={inputRef}
                  type="number"
                  value={directValue}
                  onChange={(e) => setDirectValue(e.target.value)}
                  placeholder={`e.g. ${preferences.distanceUnit === 'miles' ? '28000' : '45000'}`}
                  className="h-16 w-full rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-2xl font-black italic tracking-tight text-foreground placeholder:text-muted/10 focus:border-border-strong focus:bg-foreground/[0.04] focus:outline-none transition-all"
                />
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted opacity-40 px-1">Select Baseline</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBaseSource('current')}
                      className={`h-11 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${baseSource === 'current' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-card-overlay border-border-subtle text-muted opacity-40 hover:bg-foreground/5'}`}
                    >
                      Current ({formatNumber(currentDisplayVal)})
                    </button>
                    <button
                      disabled={!hasMainBaseline}
                      onClick={() => setBaseSource('last_main')}
                      className={`h-11 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${!hasMainBaseline ? 'opacity-20 grayscale' : baseSource === 'last_main' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-card-overlay border-border-subtle text-muted opacity-40 hover:bg-foreground/5'}`}
                    >
                      Last Main ({formatNumber(lastMainDisplayVal)})
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 px-1">
                    <div className="text-blue-500 opacity-40"><ArrowRight size={14} /></div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60 dark:text-blue-400/60">Distance Travelled ({getUnitLabel()})</label>
                  </div>
                  <div className="relative">
                    <input
                      ref={addInputRef}
                      type="number"
                      value={travelledAmount}
                      onChange={(e) => setTravelledAmount(e.target.value)}
                      placeholder="e.g. 1459"
                      className="h-14 w-full rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] px-6 text-xl font-black italic tracking-tight text-blue-600 dark:text-blue-400 placeholder:text-blue-500/20 focus:border-blue-500/40 focus:outline-none transition-all"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/40">+ {getUnitLabel()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Computed Preview */}
          <div className="flex flex-col items-center justify-center gap-2 py-4 border-y border-border-subtle bg-foreground/[0.01]">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted opacity-40">New Odometer Result</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic tracking-tighter text-foreground">{formatNumber(finalValue)}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40">{getUnitLabel()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-border-subtle bg-card-overlay text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:bg-card-overlay-hover hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex-[2] flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  <Save size={16} strokeWidth={3} />
                  Update Odometer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
