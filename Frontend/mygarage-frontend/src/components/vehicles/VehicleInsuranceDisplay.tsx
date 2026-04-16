'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, Trash2, Edit3, Calendar, ExternalLink, Clock, X, Loader2 } from 'lucide-react';
import { deleteInsurance } from '@/lib/api';
import { formatCurrency, formatDisplayDate, getExpiryStatus } from '@/lib/date-utils';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';
import { InsuranceForm } from './InsuranceForm';

interface VehicleInsuranceDisplayProps {
  vehicleId: string;
  insurance?: any[];
  displayCurrency?: string;
}

export function VehicleInsuranceDisplay({ vehicleId, insurance = [], displayCurrency = 'AUD' }: VehicleInsuranceDisplayProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  
  const {
    isActioning: isDeleting,
    actioningId: deletingId,
    confirmId: confirmDeleteId,
    errorMessage,
    setErrorMessage,
    enterConfirm,
    cancelConfirm,
    startAction,
    failAction,
    completeAction
  } = useActionConfirm();

  const handleAdd = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = async (insuranceId: string) => {
    if (confirmDeleteId !== insuranceId) {
      enterConfirm(insuranceId);
      return;
    }

    startAction(insuranceId);
    try {
      await deleteInsurance(vehicleId, insuranceId);
      completeAction();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete insurance record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h3 className="text-xl font-black italic tracking-tight uppercase text-foreground opacity-90">Insurance</h3>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Policy & Coverage Management</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex h-9 items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-90 border border-subtle"
        >
          <Plus size={12} strokeWidth={3} />
          Add Policy
        </button>
      </div>

      <InlineErrorMessage 
        message={errorMessage} 
        onClear={() => setErrorMessage(null)} 
      />

      {!insurance || insurance.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-subtle bg-card-overlay p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/5 text-dim">
            <ShieldCheck size={32} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">No insurance records</p>
          <p className="mt-2 text-[10px] font-medium text-dim max-w-[200px] mx-auto leading-relaxed">
            Keep your policy details and coverage information organized.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {insurance.map((record) => {
            const expiry = getExpiryStatus(record.expiryDate);
            const isConfirming = confirmDeleteId === record.id;
            const isRowDeleting = isDeleting && deletingId === record.id;

            return (
              <div 
                key={record.id} 
                className={`group relative overflow-hidden rounded-[24px] border border-subtle bg-card-overlay p-5 transition-all hover:bg-card-overlay-hover hover:border-border-strong ${isRowDeleting ? 'opacity-50 grayscale pointer-events-none' : ''} ${isConfirming ? 'border-red-500/20 bg-red-500/5' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                      expiry.status === 'expired' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                        : 'bg-foreground/5 border-subtle text-muted'
                    }`}>
                      <ShieldCheck size={18} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-black italic tracking-tight uppercase text-foreground truncate">{record.provider}</h4>
                        {record.isPrimary && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20">Primary</span>
                        )}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                        {record.policyNumber || 'No Policy Number'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-dim mb-0.5">Coverage Total</p>
                      <p className="text-sm font-black text-foreground italic tracking-tight">{formatCurrency(record.premium || 0, displayCurrency)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isConfirming && (
                        <button 
                          onClick={() => handleEdit(record)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground transition-all border border-subtle"
                          title="Edit Policy"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      {isConfirming && (
                        <button
                          type="button"
                          onClick={() => cancelConfirm()}
                          disabled={isRowDeleting}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/10 text-muted hover:text-foreground transition-all"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        disabled={isDeleting && deletingId === record.id}
                        className={`flex items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
                          isConfirming 
                            ? 'bg-red-500 text-white px-4 h-9 text-[9px] font-black uppercase tracking-widest' 
                            : 'bg-red-500/5 text-red-500/20 hover:bg-red-500/10 hover:text-red-400 h-9 w-9'
                        }`}
                        title={isConfirming ? "Confirm Deletion" : "Delete Policy"}
                      >
                        {isRowDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isConfirming ? (
                          "Confirm"
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={10} className="text-dim" />
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest">
                        Exp: {formatDisplayDate(record.expiryDate)}
                      </p>
                    </div>
                    {expiry.status !== 'valid' && (
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${expiry.status === 'expired' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'}`}>
                        <Clock size={8} />
                        <span className="text-[7px] font-black uppercase tracking-widest">{expiry.label}</span>
                      </div>
                    )}
                  </div>
                  {record.policyUrl && (
                    <a 
                      href={record.policyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={10} />
                      View Policy
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <InsuranceForm
          vehicleId={vehicleId}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedRecord}
        />
      )}
    </div>
  );
}
