'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VehicleViewModel } from "@/lib/mappers/vehicle";
import { ServiceEntryViewModel } from "@/lib/mappers/service";
import { WorkJobViewModel } from "@/lib/mappers/work";
import { DocumentViewModel } from "@/lib/mappers/document";
import { ReminderViewModel } from "@/lib/mappers/reminder";
import { updateReminderStatus, deleteReminder } from '@/lib/api';
import { ServiceSummary, LifetimeCostSummary } from "@/types/autofolio";
import { formatDisplayDate, getExpiryStatus, getRelativeTimeText, formatLifecycleStatus, formatNumber, formatCurrency } from "@/lib/date-utils";
import { usePreferences } from '@/lib/preferences';
import { evaluateVehicleAttention, AttentionItem } from '@/lib/attention-utils';
import { Bell, Wrench, FileText, Edit3, Calendar, Plus, Trash2, ArrowRight, Clock, RefreshCw, ShieldCheck, Info, FileDown } from 'lucide-react';
import { VehicleCalendarModal } from './VehicleCalendarModal';
import { ExportHistoryButton } from './ExportHistoryButton';
import { ShareReportAction } from './ShareReportAction';
import { MaintenanceStatusBadge, MaintenanceStatus } from './MaintenanceStatusBadge';

interface OverviewProps {
  vehicle: VehicleViewModel;
  services: ServiceEntryViewModel[];
  workItems: WorkJobViewModel[];
  documents: DocumentViewModel[];
  reminders: ReminderViewModel[];
  serviceSummary?: ServiceSummary['serviceSummary'] | null;
  costSummary?: LifetimeCostSummary | null;
}

