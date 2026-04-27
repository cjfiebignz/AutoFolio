'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Save, Gauge, Calendar, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { updateVehicle } from '@/lib/api';
import { usePreferences, KM_TO_MILES } from '@/lib/preferences';
import { useActionConfirm } from '@/lib/use-action-confirm';

interface VehicleServiceSettingsEditorProps {
  vehicleId: string;
  currentOdometer?: number | null;
  baselineKms?: number | null;
  baselineSource?: string | null;
  serviceIntervalKms?: number | null;
  serviceIntervalMonths?: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleServiceSettingsEditor({
  vehicleId,
  currentOdometer,
  baselineKms,
  baselineSource,
  serviceIntervalKms,
  serviceIntervalMonths,
  isOpen,
  onClose
}: VehicleServiceSettingsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { preferences, getDistanceValue, getUnitLabel, formatDistance } = usePreferences();

  // Odometer Warning Confirmation
  const {
    confirmState: showBackwardsConfirm,
    enterConfirm: enterBackwardsConfirm,
    cancelConfirm: cancelBackwardsConfirm
  } = useActionConfirm();

  const [odometer, setOdometer] = useState("");
  const [intervalKms, setIntervalKms] = useState("");
  const [intervalMonths, setIntervalMonths] = useState(serviceIntervalMonths?.toString() ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOdometer(getDistanceValue(currentOdometer)?.toString() ?? "");
      setIntervalKms(getDistanceValue(serviceIntervalKms)?.toString() ?? "");
      setIntervalMonths(serviceIntervalMonths?.toString() ?? "");
      setError(null);
      cancelBackwardsConfirm();
    }
  }, [isOpen, currentOdometer, serviceIntervalKms, serviceIntervalMonths, getDistanceValue]);

  if (!mounted) return null;

  const parseOrNull = (val: string) => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    
    let odometerValue = parseOrNull(odometer);
    let intervalKmsValue = parseOrNull(intervalKms);

    if (preferences.measurementSystem === 'imperial') {
      if (odometerValue !== null) odometerValue = Math.round(odometerValue / KM_TO_MILES);
      if (intervalKmsValue !== null) intervalKmsValue = Math.round(intervalKmsValue / KM_TO_MILES);
    }

    // Backwards Check
    const currentKmsValue = currentOdometer || 0;
    const isMainServiceBaseline = baselineSource === 'main_service';

    // 1. BLOCK: Below main service baseline (Priority)
    if (isMainServiceBaseline && baselineKms !== null && baselineKms !== undefined && odometerValue !== null && odometerValue < baselineKms) {
      cancelBackwardsConfirm();
      setError(`Cannot set odometer below the latest main service record. To correct this, edit the service log directly.`);
      return;
    }

    // 2. WARN: General backwards correction
    if (currentOdometer !== undefined && currentOdometer !== null && odometerValue !== null && odometerValue < currentKmsValue && !showBackwardsConfirm) {
      setError(null);
      enterBackwardsConfirm();
      return;
    }

    const data = {
      currentOdometer: odometerValue,
      serviceIntervalKms: intervalKmsValue,
      serviceIntervalMonths: parseOrNull(intervalMonths),
    };

    try {
      await updateVehicle(vehicleId, data as any);
      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
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
      <div className={`relative w-full max-w-lg overflow-hidden rounded-[32px] border border-border-strong bg-surface shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="flex items-center justify-between border-b border-border-subtle p-6">
          <h3 className="text-xl font-black italic tracking-tight text-foreground uppercase">Service Settings</h3>
          <button 
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-muted opacity-40 hover:bg-foreground/10 hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-[11px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 italic leading-relaxed">
              <div className="flex items-start gap-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <InputField 
              label={`Current Odometer (${getUnitLabel()})`} 
              icon={<Gauge size={14} />} 
              value={odometer}
              onChange={(val) => {
                setOdometer(val);
                setError(null);
                if (showBackwardsConfirm) cancelBackwardsConfirm();
              }}
              placeholder={`e.g. ${preferences.measurementSystem === 'imperial' ? '28000' : '45000'}`}
            />
            
            <InputField 
              label={`Service Interval (${getUnitLabel()})`} 
              icon={<RefreshCw size={14} />} 
              value={intervalKms}
              onChange={(val) => {
                setIntervalKms(val);
                setError(null);
              }}
              placeholder={`e.g. ${preferences.measurementSystem === 'imperial' ? '6000' : '10000'}`}
            />

            <InputField 
              label="Service Interval (Months)" 
              icon={<Calendar size={14} />} 
              value={intervalMonths}
              onChange={(val) => {
                setIntervalMonths(val);
                setError(null);
              }}
              placeholder="e.g. 12"
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
                      onClick={() => handleSave()}
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

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-border-subtle bg-card-overlay text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:bg-card-overlay-hover hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isPending || (!!error && !showBackwardsConfirm)}
              className="flex-[2] flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  <Save size={16} strokeWidth={3} />
                  Save Settings
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

function InputField({ 
  label, 
  icon, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  icon: React.ReactNode; 
  value: string; 
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="text-muted opacity-40">{icon}</div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-60">{label}</label>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-16 w-full rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-xl font-black italic tracking-tight text-foreground placeholder:text-muted/10 focus:border-border-strong focus:bg-foreground/[0.04] focus:outline-none transition-all"
      />
    </div>
  );
}
