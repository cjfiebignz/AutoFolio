'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Bell, 
  FileText, 
  Info, 
  Wrench, 
  RefreshCw, 
  Plus, 
  Edit3, 
  ArrowRight, 
  Trash2,
  X,
  Loader2,
  Landmark,
  AlertTriangle,
  ChevronRight,
  Check
} from 'lucide-react';
import { VehicleViewModel } from "@/lib/mappers/vehicle";
import { ServiceEntryViewModel, ServiceSummaryViewModel } from "@/lib/mappers/service";
import { WorkJobViewModel } from "@/lib/mappers/work";
import { DocumentViewModel } from "@/lib/mappers/document";
import { Reminder, LifetimeCostSummary } from "@/types/autofolio";
import { formatDisplayDate, getExpiryStatus, getRelativeTimeText, formatLifecycleStatus, formatNumber, formatCurrency } from "@/lib/date-utils";
import { usePreferences } from '@/lib/preferences';
import { evaluateVehicleAttention, AttentionItem } from '@/lib/attention-utils';
import { mapToRemindersViewModel, ReminderViewModel } from "@/lib/mappers/reminder";
import { updateReminderStatus, deleteReminder } from '@/lib/api';
import { ExportHistoryButton } from './ExportHistoryButton';
import { ShareReportAction } from './ShareReportAction';
import { VehicleCalendarModal } from './VehicleCalendarModal';
import { MaintenanceStatusBadge, MaintenanceStatus } from './MaintenanceStatusBadge';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';
import { isMaintenanceAcknowledged, acknowledgeMaintenance } from '@/lib/maintenance-ack-utils';
import { RenewalModal } from './RenewalModal';

interface OverviewProps {
  vehicle: VehicleViewModel;
  services: ServiceEntryViewModel[];
  workItems: WorkJobViewModel[];
  documents: DocumentViewModel[];
  rawReminders: Reminder[];
  serviceSummary?: ServiceSummaryViewModel | null;
  costSummary?: LifetimeCostSummary | null;
}