export function VehicleOverviewDisplay({ 
  vehicle, 
  services, 
  workItems, 
  documents,
  reminders,
  serviceSummary,
  costSummary
}: OverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { formatDistance, mounted } = usePreferences();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleMarkReminderDone = async (reminderId: string) => {
    try {
      await updateReminderStatus(vehicle.id, reminderId, 'done');
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Failed to update reminder:', err);
    }
  };

  const hasHistory = services.length > 0 || workItems.length > 0 || documents.length > 0 || reminders.length > 0;
  
  // Unified Attention Engine
  const attentionItems = evaluateVehicleAttention({
    vehicle,
    reminders,
    serviceSummary,
    documents
  });

  const getAttentionIcon = (item: AttentionItem) => {
    switch (item.category) {
      case 'registration':
      case 'service':
        if (item.severity === 'critical') return <Clock size={14} className="text-red-500" />;
        if (item.severity === 'warning') return <Clock size={14} className="text-yellow-500" />;
        return <Clock size={14} />;
      case 'insurance':
        if (item.severity === 'critical') return <ShieldCheck size={14} className="text-red-500" />;
        if (item.severity === 'warning') return <ShieldCheck size={14} className="text-yellow-500" />;
        return <ShieldCheck size={14} />;
      case 'reminder':
        return <Bell size={14} className={item.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />;
      case 'documents':
        return <FileText size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-10">
      {/* Tab Header */}
      <div className="px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Vehicle Overview</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Primary Portfolio Dashboard</p>
        </div>
      </div>

      {/* Maintenance Intelligence */}
      <section className="space-y-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Maintenance Intelligence</h3>
        <MaintenanceIntelligencePanel vehicleId={vehicle.id} serviceSummary={serviceSummary} />
      </section>

      {/* Primary Lifecycle Card */}
      <div className="overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Ownership Lifecycle</span>
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Active Ownership</h2>
            <p className="text-sm font-medium text-white/50 italic">Secured for {vehicle.ownershipDuration}</p>
          </div>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="h-12 w-12 flex items-center justify-center rounded-[20px] bg-white/5 border border-white/10 text-white/20 hover:bg-white/10 hover:text-white transition-all shadow-xl active:scale-95"
            title="Open Vehicle Calendar"
          >
            <Calendar size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/5 pt-8">
          {(() => {
            const status = formatLifecycleStatus(vehicle.registrationExpiryDate, vehicle.registrationStatus);
            
            return (
              <LifecycleItem 
                label="Registration" 
                value={status.label} 
                secondaryText={status.subLabel}
                status={status.tone}
                href={`/vehicles/${vehicle.id}/registration`}
              />
            );
          })()}

          {(() => {
            const status = formatLifecycleStatus(vehicle.insuranceExpiryDate, vehicle.insuranceStatus, 'Covered');
            
            return (
              <LifecycleItem 
                label="Insurance" 
                value={status.label} 
                secondaryText={status.subLabel}
                status={status.tone}
                href={`/vehicles/${vehicle.id}/insurance`}
              />
            );
          })()}
        </div>

        {/* Service Snapshot Integration */}
        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/5 pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/20">
              <Wrench size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Last Main Service</span>
            </div>
            <div className="space-y-1 px-1">
              <p className="text-[13px] font-black italic tracking-tight text-white/90 uppercase leading-none">
                {serviceSummary?.lastServiceDate ? formatDisplayDate(serviceSummary.lastServiceDate) : "Not recorded"}
              </p>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                {serviceSummary?.lastServiceKms ? formatDistance(serviceSummary.lastServiceKms) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${
              serviceSummary?.status === 'overdue' ? 'text-red-400/60' :
              serviceSummary?.status === 'due_soon' ? 'text-yellow-400/60' :
              'text-blue-400/40'
            }`}>
              <RefreshCw size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Next Service Due</span>
            </div>
            <div className="space-y-1 px-1">
              <div className="flex flex-col">
                <p className={`text-[13px] font-black italic tracking-tight uppercase leading-none ${
                  serviceSummary?.status === 'overdue' ? 'text-red-400' :
                  serviceSummary?.status === 'due_soon' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {serviceSummary?.nextServiceDueDate ? formatDisplayDate(serviceSummary.nextServiceDueDate) : "Not calculated"}
                </p>
                {(() => {
                  if (!serviceSummary) return null;
                  
                  const relText = serviceSummary.nextServiceDueDate ? getRelativeTimeText(serviceSummary.nextServiceDueDate) : '';
                  const kmText = typeof serviceSummary.kmsUntilNextService === 'number' 
                    ? (serviceSummary.kmsUntilNextService < 0 
                        ? `${formatNumber(Math.abs(serviceSummary.kmsUntilNextService))} km overdue`
                        : `${formatNumber(serviceSummary.kmsUntilNextService)} km remaining`)
                    : '';

                  const combinedText = [relText, kmText].filter(Boolean).join(' • ');

                  return combinedText && (
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                      serviceSummary.status === 'overdue' ? 'text-red-400/30' :
                      serviceSummary.status === 'due_soon' ? 'text-yellow-400/30' :
                      'text-blue-400/30'
                    }`}>
                      {combinedText}
                    </p>
                  );
                })()}
              </div>
              {!serviceSummary?.nextServiceDueDate && serviceSummary?.nextServiceDueKms && (
                <p className="text-[10px] font-black text-blue-400/30 uppercase tracking-widest pt-1">
                  {formatDistance(serviceSummary.nextServiceDueKms)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Management Actions */}
      <section className="space-y-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Management Command</h3>
        
        {/* Primary Actions Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ActionButton 
            href={`/vehicles/${vehicle.id}/service/new`}
            icon={<Plus size={20} strokeWidth={3} />}
            label="Log Service"
          />
          <ActionButton 
            href={`/vehicles/${vehicle.id}/work/new`}
            icon={<Wrench size={18} />}
            label="Add Job"
          />
          <ActionButton 
            href={`/vehicles/${vehicle.id}/reminders/new`}
            icon={<Bell size={18} />}
            label="Set Reminder"
          />
          <ActionButton 
            href={`/vehicles/${vehicle.id}/documents/new`}
            icon={<FileText size={18} />}
            label="Add Record"
          />
        </div>

        {/* Secondary Output & Share Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <ExportHistoryButton 
            vehicleId={vehicle.id} 
            vehicleNickname={vehicle.nickname}
            variant="horizontal" 
          />
          <ShareReportAction 
            vehicleId={vehicle.id}
            isPublic={vehicle.publicShareEnabled}
            shareToken={vehicle.publicShareToken}
            variant="horizontal"
          />
        </div>
      </section>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-blue-400/60">Upcoming Reminders</h3>
            <Link href={`/vehicles/${vehicle.id}/reminders/new`} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all underline underline-offset-4 decoration-white/5 hover:decoration-white/20">
              Create New
            </Link>
          </div>
          <div className="grid gap-3">
            {reminders
              .filter(r => typeof r.daysRemaining === 'number' && r.daysRemaining <= 61) // Only show reminders due within ~2 months
              .slice(0, 3)
              .map((reminder) => (
                <ReminderItem 
                  key={reminder.id} 
                  reminder={reminder} 
                  isPending={isPending}
                  onDone={() => handleMarkReminderDone(reminder.id)}
                  vehicleId={vehicle.id}
                />
              ))}
          </div>
        </section>
      )}

      {/* Attention / Alerts */}
      {attentionItems.length > 0 && (
        <section className="space-y-4">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">System Alerts</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {attentionItems.map((item) => (
              <Link 
                key={item.key} 
                href={item.href || '#'}
                className={`flex flex-col gap-1 rounded-3xl border p-5 text-xs font-black uppercase tracking-widest ring-1 ring-inset transition-all hover:scale-[1.01] active:scale-[0.99] ${
                  item.severity === 'critical' ? 'border-red-500/20 bg-red-500/5 text-red-400/90 ring-red-500/10' :
                  item.severity === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500/90 ring-yellow-500/10' :
                  'border-white/10 bg-white/5 text-white/40 ring-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="shrink-0">{getAttentionIcon(item)}</div>
                  <span className="leading-tight">{item.title}</span>
                </div>
                {item.subLabel && (
                  <span className={`text-[8px] font-black tracking-[0.2em] ml-5 leading-tight ${
                    item.severity === 'critical' ? 'text-red-500/40' :
                    item.severity === 'warning' ? 'text-yellow-500/40' :
                    'text-white/20'
                  }`}>
                    {item.subLabel}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lifetime Cost Summary */}
      <section className="space-y-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Portfolio Value & Spend</h3>
        <LifetimeCostSummaryPanel 
          costSummary={costSummary}
        />
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Recent Journal</h3>
        <div className="rounded-[40px] border border-white/5 bg-white/[0.01] p-3 backdrop-blur-sm">
          {!hasHistory ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/10">
                <Clock size={24} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold text-white/20 uppercase tracking-widest italic">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {services.length > 0 && (
                <ActivityRow 
                  icon={<Wrench size={14} />} 
                  title="Last Service" 
                  value={services[0].title} 
                  date={services[0].date} 
                  href={`/vehicles/${vehicle.id}?tab=service`}
                />
              )}
              {workItems.length > 0 && (
                <ActivityRow 
                  icon={<Edit3 size={14} />} 
                  title="Latest Job" 
                  value={workItems[0].title} 
                  date={workItems[0].date || 'Planned'} 
                  href={`/vehicles/${vehicle.id}?tab=work`}
                />
              )}
              {documents.length > 0 && (
                <ActivityRow 
                  icon={<FileText size={14} />} 
                  title="Documents" 
                  value={`${documents.length} Files Protected`} 
                  date="Active Library" 
                  href={`/vehicles/${vehicle.id}?tab=documents`}
                />
              )}
            </div>
          )}
        </div>
      </section>

      <VehicleCalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        vehicle={vehicle}
        services={services}
        workItems={workItems}
        documents={documents}
        reminders={reminders}
        serviceSummary={serviceSummary}
      />
    </div>
  );
}

interface LifecycleItemProps {
  label: string;
  value: string;
  secondaryText?: string;
  status: 'success' | 'warning' | 'neutral';
  href?: string;
}

function LifecycleItem({ label, value, secondaryText, status, href }: LifecycleItemProps) {
  const content = (
    <div className="space-y-2 group">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20 group-hover:text-white/40 transition-colors">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className={`h-2 w-2 rounded-full ${
            status === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
            status === 'warning' ? 'bg-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-white/10'
          }`} />
          <p className="text-sm font-black text-white/90 group-hover:text-white transition-colors">{value}</p>
          {href && (
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={14} className="text-white/40" />
            </div>
          )}
        </div>
        {secondaryText && (
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-[1.125rem]">
            {secondaryText}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block rounded-2xl bg-white/[0.02] border border-white/5 p-4 transition-all hover:bg-white/[0.05] hover:border-white/10">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.01] border border-white/5 p-4">
      {content}
    </div>
  );
}

interface ActionButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ href, icon, label }: ActionButtonProps) {
  return (
    <Link href={href} className="group flex flex-col items-center justify-center gap-3 rounded-[24px] border border-white/5 bg-white/[0.02] py-6 transition-all hover:bg-white/[0.06] hover:border-white/10 hover:shadow-xl active:scale-[0.97]">
      <div className="text-white/30 group-hover:text-white group-hover:scale-110 transition-all">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors text-center px-2">{label}</span>
    </Link>
  );
}

interface ActivityRowProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  date: string;
  href?: string;
}

function ActivityRow({ icon, title, value, date, href }: ActivityRowProps) {
  const content = (
    <div className="flex items-center gap-5 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white/20 transition-all group-hover:bg-white/10 group-hover:text-white">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">{title}</p>
        <p className="truncate text-sm font-black text-white/80 group-hover:text-white transition-colors">{value}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 italic group-hover:text-white/50 transition-colors">{date}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block transition-all hover:bg-white/[0.02]">
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}

function LifetimeCostSummaryPanel({ 
  costSummary
}: { 
  costSummary?: LifetimeCostSummary | null;
}) {
  const totalServiceSpend = costSummary?.totalServiceCost ?? 0;
  const totalWorkSpend = costSummary?.totalDoneWorkCost ?? 0;
  const totalLifetimeSpend = costSummary?.totalLifetimeCost ?? 0;
  const displayCurrency = costSummary?.preferredCurrencyDisplay ?? 'AUD';

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-8 shadow-xl transition-all hover:bg-white/[0.04] group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white/30 transition-colors">Total Lifetime Spend</p>
          <p className="text-4xl font-black italic tracking-tighter text-blue-400 uppercase leading-none">
            {formatCurrency(totalLifetimeSpend, displayCurrency)}
          </p>
        </div>
        
        <div className="flex gap-10 border-l border-white/5 pl-0 sm:pl-10 sm:border-solid border-none">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10">Service Spend</p>
            <p className="text-lg font-black italic tracking-tight text-white/70 uppercase leading-none">
              {formatCurrency(totalServiceSpend, displayCurrency)}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10">Work Spend</p>
            <p className="text-lg font-black italic tracking-tight text-white/70 uppercase leading-none">
              {formatCurrency(totalWorkSpend, displayCurrency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceIntelligencePanel({ 
  vehicleId, 
  serviceSummary 
}: { 
  vehicleId: string; 
  serviceSummary?: ServiceSummary['serviceSummary'] | null 
}) {
  const { formatDistance } = usePreferences();
  
  if (!serviceSummary) return null;

  const { status, kmsUntilNextService, nextServiceDueDate, hasEnoughData } = serviceSummary;

  const config = {
    overdue: {
      label: 'Service Overdue',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-500',
    },
    due_soon: {
      label: 'Service Due Soon',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      iconColor: 'text-yellow-500',
    },
    up_to_date: {
      label: 'Maintenance On Track',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-500',
    },
    insufficient_data: {
      label: 'No Service Baseline',
      color: 'text-white/60',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10',
      iconColor: 'text-white/20',
    }
  }[status] || {
    label: 'Maintenance Status',
    color: 'text-white/60',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
    iconColor: 'text-white/20',
  };

  const getSubLabel = () => {
    if (!hasEnoughData || status === 'insufficient_data') {
      return "Add a main service to enable tracking";
    }
    
    if (kmsUntilNextService !== null) {
      const absKms = Math.abs(kmsUntilNextService);
      if (kmsUntilNextService < 0) {
        return `Overdue by ${formatDistance(absKms)}`;
      } else {
        if (status === 'up_to_date') {
            return `Next service in ${formatDistance(absKms)}`;
        }
        return `Due in ${formatDistance(absKms)}`;
      }
    }
    
    if (nextServiceDueDate) {
        const rel = getRelativeTimeText(nextServiceDueDate);
        if (status === 'overdue') {
            return `Overdue ${rel.toLowerCase()}`;
        }
        return `Due ${rel.toLowerCase()}`;
    }

    return "Service tracking active";
  };

  return (
    <Link 
      href={`/vehicles/${vehicleId}?tab=service`}
      className={`group relative flex items-center justify-between overflow-hidden rounded-[32px] border ${config.borderColor} ${config.bgColor} p-6 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]`}
    >
      <div className="flex items-center gap-5">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 ${config.iconColor}`}>
          <Wrench size={24} strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-black italic tracking-tight uppercase leading-none ${config.color}`}>
              {config.label}
            </h3>
            <MaintenanceStatusBadge status={status as MaintenanceStatus} size="sm" className="px-2 py-0.5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40">
            {getSubLabel()}
          </p>
        </div>
      </div>
      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/20 group-hover:text-white/40 transition-colors">
        <ArrowRight size={20} />
      </div>
    </Link>
  );
}

interface ReminderItemProps {
  reminder: ReminderViewModel;
  onDone: () => void;
  isPending?: boolean;
}

function ReminderItem({ 
  reminder, 
  onDone,
  isPending,
  vehicleId
}: ReminderItemProps & { vehicleId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const urgencyStyles = {
    overdue: 'border-red-500/20 bg-red-500/5 text-red-400/90 ring-red-500/10',
    soon: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500/90 ring-yellow-500/10',
    upcoming: 'border-white/5 bg-white/[0.02] text-white/40 ring-white/5'
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteReminder(vehicleId, reminder.id);
      router.refresh();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className={`flex items-center justify-between rounded-[24px] border p-4 transition-all hover:shadow-lg ring-1 ring-inset ${urgencyStyles[reminder.urgency]} ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current opacity-10`}>
          <Bell size={16} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-black truncate text-white uppercase italic tracking-tight">{reminder.title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`h-1 w-1 rounded-full bg-current opacity-40`} />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              {reminder.urgency === 'overdue' ? 'Overdue' : reminder.urgency === 'soon' ? `In ${reminder.daysRemaining} days` : reminder.dueDate}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link 
          href={`/vehicles/${vehicleId}/reminders/${reminder.id}/edit`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md border border-white/5"
          title="Edit Reminder"
        >
          <Edit3 size={14} />
        </Link>
        <button 
          type="button"
          onClick={onDone}
          disabled={isPending || isDeleting}
          className="flex h-10 items-center justify-center rounded-xl bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 border border-white/5"
          title="Mark Done"
        >
          {isPending ? '...' : 'Done'}
        </button>
        <button 
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 transition-all disabled:opacity-50 border border-red-500/10"
          title="Delete Reminder"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
