'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ServiceEntryViewModel } from "@/lib/mappers/service";
import { formatCurrency } from '@/lib/date-utils';
import { usePreferences } from '@/lib/preferences';
import { Wrench, Trash2, Edit3, Plus, ChevronDown, Calendar, Gauge } from 'lucide-react';
import { deleteService } from '@/lib/api';
import { ServiceAttachmentsDisplay } from './ServiceAttachmentsDisplay';
import { ServiceSummary, LifetimeCostSummary } from "@/types/autofolio";
import { VehicleServiceSummaryCard } from "./VehicleServiceSummaryCard";
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
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
  const totalSpent = costSummary?.totalServiceCost ?? 0;
  const displayCurrency = costSummary?.preferredCurrencyDisplay ?? 'AUD';

  return (
    <div className="space-y-12">
      {/* Tab Header & Action */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Service History</h2>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Complete Maintenance Logbook</p>
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

      {/* Intro Blurb */}
      <TabIntroBlurb 
        tab="service" 
        title="Maintenance Tracker" 
        description="Every logged service adds to your vehicle's story and value. Build a bulletproof history of care." 
      />

      {/* Service Summary Card */}
      {serviceSummary && (
        <VehicleServiceSummaryCard vehicleId={vehicleId} summary={serviceSummary.serviceSummary} />
      )}

      {/* Main Service Content */}
      <div className="space-y-4 sm:space-y-6">
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

      {/* Financial Summary Block - Refined Visual Weight */}
      {services.length > 0 && (
        <div className="rounded-[40px] border border-white/5 bg-white/[0.01] p-12 text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 mb-10">Financial Summary</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20">
            <StatItem label="Log Entries" value={services.length.toString()} />
            <div className="hidden sm:block w-px h-12 bg-white/5" />
            <StatItem label="Lifetime Spend" value={formatCurrency(totalSpent, displayCurrency)} highlight="blue" />
          </div>
        </div>
      )}
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { preferences, formatDistance } = usePreferences();

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const contentId = `service-content-${service.id}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this service record? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteService(vehicleId, service.id);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-[32px] border transition-all duration-500 hover:shadow-2xl ${
        isExpanded 
          ? 'border-white/15 bg-white/[0.04] shadow-3xl ring-1 ring-white/10' 
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
      } ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
      {/* Clickable Summary Area */}
      <button 
        type="button"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="w-full text-left p-5 sm:p-7 flex items-center justify-between gap-4 outline-none transition-colors group-focus-visible:bg-white/5"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Status Indicator / Icon */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500 ${
            isExpanded 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
          }`}>
            <Wrench size={18} strokeWidth={1.5} />
          </div>
          
          <div className="min-w-0 flex-1 space-y-1">
             <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1.5 pr-2">
                <h3 className={`text-[17px] font-black italic tracking-tight uppercase truncate transition-colors leading-tight ${
                  isExpanded ? 'text-white' : 'text-white/80 group-hover:text-white'
                }`}>
                  {service.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] ring-1 ring-inset ${
                    service.type === 'workshop' 
                      ? 'bg-blue-500/10 text-blue-400/80 ring-blue-500/20' 
                      : 'bg-green-500/10 text-green-400/80 ring-green-500/20'
                  }`}>
                    {service.type}
                  </span>
                  {service.isMainService && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-white/40 ring-1 ring-inset ring-white/20">
                      MAIN
                    </span>
                  )}
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                   <Calendar size={10} className="text-white/20" />
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">{service.date}</p>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-1.5">
                   <Gauge size={10} className="text-white/20" />
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">{formatDistance(service.rawOdometer)}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 mb-0.5 sm:block hidden">Total Cost</p>
            <p className={`text-base sm:text-xl font-black tracking-tighter leading-none transition-colors ${isExpanded ? 'text-blue-400' : 'text-white'}`}>
              {formatCurrency(service.rawCost, displayCurrency)}
            </p>
          </div>
          
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white/20 transition-all duration-500 group-hover:border-white/10 group-hover:text-white/40 ${
            isExpanded ? 'rotate-180 bg-blue-500/10 border-blue-500/20 text-blue-400' : ''
          }`}>
            <ChevronDown size={14} strokeWidth={3} />
          </div>
        </div>
      </button>

      {/* Expanded Details Area - Robust Height Animation using Grid */}
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
              <DetailBox label="Service Type" value={service.type} highlight={service.type === 'workshop' ? 'blue' : 'green'} />
              <DetailBox label="Date Recorded" value={service.date} />
              <DetailBox label="Mileage" value={formatDistance(service.rawOdometer)} />
              <DetailBox label="Total Expense" value={formatCurrency(service.rawCost, displayCurrency)} highlight="white" />
          </div>
            {/* Content & Actions Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-10">
                <div className="space-y-10">
                  {service.notes && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Entry Notes</p>
                      <div className="rounded-[28px] bg-white/[0.01] border border-white/5 p-7 relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
                        <p className="text-[13px] font-medium leading-relaxed text-white/60 italic">
                          “{service.notes}”
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Documentation & Media</p>
                    <ServiceAttachmentsDisplay 
                      vehicleId={vehicleId} 
                      serviceId={service.id} 
                      attachments={service.attachments} 
                    />
                  </div>
                </div>

                {/* Sidebar Quick Actions */}
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white/5 p-7 space-y-5 shadow-xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Record Management</p>
                      <div className="grid grid-cols-1 gap-3.5">
                        <Link 
                          href={`/vehicles/${vehicleId}/service/${service.id}/edit`}
                          onClick={handleEdit}
                          className="flex h-12 items-center justify-center gap-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.95] shadow-lg"
                        >
                          <Edit3 size={14} />
                          Edit Record
                        </Link>
                        <button 
                          type="button"
                          onClick={handleDelete}
                          disabled={isPending || isDeleting}
                          className="flex h-12 items-center justify-center gap-3 rounded-2xl bg-red-500/10 text-red-500/60 border border-red-500/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-500/20 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
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
      </div>    </div>
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
        <div className="absolute -inset-4 rounded-full bg-blue-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/10 group-hover:text-white/30 transition-colors shadow-2xl">
          <Wrench size={40} strokeWidth={1} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white/60 uppercase italic tracking-tight">No maintenance records</h3>
      <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/20 mb-10">
        Start building your vehicle's value by logging its maintenance history.
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

function StatItem({ label, value, highlight }: { label: string; value: string; highlight?: 'blue' }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 leading-none">{label}</p>
      <p className={`text-3xl font-black italic tracking-tighter leading-none ${highlight === 'blue' ? 'text-blue-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
