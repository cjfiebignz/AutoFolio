'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Save, Shield, Calendar, CreditCard, FileText, Loader2 } from 'lucide-react';
import { createInsurance, updateInsurance } from '@/lib/api';

interface InsuranceFormProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function InsuranceForm({ vehicleId, isOpen, onClose, initialData }: InsuranceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [policyNumber, setPolicyNumber] = useState(initialData?.policyNumber || '');
  const [policyType, setPolicyType] = useState(initialData?.policyType || 'comprehensive');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '');
  const [premiumAmount, setPremiumAmount] = useState(initialData?.premiumAmount?.toString() || '');
  const [paymentFrequency, setPaymentFrequency] = useState(initialData?.paymentFrequency || 'annually');
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
      setProvider(initialData?.provider || '');
      setPolicyNumber(initialData?.policyNumber || '');
      setPolicyType(initialData?.policyType || 'comprehensive');
      setExpiryDate(initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '');
      setPremiumAmount(initialData?.premiumAmount?.toString() || '');
      setPaymentFrequency(initialData?.paymentFrequency || 'annually');
      setIsCurrent(initialData?.isCurrent ?? true);
      setNotes(initialData?.notes || '');
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      provider,
      policyNumber,
      policyType,
      expiryDate: new Date(expiryDate).toISOString(),
      premiumAmount: parseFloat(premiumAmount) || 0,
      paymentFrequency,
      isCurrent,
      notes
    };

    try {
      if (initialData?.id) {
        await updateInsurance(vehicleId, initialData.id, payload);
      } else {
        await createInsurance(vehicleId, payload);
      }

      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save insurance');
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-overlay text-muted border border-border-subtle">
              <Shield size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">
                {initialData ? 'Update Policy' : 'New Policy'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">Active Coverage Details</p>
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
              <Shield size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Primary Provider Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">1. Provider Name</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="Insurance Co. Name"
                  required
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">Policy Number</label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="POL-00000000"
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">Policy Type</label>
                <select
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-[10px] font-black uppercase tracking-widest text-foreground focus:border-accent outline-none transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option value="comprehensive">Comprehensive</option>
                  <option value="third_party">Third Party Only</option>
                  <option value="third_party_fire_theft">Third Party, Fire & Theft</option>
                  <option value="liability">Liability Only</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">Payment Frequency</label>
                <select
                  value={paymentFrequency}
                  onChange={(e) => setPaymentFrequency(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-[10px] font-black uppercase tracking-widest text-foreground focus:border-accent outline-none transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option value="annually">Annually</option>
                  <option value="semi_annually">Semi-Annually</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Logistics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Calendar size={12} />
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
                  Premium Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={premiumAmount}
                  onChange={(e) => setPremiumAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 rounded-2xl border border-border-subtle bg-card-overlay px-6 text-sm font-bold text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Context Section */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-1">3. Coverage Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details about excess, specific inclusions, or roadside assistance..."
                className="w-full h-32 rounded-3xl border border-border-subtle bg-card-overlay p-6 text-sm font-medium text-foreground placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner resize-none"
              />
            </div>

            {/* Primary Switch */}
            <div className="flex items-center justify-between p-6 rounded-3xl border border-border-subtle bg-foreground/[0.01]">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground opacity-80">Primary Record</p>
                <p className="text-[10px] font-medium text-muted uppercase tracking-widest">Mark as the active policy</p>
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
              disabled={isSubmitting || !provider || !expiryDate}
              className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting || isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={18} strokeWidth={3} className="mr-2" />
                  {initialData ? 'Update Policy' : 'Create Policy'}
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
