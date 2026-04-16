'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileCheck, Plus, Trash2, Edit3, Calendar, ExternalLink, Clock, X, Loader2, Landmark } from 'lucide-react';
import { deleteRegistration } from '@/lib/api';
import { formatCurrency, formatDisplayDate, getExpiryStatus } from '@/lib/date-utils';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';
import { RegistrationForm } from './RegistrationForm';

interface VehicleRegistrationDisplayProps {
  vehicleId: string;
  registrations?: any[];
  displayCurrency?: string;
}

export function VehicleRegistrationDisplay({ vehicleId, registrations = [], displayCurrency = 'AUD' }: VehicleRegistrationDisplayProps) {
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

  const handleDelete = async (regId: string) => {
    if (confirmDeleteId !== regId) {
      enterConfirm(regId);
      return;
    }

    startAction(regId);
    try {
      await deleteRegistration(vehicleId, regId);
      completeAction();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete registration record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h3 className="text-xl font-black italic tracking-tight uppercase text-white/90">Registration</h3>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Legal & Compliance Records</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex h-9 items-center justify-center gap-2 rounded-xl bg-white/5 px-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/5"
        >
          <Plus size={12} strokeWidth={3} />
          Add Record
        </button>
      </div>

      <InlineErrorMessage 
        message={errorMessage} 
        onClear={() => setErrorMessage(null)} 
      />

      {!registrations || registrations.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-white/5 bg-white/[0.01] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/10">
            <Landmark size={32} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No registration records</p>
          <p className="mt-2 text-[10px] font-medium text-white/10 max-w-[200px] mx-auto leading-relaxed">
            Track your vehicle's legal standing and upcoming renewal dates.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {registrations.map((record) => {
            const expiry = getExpiryStatus(record.expiryDate);
            const isConfirming = confirmDeleteId === record.id;
            const isRowDeleting = isDeleting && deletingId === record.id;

            return (
              <div 
                key={record.id} 
                className={`group relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04] hover:border-white/10 ${isRowDeleting ? 'opacity-50 grayscale pointer-events-none' : ''} ${isConfirming ? 'border-red-500/20 bg-red-500/5' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                      expiry.status === 'expired' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}>
                      <FileCheck size={18} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-black italic tracking-tight uppercase text-white truncate">{record.jurisdiction}</h4>
                        {record.isPrimary && (
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-blue-400 ring-1 ring-inset ring-blue-500/20">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        {record.plateNumber || 'No Plate Recorded'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 mb-0.5">Renewal Fee</p>
                      <p className="text-sm font-black text-white italic tracking-tight">{formatCurrency(record.cost || 0, displayCurrency)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isConfirming && (
                        <button 
                          onClick={() => handleEdit(record)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                          title="Edit Record"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      {isConfirming && (
                        <button
                          type="button"
                          onClick={() => cancelConfirm()}
                          disabled={isRowDeleting}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/40 hover:text-white transition-all"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        disabled={isRowDeleting}
                        className={`flex items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
                          isConfirming 
                            ? 'bg-red-500 text-white px-4 h-9 text-[9px] font-black uppercase tracking-widest' 
                            : 'bg-red-500/5 text-red-500/20 hover:bg-red-500/10 hover:text-red-400 h-9 w-9'
                        }`}
                        title={isConfirming ? "Confirm Deletion" : "Delete Record"}
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

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={10} className="text-white/20" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                        Exp: {formatDisplayDate(record.expiryDate)}
                      </p>
                    </div>
                    {expiry.status !== 'valid' && (
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${expiry.status === 'expired' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        <Clock size={8} />
                        <span className="text-[7px] font-black uppercase tracking-widest">{expiry.label}</span>
                      </div>
                    )}
                  </div>
                  {record.documentUrl && (
                    <a 
                      href={record.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-400/60 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink size={10} />
                      View Certificate
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <RegistrationForm
          vehicleId={vehicleId}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedRecord}
        />
      )}
    </div>
  );
}
