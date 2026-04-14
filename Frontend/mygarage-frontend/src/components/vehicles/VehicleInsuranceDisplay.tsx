'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { InsuranceRecord } from '@/types/autofolio';
import { formatDisplayDate, formatCurrency, getExpiryStatus, getRelativeTimeText, formatLifecycleStatus } from '@/lib/date-utils';
import { deleteInsurance } from '@/lib/api';
import { usePreferences } from '@/lib/preferences';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Landmark, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  ChevronDown,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { InsuranceForm } from './InsuranceForm';
import { TabIntroBlurb } from '../ui/TabIntroBlurb';

interface VehicleInsuranceDisplayProps {
  vehicleId: string;
  insuranceRecords: InsuranceRecord[];
}

export function VehicleInsuranceDisplay({ vehicleId, insuranceRecords }: VehicleInsuranceDisplayProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InsuranceRecord | null>(null);

  const currentRecord = insuranceRecords.find(r => r.isCurrent);
  const historyRecords = insuranceRecords.filter(r => !r.isCurrent).sort((a, b) => 
    new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
  );

  const handleAdd = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: InsuranceRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = async (insId: string) => {
    if (!window.confirm('Delete this insurance record?')) return;
    try {
      await deleteInsurance(vehicleId, insId);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-12">
      {/* Tab Header & Action */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Insurance</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Protection & Coverage</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl"
        >
          <Plus size={14} strokeWidth={3} />
          Add Policy
        </button>
      </div>

      <TabIntroBlurb 
        tab="insurance" 
        title="Asset Protection" 
        description="Maintain a complete record of your insurance policies, premiums, and coverage periods to ensure your vehicle is always protected." 
      />

      {/* Current Policy Summary */}
      {currentRecord ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck size={14} className="text-blue-400/60" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Active Policy</h3>
          </div>
          
          <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Current Provider</p>
                    <StatusBadge status={currentRecord.insuranceStatus} expiryDate={currentRecord.expiryDate} />
                  </div>
                  <h4 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white uppercase break-words leading-tight">{currentRecord.provider}</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-blue-400/30" />
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">Policy: {currentRecord.policyNumber || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 mb-2.5">Coverage</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-400/40" />
                      <span className="text-xs font-black uppercase tracking-widest text-white/80">{currentRecord.policyType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  {currentRecord.premiumAmount && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 mb-2.5">Premium</p>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-white/20" />
                        <span className="text-xs font-black tracking-widest text-white/80">{formatCurrency(Number(currentRecord.premiumAmount), currentRecord.currency, preferences.defaultCurrency)}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 mb-2.5">Frequency</p>
                    <span className="text-xs font-black uppercase tracking-widest text-white/60">{currentRecord.paymentFrequency}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-8 lg:border-l lg:border-white/5 lg:pl-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 mb-2.5">Effective Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/20" />
                      <span className="text-xs font-black tracking-widest text-white/80">{currentRecord.policyStartDate ? formatDisplayDate(currentRecord.policyStartDate) : 'Not recorded'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 mb-2.5">Renewal Due</p>
                    <div className="flex items-center gap-2.5 text-blue-400">
                      <Clock size={15} className="opacity-60" />
                      <div className="flex flex-col">
                        <span className="text-sm font-black italic leading-none uppercase tracking-tight">{formatDisplayDate(currentRecord.expiryDate)}</span>
                        {(() => {
                          const status = formatLifecycleStatus(currentRecord.expiryDate, currentRecord.insuranceStatus, 'Covered');
                          return status.subLabel && (
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1.5">
                              {status.subLabel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {currentRecord.notes && (
                  <div className="rounded-3xl bg-white/[0.02] p-5 border border-white/5 relative">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 mb-2 absolute -top-2 left-4 bg-[#0b0b0c] px-2 py-0.5 rounded-full border border-white/5">Notes</p>
                    <p className="text-[11px] font-medium leading-relaxed text-white/30 italic">"{currentRecord.notes}"</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={() => handleEdit(currentRecord)}
                    className="flex-1 flex h-14 items-center justify-center gap-3 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/10 hover:text-white border border-white/5"
                  >
                    <Edit3 size={14} />
                    Update Policy
                  </button>
                  <button 
                    onClick={() => handleDelete(currentRecord.id)}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/5 text-red-500/40 transition-all hover:bg-red-500/10 hover:text-red-500 border border-red-500/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-20 text-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01]">
          <div className="mb-6 rounded-2xl bg-white/5 p-5 text-white/10">
            <Landmark size={32} strokeWidth={1} />
          </div>
          <h3 className="text-lg font-bold text-white/40 uppercase italic tracking-tight">No active insurance</h3>
          <p className="mt-2 text-xs font-medium text-white/20 max-w-xs mx-auto">Log your vehicle's current insurance policy to track coverage and get renewal alerts.</p>
        </section>
      )}

      {/* Insurance History */}
      {historyRecords.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Clock size={14} className="text-white/20" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Policy History</h3>
          </div>
          
          <div className="grid gap-3">
            {historyRecords.map(record => (
              <HistoryCard 
                key={record.id} 
                record={record} 
                onEdit={() => handleEdit(record)}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </div>
        </section>
      )}

      <InsuranceForm 
        vehicleId={vehicleId}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingRecord}
      />
    </div>
  );
}

function StatusBadge({ status, expiryDate, className = "" }: { status: string, expiryDate?: string, className?: string }) {
  const lifecycle = formatLifecycleStatus(expiryDate, status, 'Active');
  const expiryStatus = getExpiryStatus(expiryDate);
  
  let label = lifecycle.label;
  let colors = "bg-white/5 text-white/40 ring-white/10";
  let icon = null;

  if (status === 'expired' || expiryStatus === 'expired') {
    colors = "bg-red-500/10 text-red-400 ring-red-500/20";
    icon = <AlertCircle size={10} />;
  } else if (expiryStatus === 'due_soon') {
    colors = "bg-yellow-500/10 text-yellow-500 ring-yellow-500/20";
    icon = <AlertTriangle size={10} />;
  } else if (status === 'active') {
    colors = "bg-blue-500/10 text-blue-400 ring-blue-500/20";
    icon = <ShieldCheck size={10} />;
  } else if (status === 'pending') {
    colors = "bg-blue-500/10 text-blue-400 ring-blue-500/20";
  } else if (status === 'cancelled') {
    colors = "bg-white/5 text-white/20 ring-white/5";
  }

  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest ring-1 ring-inset ${colors} ${className}`}>
      {icon}
      {label}
    </span>
  );
}

function HistoryCard({ record, onEdit, onDelete }: { record: InsuranceRecord, onEdit: () => void, onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { preferences } = usePreferences();

  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.01] transition-all hover:border-white/10 hover:bg-white/[0.02]">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 sm:p-7 text-left outline-none"
      >
        <div className="flex items-center gap-5">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/20 group-hover:text-white/40 transition-colors">
            <Landmark size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-base font-black italic text-white/80 uppercase tracking-tight leading-tight">{record.provider}</h4>
              <StatusBadge status={record.insuranceStatus} expiryDate={record.expiryDate} className="py-0.5" />
            </div>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">{record.policyType.replace(/_/g, ' ')} • {record.policyNumber || 'No Policy #'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/10 mb-0.5">Expired On</p>
            <p className="text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors">{formatDisplayDate(record.expiryDate)}</p>
          </div>
          <ChevronDown size={16} className={`text-white/20 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}`}>
        <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/10">Frequency</p>
              <p className="text-xs font-bold text-white/60 capitalize">{record.paymentFrequency}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/10">Premium</p>
              <p className="text-xs font-bold text-white/60">{record.premiumAmount ? formatCurrency(Number(record.premiumAmount), record.currency, preferences.defaultCurrency) : '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/10">Start Date</p>
              <p className="text-xs font-bold text-white/60">{record.policyStartDate ? formatDisplayDate(record.policyStartDate) : '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/10">Policy #</p>
              <p className="text-xs font-bold text-white/60 truncate max-w-[120px]">{record.policyNumber || '—'}</p>
            </div>
          </div>
          
          <div className="space-y-4 flex flex-col justify-between">
            {record.notes ? (
              <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/10 mb-1">Notes</p>
                <p className="text-[11px] font-medium text-white/30 italic">"{record.notes}"</p>
              </div>
            ) : <div />}
            <div className="flex items-center gap-3 justify-end">
              <button onClick={onEdit} className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all border border-white/5"><Edit3 size={14} /></button>
              <button onClick={onDelete} className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500/5 text-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-all border border-red-500/5"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
