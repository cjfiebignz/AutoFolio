'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Save, Shield, Calendar, CreditCard, FileText, Loader2, Landmark, Clock } from 'lucide-react';
import { createInsurance, updateInsurance } from '@/lib/api';
import { InsuranceRecord } from '@/types/autofolio';
import { usePreferences } from '@/lib/preferences';

interface InsuranceFormProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: InsuranceRecord | null;
}

const POLICY_TYPES = [
  { id: 'comprehensive', label: 'Comprehensive' },
  { id: 'third_party_property', label: 'Third Party Property' },
  { id: 'third_party_fire_theft', label: 'Third Party, Fire & Theft' },
  { id: 'liability', label: 'Liability Only' },
];

const FREQUENCIES = [
  { id: 'annually', label: 'Annually' },
  { id: 'semi_annually', label: 'Semi-Annually' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'monthly', label: 'Monthly' },
];

const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'JPY'];

const STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'expired', label: 'Expired' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function InsuranceForm({ vehicleId, isOpen, onClose, initialData }: InsuranceFormProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [policyNumber, setPolicyNumber] = useState(initialData?.policyNumber || '');
  const [policyType, setPolicyType] = useState(initialData?.policyType || 'comprehensive');
  const [startDate, setStartDate] = useState(initialData?.policyStartDate?.split('T')[0] || '');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate?.split('T')[0] || '');
  const [premiumAmount, setPremiumAmount] = useState(initialData?.premiumAmount?.toString() || '');
  const [currency, setCurrency] = useState(initialData?.currency || preferences.defaultCurrency);
  const [duration, setDuration] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState(initialData?.paymentFrequency || 'annually');
  const [status, setStatus] = useState<'active' | 'expired' | 'cancelled' | 'pending'>(initialData?.insuranceStatus || 'active');

  // Ref to track auto-fill state and avoid loops/unwanted overwrites
  const lastCalculatedRef = useRef({ start: '', dur: '' });

  const [isCurrent, setIsCurrent] = useState(initialData?.isCurrent ?? true);
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle auto-populating Expiry Date
  useEffect(() => {
    if (startDate && duration) {
      // Only auto-fill if the inputs have changed since our last calculation
      if (startDate === lastCalculatedRef.current.start && duration === lastCalculatedRef.current.dur) {
        return;
      }

      const months = parseInt(duration);
      if (!isNaN(months) && months > 0) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          const expiry = new Date(start);
          expiry.setMonth(expiry.getMonth() + months);
          setExpiryDate(expiry.toISOString().split('T')[0]);
          
          // Mark as calculated to prevent overwriting manual changes 
          // unless one of these inputs changes again
          lastCalculatedRef.current = { start: startDate, dur: duration };
        }
      }
    }
  }, [startDate, duration]);

  useEffect(() => {
    if (isOpen) {
      setProvider(initialData?.provider || '');
      setPolicyNumber(initialData?.policyNumber || '');
      setPolicyType(initialData?.policyType || 'comprehensive');
      const s = initialData?.policyStartDate?.split('T')[0] || '';
      setStartDate(s);
      setExpiryDate(initialData?.expiryDate?.split('T')[0] || '');
      setPremiumAmount(initialData?.premiumAmount?.toString() || '');
      setCurrency(initialData?.currency || preferences.defaultCurrency);
      setPaymentFrequency(initialData?.paymentFrequency || 'annually');
      setStatus(initialData?.insuranceStatus || 'active');
      setIsCurrent(initialData?.isCurrent ?? true);
      setNotes(initialData?.notes || '');
      setDuration('');
      setError(null);
      
      // Initialize ref so we don't auto-calculate on first open
      lastCalculatedRef.current = { start: s, dur: '' };
    }
  }, [isOpen, initialData, preferences.defaultCurrency]);


  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const data = {
      provider,
      policyNumber,
      policyType,
      policyStartDate: startDate ? new Date(startDate).toISOString() : undefined,
      expiryDate: new Date(expiryDate).toISOString(),
      premiumAmount: premiumAmount ? parseFloat(premiumAmount) : undefined,
      currency,
      paymentFrequency,
      isCurrent,
      insuranceStatus: status as any,
      notes
    };

    try {
      if (initialData) {
        await updateInsurance(vehicleId, initialData.id, data);
      } else {
        await createInsurance(vehicleId, data);
      }

      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save insurance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-xl overflow-hidden rounded-[40px] border border-white/10 bg-[#0b0b0c] shadow-3xl transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        <div className="flex items-center justify-between border-b border-white/5 p-6 sm:p-8">
          <div>
            <h3 className="text-xl font-black italic tracking-tight text-white uppercase">{initialData ? 'Edit Insurance' : 'New Policy'}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Vehicle protection record</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
          <div className="flex-1 p-6 sm:p-8 space-y-10 overflow-y-auto custom-scrollbar pb-10">
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[11px] font-bold uppercase tracking-widest text-red-400 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2">
                  <X size={14} className="shrink-0" />
                  {error}
                </div>
              </div>
            )}

            {/* 1. Provider & Identity */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5 px-1">
                <Landmark size={16} className="text-blue-400/40" />
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">1. Provider & Identity</label>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Define your insurance source</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Insurer / Provider</span>
                  <input
                    required
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. NRMA, Geico, Allianz"
                    className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white placeholder:text-white/5 focus:border-white/20 focus:outline-none transition-colors hover:bg-white/[0.05]"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Policy Number</span>
                  <input
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="POL-123456"
                    className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white placeholder:text-white/5 focus:border-white/20 focus:outline-none uppercase transition-colors hover:bg-white/[0.05]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Coverage Type</span>
                <div className="relative">
                  <select
                    value={policyType}
                    onChange={(e) => setPolicyType(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white focus:border-white/20 focus:outline-none focus:bg-white/[0.05] appearance-none cursor-pointer transition-colors hover:bg-white/[0.05]"
                  >
                    {POLICY_TYPES.map(t => <option key={t.id} value={t.id} className="bg-[#0b0b0c] text-white">{t.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                    <Shield size={14} />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Coverage Timeline */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5 px-1">
                <Calendar size={16} className="text-white/20" />
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">2. Coverage Timeline</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Start Date <span className="text-[7px] opacity-40 italic">(Optional)</span></span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white focus:border-white/20 focus:outline-none transition-colors hover:bg-white/[0.05]"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 ml-4">Expiry / Renewal Date</span>
                  <input
                    required
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-blue-500/20 bg-blue-500/5 px-6 text-sm font-bold text-white focus:border-blue-500/40 focus:outline-none transition-colors hover:bg-blue-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Coverage Term <span className="text-[7px] opacity-40 italic">(Months)</span></span>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 12"
                      className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white placeholder:text-white/5 focus:border-white/20 focus:outline-none transition-colors hover:bg-white/[0.05] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                      <Clock size={14} />
                    </div>
                  </div>
                </div>
                <div className="h-14 flex items-center justify-between rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 group cursor-pointer transition-all hover:bg-white/[0.05] hover:border-white/10" onClick={() => setIsCurrent(!isCurrent)}>
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-black font-bold text-white/40 uppercase tracking-widest block truncate">Record Type</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter italic block truncate">Current Policy</span>
                  </div>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isCurrent ? 'bg-blue-600' : 'bg-white/10'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCurrent ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Premium & Financials */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5 px-1">
                <CreditCard size={16} className="text-white/20" />
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">3. Premium & Financials</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Premium Amount</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={premiumAmount}
                      onChange={(e) => setPremiumAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white placeholder:text-white/5 focus:border-white/20 focus:outline-none transition-colors hover:bg-white/[0.05] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#0b0b0c] rounded-lg px-2 py-1 text-[9px] font-black text-white border border-white/5 outline-none cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c} className="bg-[#0b0b0c] text-white">{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Payment Frequency</span>
                  <div className="relative">
                    <select
                      value={paymentFrequency}
                      onChange={(e) => setPaymentFrequency(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white focus:border-white/20 focus:outline-none focus:bg-white/[0.05] appearance-none cursor-pointer transition-colors hover:bg-white/[0.05]"
                    >
                      {FREQUENCIES.map(f => <option key={f.id} value={f.id} className="bg-[#0b0b0c] text-white">{f.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                      <X size={10} className="rotate-45" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Administration */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5 px-1">
                <FileText size={16} className="text-white/20" />
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">4. Administration</label>
              </div>
              <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Policy Status</span>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="h-14 w-full rounded-2xl border border-white/5 bg-[#0b0b0c] px-6 text-sm font-bold text-white focus:border-white/20 focus:outline-none focus:bg-white/[0.05] appearance-none cursor-pointer transition-colors hover:bg-white/[0.05]"
                  >
                    {STATUSES.map(s => <option key={s.id} value={s.id} className="bg-[#0b0b0c] text-white">{s.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                    <X size={10} className="rotate-45" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-4">Internal Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full rounded-2xl border border-white/5 bg-[#0b0b0c] p-6 text-sm font-bold text-white placeholder:text-white/5 focus:border-white/20 focus:outline-none resize-none transition-colors hover:bg-white/[0.05]"
                />
              </div>
            </section>
          </div>

          <div className="mt-auto flex items-center gap-4 bg-[#0b0b0c] p-6 sm:p-8 border-t border-white/5 z-10 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPending}
              className="flex-[2] flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 shadow-2xl"
            >
              {isSubmitting || isPending ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <Save size={18} strokeWidth={3} />
                  {initialData ? 'Update Policy' : 'Create Policy'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
