'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Save, Gauge, Calendar, RefreshCw } from 'lucide-react';
import { updateVehicle } from '@/lib/api';
import { usePreferences, KM_TO_MILES } from '@/lib/preferences';

interface VehicleServiceSettingsEditorProps {
  vehicleId: string;
  currentOdometer?: number | null;
  serviceIntervalKms?: number | null;
  serviceIntervalMonths?: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleServiceSettingsEditor({
  vehicleId,
  currentOdometer,
  serviceIntervalKms,
  serviceIntervalMonths,
  isOpen,
  onClose
}: VehicleServiceSettingsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { preferences, getDistanceValue, getUnitLabel } = usePreferences();

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
    }
  }, [isOpen, currentOdometer, serviceIntervalKms, serviceIntervalMonths, getDistanceValue]);

  if (!mounted) return null;

  const parseOrNull = (val: string) => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    setError(null);
    
    let odometerValue = parseOrNull(odometer);
    let intervalKmsValue = parseOrNull(intervalKms);

    if (preferences.distanceUnit === 'miles') {
      if (odometerValue !== null) odometerValue = Math.round(odometerValue / KM_TO_MILES);
      if (intervalKmsValue !== null) intervalKmsValue = Math.round(intervalKmsValue / KM_TO_MILES);
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
      <div className={`relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0c] shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <h3 className="text-xl font-black italic tracking-tight text-white uppercase">Service Settings</h3>
          <button 
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[11px] font-bold uppercase tracking-widest text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <InputField 
              label={`Current Odometer (${getUnitLabel()})`} 
              icon={<Gauge size={14} />} 
              value={odometer}
              onChange={setOdometer}
              placeholder={`e.g. ${preferences.distanceUnit === 'miles' ? '28000' : '45000'}`}
            />
            
            <InputField 
              label={`Service Interval (${getUnitLabel()})`} 
              icon={<RefreshCw size={14} />} 
              value={intervalKms}
              onChange={setIntervalKms}
              placeholder={`e.g. ${preferences.distanceUnit === 'miles' ? '6000' : '10000'}`}
            />

            <InputField 
              label="Service Interval (Months)" 
              icon={<Calendar size={14} />} 
              value={intervalMonths}
              onChange={setIntervalMonths}
              placeholder="e.g. 12"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex-[2] flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? 'Saving...' : (
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
        <div className="text-white/20">{icon}</div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</label>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-16 w-full rounded-2xl border border-white/5 bg-white/[0.02] px-6 text-xl font-black italic tracking-tight text-white placeholder:text-white/5 focus:border-white/20 focus:bg-white/[0.04] focus:outline-none transition-all"
      />
    </div>
  );
}