export function VehicleOverviewDisplay({ 
  vehicle, 
  services = [], 
  workItems = [], 
  documents = [],
  rawReminders = [],
  serviceSummary = null,
  costSummary = null
}: OverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { formatDistance, mounted } = usePreferences();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Renewal Modal State
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalType, setRenewalType] = useState<'registration' | 'insurance'>('registration');

  // Map reminders on the client-side to ensure "now" is consistent with other UI checks
  const reminders = useMemo(() => mapToRemindersViewModel(rawReminders || []), [rawReminders]);

  // Acknowledgement Persistence Logic (Hardened & Isolated per Vehicle)
  useEffect(() => {
    if (!mounted || !serviceSummary) return;
    
    // Use the centralized utility with 'main-service' as the specific alertKey for this panel
    if (isMaintenanceAcknowledged(vehicle.id, 'main-service', serviceSummary.status)) {
      setIsAcknowledged(true);
    } else {
      setIsAcknowledged(false);
    }
  }, [mounted, vehicle.id, serviceSummary?.status]);

  const handleAcknowledge = () => {
    if (!serviceSummary) return;
    // Persist via centralized utility
    acknowledgeMaintenance(vehicle.id, 'main-service', serviceSummary.status);
    setIsAcknowledged(true);
  };

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

  const openRegistrationRenewal = () => {
    setRenewalType('registration');
    setIsRenewalModalOpen(true);
  };

  const openInsuranceRenewal = () => {
    setRenewalType('insurance');
    setIsRenewalModalOpen(true);
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
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-none">Vehicle Overview</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent opacity-70">Primary Portfolio Dashboard</p>
        </div>
      </div>

      {/* Maintenance Panel (No Header) */}
      {!isAcknowledged && serviceSummary && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <MaintenanceIntelligencePanel 
            vehicleId={vehicle.id} 
            serviceSummary={serviceSummary} 
            onAcknowledge={handleAcknowledge}
          />
        </section>
      )}

      {/* Primary Lifecycle Card */}
      <div className="overflow-hidden rounded-[40px] border border-border-strong bg-gradient-to-br from-foreground/[0.03] dark:from-foreground/[0.05] to-transparent p-8 shadow-premium backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Ownership Lifecycle</span>
            <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">Active Ownership</h2>
            <p className="text-sm font-medium text-muted italic">Secured for {vehicle.ownershipDuration}</p>
          </div>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="h-12 w-12 flex items-center justify-center rounded-[20px] bg-card-overlay border border-border-strong text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all shadow-xl active:scale-95"
            title="Open Vehicle Calendar"
          >
            <Calendar size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border-subtle pt-8">
          {(() => {
            const status = formatLifecycleStatus(vehicle.registrationExpiryDate, vehicle.registrationStatus);
            
            return (
              <LifecycleItem 
                label="Registration" 
                value={status.label} 
                secondaryText={status.subLabel}
                status={status.tone}
                href={`/vehicles/${vehicle.id}/registration`}
                onRenew={vehicle.hasRegistration ? openRegistrationRenewal : undefined}
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
                onRenew={vehicle.hasInsurance ? openInsuranceRenewal : undefined}
              />
            );
          })()}
        </div>

        {/* Service Snapshot Integration */}
        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-border-subtle pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-dim">
              <Wrench size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Last Main Service</span>
            </div>
            <div className="space-y-1 px-1">
              <p className="text-[13px] font-black italic tracking-tight text-foreground/90 uppercase leading-none">
                {serviceSummary?.lastServiceDate ? formatDisplayDate(serviceSummary.lastServiceDate) : "Not recorded"}
              </p>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                {serviceSummary?.lastServiceKms ? formatDistance(serviceSummary.lastServiceKms) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${
              serviceSummary?.status === 'overdue' ? 'text-red-500' :
              serviceSummary?.status === 'due_soon' ? 'text-yellow-600 dark:text-yellow-500' :
              'text-accent'
            }`}>
              <RefreshCw size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Next Service Due</span>
            </div>
            <div className="space-y-1 px-1">
              <div className="flex flex-col">
                <p className={`text-[13px] font-black italic tracking-tight uppercase leading-none ${
                  serviceSummary?.status === 'overdue' ? 'text-red-500' :
                  serviceSummary?.status === 'due_soon' ? 'text-yellow-600 dark:text-yellow-500' :
                  'text-accent'
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
                      serviceSummary.status === 'overdue' ? 'text-red-500/50' :
                      serviceSummary.status === 'due_soon' ? 'text-yellow-600/50 dark:text-yellow-500/30' :
                      'text-accent opacity-40'
                    }`}>
                      {combinedText}
                    </p>
                  );
                })()}
              </div>
              {!serviceSummary?.nextServiceDueDate && serviceSummary?.nextServiceDueKms && (
                <p className="text-[10px] font-black text-accent opacity-40 uppercase tracking-widest pt-1">
                  {formatDistance(serviceSummary.nextServiceDueKms)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Management Actions */}
      <section className="space-y-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Management Command</h3>
        
        {/* Primary Actions Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
            href={`/vehicles/${vehicle.id}/registration`}
            icon={<Landmark size={18} />}
            label="Registration"
          />
          <ActionButton 
            href={`/vehicles/${vehicle.id}/insurance`}
            icon={<ShieldCheck size={18} />}
            label="Insurance"
          />
          <ActionButton 
            href={`/vehicles/${vehicle.id}/documents/new`}
            icon={<FileText size={18} />}
            label="Add Record"
          />
        </div>

        {/* Secondary Output & Share Row */}
        <div className="grid grid-cols-2 gap-4 pt-2">
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
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Upcoming Reminders</h3>
            <Link href={`/vehicles/${vehicle.id}/reminders/new`} className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all underline underline-offset-4 decoration-border-subtle hover:decoration-border-strong">
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
          <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted">System Alerts</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {attentionItems.map((item) => (
              <Link 
                key={item.key} 
                href={item.href || '#'}
                className={`flex flex-col gap-1 rounded-3xl border p-5 text-xs font-black uppercase tracking-widest ring-1 ring-inset transition-all hover:scale-[1.01] active:scale-[0.99] ${
                  item.severity === 'critical' ? 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400/90 ring-red-500/10' :
                  item.severity === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-700 dark:text-yellow-500/90 ring-yellow-500/10' :
                  'border-border-subtle bg-card-overlay text-muted ring-border-subtle'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="shrink-0">{getAttentionIcon(item)}</div>
                  <span className="leading-tight">{item.title}</span>
                </div>
                {item.subLabel && (
                  <span className={`text-[8px] font-black tracking-[0.2em] ml-5 leading-tight ${
                    item.severity === 'critical' ? 'text-red-500/50' :
                    item.severity === 'warning' ? 'text-yellow-600/50 dark:text-yellow-500/50' :
                    'text-muted'
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
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Portfolio Value & Spend</h3>
        <LifetimeCostSummaryPanel 
          costSummary={costSummary}
        />
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Recent Journal</h3>
        <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-1.5 backdrop-blur-sm shadow-sm">
          {!hasHistory ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-card-overlay border border-border-subtle text-dim">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold text-dim uppercase tracking-widest italic">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
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
      <RenewalModal 
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        vehicleId={vehicle.id}
        type={renewalType}
        currentRecordId={(renewalType === 'registration' ? vehicle.currentRegistrationId : vehicle.currentInsuranceId) || ''}
        providerName={renewalType === 'insurance' ? vehicle.currentInsuranceProvider : undefined}
      />
    </div>
  );
}

function MaintenanceIntelligencePanel({ 
  vehicleId, 
  serviceSummary,
  onAcknowledge
}: { 
  vehicleId: string; 
  serviceSummary?: ServiceSummaryViewModel | null;
  onAcknowledge: () => void;
}) {
  const { formatDistance } = usePreferences();
  
  if (!serviceSummary) return null;

  const { status, kmsUntilNextService, nextServiceDueDate, hasEnoughData } = serviceSummary;

  const config = {
    overdue: {
      label: 'Service Overdue',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-500',
    },
    due_soon: {
      label: 'Service Due Soon',
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
    },
    up_to_date: {
      label: 'Maintenance On Track',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-600 dark:text-green-500',
    },
    insufficient_data: {
      label: 'No Service Baseline',
      color: 'text-muted',
      bgColor: 'bg-card-overlay',
      borderColor: 'border-border-subtle',
      iconColor: 'text-dim',
    }
  }[status] || {
    label: 'Maintenance Status',
    color: 'text-muted',
    bgColor: 'bg-card-overlay',
    borderColor: 'border-border-subtle',
    iconColor: 'text-dim',
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
    <div 
      className={`group relative flex items-center justify-between overflow-hidden rounded-[32px] border ${config.borderColor} ${config.bgColor} p-6 shadow-premium transition-all hover:scale-[1.01]`}
    >
      <Link 
        href={`/vehicles/${vehicleId}?tab=service`}
        className="flex flex-1 items-center gap-5"
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-card-overlay border border-border-strong ${config.iconColor}`}>
          <Wrench size={24} strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-black italic tracking-tight uppercase leading-none ${config.color}`}>
              {config.label}
            </h3>
            <MaintenanceStatusBadge status={status as MaintenanceStatus} size="sm" className="px-2 py-0.5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">
            {getSubLabel()}
          </p>
        </div>
      </Link>

      {/* Action Column */}
      <div className="flex flex-col gap-2 ml-4">
        <Link 
          href={`/vehicles/${vehicleId}?tab=service`}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-card-overlay border border-border-subtle text-dim hover:text-muted hover:border-border-strong transition-all shadow-sm active:scale-90"
          title="View Service Details"
        >
          <ArrowRight size={20} />
        </Link>
        <button
          type="button"
          onClick={onAcknowledge}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-card-overlay border border-border-subtle text-dim hover:text-green-500 hover:border-green-500/20 transition-all shadow-sm active:scale-90"
          title="Acknowledge Status"
        >
          <Check size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

interface LifecycleItemProps {
  label: string;
  value: string;
  secondaryText?: string;
  status: 'success' | 'warning' | 'neutral';
  href?: string;
  onRenew?: () => void;
}

function LifecycleItem({ label, value, secondaryText, status, href, onRenew }: LifecycleItemProps) {
  const content = (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted group-hover:text-foreground transition-colors">{label}</p>
        {onRenew && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRenew();
            }}
            className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20"
          >
            Renew
          </button>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className={`h-2 w-2 rounded-full ${
            status === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
            status === 'warning' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-muted opacity-40'
          }`} />
          <p className="text-sm font-black text-foreground opacity-90 group-hover:text-foreground transition-colors">{value}</p>
          {href && (
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={14} className="text-dim" />
            </div>
          )}
        </div>
        {secondaryText && (
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest pl-[1.125rem]">
            {secondaryText}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block rounded-2xl bg-card-overlay border border-border-subtle p-4 transition-all hover:bg-card-overlay-hover hover:border-border-strong">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-card-overlay border border-border-subtle p-4">
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
    <Link href={href} className="group flex flex-col items-center justify-center gap-3 rounded-[24px] border border-border-subtle bg-card-overlay py-6 transition-all hover:bg-card-overlay-hover hover:border-border-strong hover:shadow-xl active:scale-[0.97]">
      <div className="text-dim group-hover:text-foreground group-hover:scale-110 transition-all">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-foreground transition-colors text-center px-2">{label}</span>
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
    <div className="flex items-center gap-4 py-3 px-4 transition-colors hover:bg-card-overlay-hover">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card-overlay border border-border-subtle text-dim transition-all group-hover:text-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-0.5">{title}</p>
        <p className="truncate text-xs font-bold text-foreground/80 group-hover:text-foreground transition-colors uppercase italic">{value}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-dim group-hover:text-muted transition-colors">{date}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block transition-all">
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
    <div className="overflow-hidden rounded-[32px] border border-border-subtle bg-card-overlay p-8 shadow-premium transition-all hover:bg-card-overlay-hover group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted group-hover:text-foreground/40 transition-colors">Total Lifetime Spend</p>
          <p className="text-4xl font-black italic tracking-tighter text-blue-600 dark:text-blue-400 uppercase leading-none">
            {formatCurrency(totalLifetimeSpend, displayCurrency)}
          </p>
        </div>
        
        <div className="flex gap-10 border-l border-border-subtle pl-0 sm:pl-10 sm:border-solid border-none">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Service Spend</p>
            <p className="text-lg font-black italic tracking-tight text-foreground/70 uppercase leading-none">
              {formatCurrency(totalServiceSpend, displayCurrency)}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Work Spend</p>
            <p className="text-lg font-black italic tracking-tight text-foreground/70 uppercase leading-none">
              {formatCurrency(totalWorkSpend, displayCurrency)}
            </p>
          </div>
        </div>
      </div>
    </div>
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
  const { 
    isActioning: isDeleting, 
    confirmState: confirmDelete, 
    errorMessage, 
    enterConfirm, 
    cancelConfirm,
    startAction,
    failAction,
    setErrorMessage
  } = useActionConfirm();

  const urgencyStyles = {
    overdue: 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400/90 ring-red-500/10',
    soon: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-700 dark:text-yellow-500/90 ring-yellow-500/10',
    upcoming: 'border-border-subtle bg-card-overlay text-muted ring-border-subtle'
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      enterConfirm(reminder.id);
      return;
    }

    startAction(reminder.id);
    try {
      await deleteReminder(vehicleId, reminder.id);
      router.refresh();
    } catch (err: any) {
      failAction(err.message || 'Failed to delete reminder');
    }
  };

  return (
    <div className={`flex flex-col rounded-[24px] border transition-all hover:shadow-lg ring-1 ring-inset ${urgencyStyles[reminder.urgency]} ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current opacity-10`}>
            <Bell size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black truncate text-foreground uppercase italic tracking-tight">{reminder.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`h-1 w-1 rounded-full bg-current opacity-40`} />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {reminder.urgency === 'overdue' ? 'Overdue' : reminder.urgency === 'soon' ? `In ${reminder.daysRemaining} days` : reminder.dueDate}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!confirmDelete && (
            <>
              <Link 
                href={`/vehicles/${vehicleId}/reminders/${reminder.id}/edit`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-overlay text-dim hover:bg-card-overlay-hover hover:text-muted transition-all backdrop-blur-md border border-border-subtle"
                title="Edit Reminder"
              >
                <Edit3 size={14} />
              </Link>
              <button 
                type="button"
                onClick={onDone}
                disabled={isPending || isDeleting}
                className="flex h-10 items-center justify-center rounded-xl bg-card-overlay px-4 text-[10px] font-black uppercase tracking-widest text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all disabled:opacity-50 border border-border-subtle"
                title="Mark Done"
              >
                {isPending ? '...' : 'Done'}
              </button>
            </>
          )}

          {confirmDelete && (
            <button 
              type="button"
              onClick={() => cancelConfirm()}
              disabled={isDeleting}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-overlay text-muted hover:text-foreground transition-all border border-border-subtle"
              title="Cancel"
            >
              <X size={14} />
            </button>
          )}

          <button 
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex h-10 items-center justify-center rounded-xl transition-all disabled:opacity-50 border ${
              confirmDelete 
                ? 'bg-red-500 text-white px-4 text-[10px] font-black uppercase tracking-widest border-red-500/20 hover:bg-red-600' 
                : 'bg-red-500/10 text-red-600 dark:text-red-500/40 w-10 border-red-500/10 hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-500'
            }`}
            title={confirmDelete ? 'Click to confirm deletion' : 'Delete Reminder'}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : confirmDelete ? 'Confirm' : <Trash2 size={14} />}
          </button>
        </div>
      </div>
      
      <InlineErrorMessage 
        message={errorMessage} 
        onClear={() => setErrorMessage(null)} 
        className="px-4 pb-4"
      />
    </div>
  );
}
