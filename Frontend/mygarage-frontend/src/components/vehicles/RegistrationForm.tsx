'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Save, Globe, Calendar, CreditCard, FileText, Loader2, Landmark, AlertCircle, ChevronDown } from 'lucide-react';
import { createRegistration, updateRegistration } from '@/lib/api';
import { useActionConfirm } from '@/lib/use-action-confirm';

interface RegistrationFormProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  vehicleLicensePlate?: string;
}

export function RegistrationForm({ vehicleId, isOpen, onClose, initialData, vehicleLicensePlate }: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plate Change Confirmation
  const {
    confirmState: showPlateConfirm,
    enterConfirm: enterPlateConfirm,
    cancelConfirm: cancelPlateConfirm
  } = useActionConfirm();

  // Form State
  const [region, setRegion] = useState(initialData?.region || '');
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || 'AU');
  const [regNumber, setRegNumber] = useState(initialData?.regNumber || (initialData ? '' : (vehicleLicensePlate || '')));
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '');
  const [cost, setCost] = useState(initialData?.cost?.toString() || '');
  const [isCurrent, setIsCurrent] = useState(initialData?.isCurrent ?? true);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [durationMonths, setDurationMonths] = useState('');

  // Local helper for duration calculation
  const handleDurationChange = (monthsStr: string) => {
    setDurationMonths(monthsStr);
    const months = parseInt(monthsStr, 10);
    if (months > 0 && months < 120) { // Limit to 10 years max for safety
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      setExpiryDate(date.toISOString().split('T')[0]);
    }
  };

  // Reset form when opening/closing or when initialData changes
  useEffect(() => {
    if (isOpen) {
      setRegion(initialData?.region || '');
      setCountryCode(initialData?.countryCode || 'AU');
      setRegNumber(initialData?.regNumber || (initialData ? '' : (vehicleLicensePlate || '')));
      setExpiryDate(initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '');
      setCost(initialData?.cost?.toString() || '');
      setIsCurrent(initialData?.isCurrent ?? true);
      setNotes(initialData?.notes || '');
      setDurationMonths('');
      setError(null);
      cancelPlateConfirm();
    }
  }, [isOpen, initialData, vehicleLicensePlate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Plate change check (Only relevant if this is or will be the CURRENT registration)
    const isPlateChanging = vehicleLicensePlate && regNumber && regNumber !== vehicleLicensePlate;
    const isPlateAdded = !vehicleLicensePlate && regNumber;
    const isPlateRemoved = vehicleLicensePlate && !regNumber;

    if (isCurrent && (isPlateChanging || isPlateAdded || isPlateRemoved) && !showPlateConfirm) {
      enterPlateConfirm();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      regNumber,
      countryCode,
      region,
      expiryDate: new Date(expiryDate).toISOString(),
      cost: parseFloat(cost) || 0,
      isCurrent,
      notes
    };

    try {
      // Rely on backend sync for UserVehicle.licensePlate when isCurrent is true
      if (initialData?.id) {
        await updateRegistration(vehicleId, initialData.id, payload);
      } else {
        await createRegistration(vehicleId, payload);
      }

      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save registration');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 transition-all animate-in fade-in duration-300">
      <div className={`relative w-full max-w-xl overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-premium transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-overlay border border-border-subtle text-muted">
              <Landmark size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">
                {initialData ? 'Update Registration' : 'New Registration'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">Vehicle compliance record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <Globe size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Primary Identity Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">1. Region / State</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. QLD"
                  required
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">Plate Number</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="ABC-123"
                  required
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-black uppercase placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
                {!initialData && vehicleLicensePlate && regNumber === vehicleLicensePlate && (
                  <p className="text-[9px] font-bold text-accent uppercase tracking-widest ml-1 italic">Uses the vehicle profile plate.</p>
                )}
              </div>
            </div>

            {showPlateConfirm && (
              <div className="rounded-[24px] border border-blue-500/20 bg-blue-500/5 p-6 animate-in zoom-in-95 duration-300 shadow-premium">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-foreground">
                        {!regNumber ? 'Remove Global Plate?' : 'Update Global Plate?'}
                      </h4>
                      <p className="text-[11px] font-medium text-muted leading-relaxed italic">
                        {!regNumber 
                          ? `Are you sure you want to remove the plate number for this vehicle? Future registration forms will no longer be prefilled.`
                          : vehicleLicensePlate 
                            ? `Are you sure you want to change the plate number for this vehicle? This will update it across AutoFolio.`
                            : `Saving this plate will update your vehicle's primary profile across AutoFolio.`}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        className="flex-1 h-10 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 active:scale-95 shadow-lg"
                      >
                        {!regNumber ? 'Confirm Removal' : 'Confirm & Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelPlateConfirm}
                        className="flex-1 h-10 rounded-xl bg-card-overlay border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:bg-card-overlay-hover active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">Country Code (ISO)</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                placeholder="AU"
                maxLength={2}
                required
                className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
              />
            </div>

            {/* Logistics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Calendar size={12} className="pointer-events-none" />
                  2. Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
                
                {/* Duration Helper */}
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-dim italic">Set by duration:</span>
                  <div className="flex gap-1">
                    {[3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleDurationChange(m.toString())}
                        className={`px-2 py-1 rounded-md border text-[9px] font-black transition-all ${
                          durationMonths === m.toString() 
                            ? 'bg-accent/20 border-accent text-accent' 
                            : 'bg-card-overlay border-border-subtle text-muted hover:border-muted'
                        }`}
                      >
                        {m}M
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <CreditCard size={12} />
                  Renewal Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Context Section */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">3. Additional Context</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Insurance requirements, inspection notes, or specialized plate details..."
                className="w-full h-32 rounded-3xl border border-border-subtle bg-card-overlay p-6 text-sm font-medium text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner resize-none"
              />
            </div>

            {/* Primary Switch */}
            <div className="flex items-center justify-between p-6 rounded-3xl border border-border-subtle bg-foreground/[0.01]">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground opacity-80">Primary Record</p>
                <p className="text-[10px] font-medium text-muted uppercase tracking-widest">Set as the active vehicle registration</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCurrent(!isCurrent)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isCurrent ? 'bg-accent' : 'bg-foreground/10'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCurrent ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <footer className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="flex h-14 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-sm font-bold text-muted transition-all hover:bg-card-overlay-hover active:scale-[0.98]"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !region || !regNumber || !expiryDate}
              className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting || isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={18} strokeWidth={3} className="mr-2" />
                  {initialData ? 'Update Record' : 'Create Record'}
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
