'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Landmark,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { renewRegistration, renewInsurance, RenewRegistrationData, RenewInsuranceData } from '@/lib/api';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  type: 'registration' | 'insurance';
  currentRecordId: string;
  providerName?: string;
  currentExpiryDate?: string;
  vehicleLicensePlate?: string;
}

export function RenewalModal({ 
  isOpen, 
  onClose, 
  vehicleId, 
  type, 
  currentRecordId,
  providerName,
  currentExpiryDate,
  vehicleLicensePlate
}: RenewalModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Initialize step correctly based on type to avoid flash
  const [step, setStep] = useState<'prompt' | 'form' | 'success'>(type === 'registration' ? 'form' : 'prompt');
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [expiryDate, setExpiryDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMonths, setDurationMonths] = useState('');

  // Local helper for duration calculation
  const handleDurationChange = (monthsStr: string) => {
    setDurationMonths(monthsStr);
    const months = parseInt(monthsStr, 10);
    if (months > 0 && months < 120) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let baseDate = now;
      if (currentExpiryDate) {
        const currentExp = new Date(currentExpiryDate);
        currentExp.setHours(0, 0, 0, 0);
        // Only use current expiry as base if it's in the future or today
        if (currentExp >= now) {
          baseDate = currentExp;
        }
      }

      const newDate = new Date(baseDate);
      newDate.setMonth(newDate.getMonth() + months);
      setExpiryDate(newDate.toISOString().split('T')[0]);
    }
  };

  // Synchronize step and reset form when modal opens or type changes
  useEffect(() => {
    if (isOpen) {
      setStep(type === 'registration' ? 'form' : 'prompt');
      setExpiryDate('');
      setCost('');
      setNotes('');
      setDurationMonths('');
      setError(null);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleNo = () => {
    // Redirect to the appropriate page and trigger the new flow
    const path = type === 'registration' ? 'registration' : 'insurance';
    router.push(`/vehicles/${vehicleId}/${path}?action=new`);
    onClose();
  };

  const handleYes = () => {
    setStep('form');
  };

  const handleModalClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!expiryDate) {
      setError('Please select a new expiry date');
      return;
    }

    startTransition(async () => {
      try {
        // Ensure date is ISO format for backend
        const isoDate = new Date(expiryDate).toISOString();
        
        if (type === 'registration') {
          await renewRegistration(vehicleId, currentRecordId, {
            expiryDate: isoDate,
            cost: cost ? parseFloat(cost) : undefined,
            notes
          });
        } else {
          await renewInsurance(vehicleId, currentRecordId, {
            expiryDate: isoDate,
            premiumAmount: cost ? parseFloat(cost) : undefined,
            notes
          });
        }
        setStep('success');
        router.refresh();
      } catch (err: any) {
        setError(err.message || `Failed to renew ${type}`);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-premium">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 flex items-center justify-center rounded-2xl border border-border-subtle ${type === 'registration' ? 'bg-accent/10 text-accent' : 'bg-blue-500/10 text-blue-500'}`}>
              {type === 'registration' ? <Landmark size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">
                Renew {type}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-70">Portfolio Maintenance</p>
                {type === 'registration' && vehicleLicensePlate && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-muted opacity-20" />
                    <span className="rounded bg-card-overlay px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent border border-accent/20 uppercase">
                      {vehicleLicensePlate}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {step === 'prompt' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <h4 className="text-2xl font-black italic tracking-tighter text-foreground uppercase leading-tight">
                  Staying with {providerName || 'current provider'}?
                </h4>
                <p className="text-sm font-medium text-muted">
                  Choose 'Yes' for a quick renewal with the same provider. Choose 'No' to log a new provider and policy details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleYes}
                  className="group flex flex-col items-center justify-center gap-4 rounded-[32px] border border-border-strong bg-card-overlay p-8 transition-all hover:bg-card-overlay-hover hover:border-accent hover:shadow-xl active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={28} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-foreground">Same Provider</span>
                </button>

                <button
                  onClick={handleNo}
                  className="group flex flex-col items-center justify-center gap-4 rounded-[32px] border border-border-subtle bg-card-overlay p-8 transition-all hover:bg-card-overlay-hover hover:border-foreground/20 hover:shadow-xl active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/10 text-muted group-hover:scale-110 transition-transform">
                    <ArrowRight size={28} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">New Provider</span>
                </button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold text-red-500 uppercase tracking-widest">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">New Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full rounded-2xl border border-border-subtle bg-card-overlay py-4 pl-12 pr-4 text-sm font-bold text-foreground outline-none ring-accent/20 transition-all focus:border-accent focus:ring-4"
                    />
                  </div>

                  {/* Duration Helper */}
                  <div className="flex items-center gap-3 px-1 pt-1">
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">
                    {type === 'registration' ? 'Renewal Cost' : 'Premium Amount'}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full rounded-2xl border border-border-subtle bg-card-overlay py-4 pl-12 pr-4 text-sm font-bold text-foreground outline-none ring-accent/20 transition-all focus:border-accent focus:ring-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference numbers or additional info..."
                    className="w-full rounded-2xl border border-border-subtle bg-card-overlay p-4 text-sm font-bold text-foreground outline-none ring-accent/20 transition-all focus:border-accent focus:ring-4 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                {type === 'insurance' && (
                  <button
                    type="button"
                    onClick={() => setStep('prompt')}
                    disabled={isPending}
                    className="flex-1 rounded-2xl border border-border-subtle bg-card-overlay py-4 text-xs font-black uppercase tracking-widest text-muted transition-all hover:bg-card-overlay-hover hover:text-foreground active:scale-[0.98] disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className={`${type === 'insurance' ? 'flex-[2]' : 'w-full'} flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-xs font-black uppercase tracking-widest text-background transition-all hover:bg-foreground/90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50`}
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : `Confirm ${type} Renewal`}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="py-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 rounded-[35px] bg-green-500/10 animate-pulse" />
                <div className="relative flex h-full w-full items-center justify-center rounded-[35px] text-green-500">
                  <CheckCircle2 size={56} strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2 px-4">
                <h4 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Renewal Complete</h4>
                <p className="text-sm font-medium text-muted">
                  The <span className="text-foreground font-black uppercase italic tracking-tight">{type}</span> has been updated. 
                  The previous record is now archived in your vehicle history.
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="w-full rounded-2xl border border-border-strong bg-foreground py-4 text-xs font-black uppercase tracking-widest text-background transition-all hover:bg-foreground/90 active:scale-[0.98]"
              >
                Return to Overview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
