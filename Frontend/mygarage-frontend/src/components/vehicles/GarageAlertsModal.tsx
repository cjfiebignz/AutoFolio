'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Bell, Clock, ShieldCheck, FileText, Info, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { AttentionItem } from "@/lib/attention-utils";

interface GarageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: (AttentionItem & { vehicleName: string })[];
}

export function GarageAlertsModal({ isOpen, onClose, alerts }: GarageAlertsModalProps) {
  if (!isOpen) return null;

  const getAttentionIcon = (item: AttentionItem) => {
    switch (item.category) {
      case 'registration':
      case 'service':
        if (item.severity === 'critical') return <Clock size={16} className="text-red-500" />;
        if (item.severity === 'warning') return <Clock size={16} className="text-yellow-500" />;
        return <Clock size={16} />;
      case 'insurance':
        if (item.severity === 'critical') return <ShieldCheck size={16} className="text-red-500" />;
        if (item.severity === 'warning') return <ShieldCheck size={16} className="text-yellow-500" />;
        return <ShieldCheck size={16} />;
      case 'reminder':
        return <Bell size={16} className={item.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />;
      case 'documents':
        return <FileText size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl overflow-hidden rounded-t-[40px] sm:rounded-[40px] border border-white/10 bg-[#0b0b0c] shadow-2xl transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 sm:p-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <Bell size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tight text-white uppercase">Garage Alerts</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">{alerts.length} Action Items</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar space-y-4">
          {alerts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-1 w-8 rounded-full bg-green-500/20 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-white/20 italic">No active alerts found</p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <Link 
                key={`${alert.key}-${idx}`}
                href={alert.href || '#'}
                onClick={onClose}
                className={`group flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04] active:scale-[0.98] ${
                  alert.severity === 'critical' ? 'hover:border-red-500/20' : 'hover:border-yellow-500/20'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-white/5 ${
                    alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {getAttentionIcon(alert)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-0.5 truncate">
                      {alert.vehicleName}
                    </p>
                    <h4 className="text-sm font-black italic text-white uppercase leading-none truncate">
                      {alert.title}
                    </h4>
                    {alert.subLabel && (
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                        alert.severity === 'critical' ? 'text-red-500/40' : 'text-yellow-500/40'
                      }`}>
                        {alert.subLabel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/0 group-hover:text-white/40 transition-all">
                  <ArrowRight size={18} />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center shrink-0">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
            System monitored in real-time
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
