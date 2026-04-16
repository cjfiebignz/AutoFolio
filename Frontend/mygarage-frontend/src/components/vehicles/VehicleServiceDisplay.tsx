'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ServiceEntryViewModel } from "@/lib/mappers/service";
import { formatCurrency } from "@/lib/date-utils";
import { 
  Plus, Wrench, Clock, ChevronDown, ChevronUp, Trash2, 
  Edit3, Calendar, Gauge, ExternalLink, ShieldCheck,
  AlertCircle, CheckCircle2, History, X, Loader2
} from 'lucide-react';
import { deleteService } from '@/lib/api';
import { ServiceAttachmentsDisplay } from './ServiceAttachmentsDisplay';
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
import { ServiceSummary, LifetimeCostSummary } from "@/types/autofolio";
import { VehicleServiceSummaryCard } from './VehicleServiceSummaryCard';
import { ExportHistoryButton } from './ExportHistoryButton';

export function VehicleServiceDisplay({ 
  vehicleId, 
  vehicleNickname,
  services,
  serviceSummary,
  costSummary
}: { 
  vehicleId: string;
  vehicleNickname: string;
  services: ServiceEntryViewModel[];
  serviceSummary: ServiceSummary | null;
  costSummary: LifetimeCostSummary | null;
}) {
  const displayCurrency = costSummary?.preferredCurrencyDisplay ?? 'AUD';

  return (
    <div className="space-y-10">
      {/* Header & Main Status Area */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Service History</h2>
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Maintenance Audit Log</p>
              <div className="h-1 w-1 rounded-full bg-white/10" />
              <ExportHistoryButton vehicleId={vehicleId} vehicleNickname={vehicleNickname} variant="minimal" type="service" />
            </div>
          </div>
          <Link 
            href={`/vehicles/${vehicleId}/service/new`}
            className="flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl"
          >
            <Plus size={14} strokeWidth={3} />
            Add Record
          </Link>
        </div>

        {serviceSummary && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <VehicleServiceSummaryCard vehicleId={vehicleId} summary={serviceSummary.serviceSummary} />
          </div>
        )}
      </div>

      {/* Intro Blurb */}
      <TabIntroBlurb 
        tab="service" 
        title="Technical Logbook" 
        description="A complete, verifiable audit trail of your vehicle's maintenance events, repairs, and inspections." 
      />

      {/* Tighter Log Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <History size={14} className="text-white/20" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Audit Trail</h3>
        </div>

        {services.length === 0 ? (
          <EmptyServiceState vehicleId={vehicleId} />
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {services.map((service) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                vehicleId={vehicleId} 
                displayCurrency={displayCurrency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ 
  service, 
  vehicleId,
  displayCurrency
}: { 
  service: ServiceEntryViewModel, 
  vehicleId: string,
  displayCurrency: string
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const contentId = `service-content-${service.id}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending || isDeleting) return;
    
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteService(vehicleId, service.id);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete record');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-[32px] border transition-all duration-500 hover:shadow-2xl ${
        isExpanded 
          ? 'border-white/15 bg-white/[0.04] shadow-3xl ring-1 ring-white/10' 
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
      } ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
      {/* Clickable Summary Row - Tighter */}
      <button 
        type="button"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 outline-none transition-colors group-focus-visible:bg-white/5"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Subtle Icon Container */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
            isExpanded 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
          }`}>
            <Wrench size={16} strokeWidth={1.5} />
          </div>
          
          <div className="min-w-0 flex-1 space-y-0.5">
             <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 pr-2">
                <h3 className={`text-base font-black italic tracking-tight uppercase truncate transition-colors leading-tight ${
                  isExpanded ? 'text-white' : 'text-white/80 group-hover:text-white'
                }`}>
                  {service.title}
                </h3>
                {service.isMainService && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-blue-400 ring-1 ring-inset ring-blue-500/20">
                    Main Service
                  </span>
                )}
             </div>
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar size={10} className="text-white/20" />
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{service.date}</p>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Gauge size={10} className="text-white/20" />
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{service.odometerDisplay}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <p className={`text-base sm:text-lg font-black tracking-tighter leading-none transition-colors ${isExpanded ? 'text-blue-400' : 'text-white'}`}>
            {formatCurrency(service.rawTotalCost || 0, displayCurrency)}
          </p>
          
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white/20 transition-all duration-500 group-hover:border-white/10 group-hover:text-white/40 ${
            isExpanded ? 'rotate-180 bg-blue-500/10 border-blue-500/20 text-blue-400' : ''
          }`}>
            <ChevronDown size={14} strokeWidth={3} />
          </div>
        </div>
      </button>

      {/* Inline Error Feedback */}
      {errorMessage && (
        <div className="px-6 pb-2 sm:px-8 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center justify-between gap-3 text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{errorMessage}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setErrorMessage(null); }} className="text-red-400/40 hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Details Area - Matches Work Tab Style */}
      <div 
        id={contentId}
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-6 pb-8 sm:px-8 sm:pb-10 space-y-10 border-t border-white/5 pt-8">
            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <DetailBox label="Service Type" value={service.serviceType} highlight="blue" />
                <DetailBox label="Record Verification" value="Verified" highlight="green" />
                <DetailBox label="Odometer Reading" value={service.odometerDisplay} />
                <DetailBox label="Total Investment" value={formatCurrency(service.rawTotalCost || 0, displayCurrency)} highlight="white" />
            </div>

            {/* Content & Actions Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-10">
                <div className="space-y-10">
                  {service.notes && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Technician Notes</p>
                      <div className="rounded-[28px] bg-white/[0.01] border border-white/5 p-7 relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
                        <p className="text-[13px] font-medium leading-relaxed text-white/60 italic">
                          “{service.notes}”
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Reference Documentation</p>
                    <ServiceAttachmentsDisplay 
                      vehicleId={vehicleId} 
                      serviceEventId={service.id} 
                      attachments={service.attachments || []} 
                    />
                  </div>
                </div>

                {/* Sidebar Quick Actions */}
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white/5 p-7 space-y-5 shadow-xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Data Management</p>
                      <div className="grid grid-cols-1 gap-3">
                        <Link 
                          href={`/vehicles/${vehicleId}/service/${service.id}/edit`}
                          className="flex h-11 items-center justify-center gap-3 rounded-xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.95] shadow-lg"
                        >
                          <Edit3 size={14} />
                          Edit Record
                        </Link>
                        <button 
                          type="button"
                          onClick={handleDelete}
                          disabled={isPending || isDeleting}
                          className={`flex h-11 items-center justify-center gap-3 rounded-xl transition-all border ${
                            confirmDelete 
                              ? 'bg-red-500 border-red-400 text-white px-3 text-[8px] font-black uppercase tracking-widest' 
                              : 'bg-red-500/10 border-red-500/10 text-red-500/40 hover:bg-red-500/10 hover:text-red-500 w-full'
                          }`}
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : confirmDelete ? 'Confirm' : <Trash2 size={14} />}
                          {!isDeleting && (confirmDelete ? '' : 'Delete')}
                        </button>
                        {confirmDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                            className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 text-center"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                  </div>

                  <div className="px-7 py-5 rounded-3xl border border-white/5 flex items-center justify-between bg-white/[0.01]">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">UUID Reference</p>
                      <p className="text-[9px] font-mono text-white/10 uppercase tracking-tighter">{service.id.substring(0, 8)}</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, highlight }: { label: string; value: string; highlight?: 'blue' | 'green' | 'white' }) {
  const highlightStyles = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    white: 'text-white'
  };

  return (
    <div className="rounded-2xl bg-white/[0.01] border border-white/5 p-5 space-y-2 flex flex-col justify-center min-h-[80px]">
       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/15 leading-none">{label}</p>
       <p className={`text-sm font-black italic tracking-tight uppercase truncate leading-tight ${highlight ? highlightStyles[highlight] : 'text-white/60'}`}>
         {value}
       </p>
    </div>
  );
}

function EmptyServiceState({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="group relative flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-32 text-center transition-all hover:bg-white/[0.02]">
      <div className="mb-8 relative">
        <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/10 group-hover:text-white/30 transition-colors shadow-2xl">
          <Wrench size={40} strokeWidth={1} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white/60 uppercase italic tracking-tight">No records found</h3>
      <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/20 mb-10">
        Record your maintenance events to build a verifiable technical history for your vehicle.
      </p>
      <Link 
        href={`/vehicles/${vehicleId}/service/new`}
        className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-2xl"
      >
        Add First Record
      </Link>
    </div>
  );
}
