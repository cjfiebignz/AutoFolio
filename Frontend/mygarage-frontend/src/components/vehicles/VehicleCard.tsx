'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserVehicle } from '@/types/autofolio';
import { mapToRemindersViewModel } from '@/lib/mappers/reminder';
import { mapToVehicleViewModel } from '@/lib/mappers/vehicle';
import { mapToDocumentsViewModel } from '@/lib/mappers/document';
import { evaluateVehicleSummaryAttention } from '@/lib/attention-utils';
import { Bell, ArrowRight, Edit3, Trash2, Camera, Wrench, Briefcase, AlertCircle, AlertTriangle, Lock, Info, X, Loader2 } from 'lucide-react';
import { deleteVehicle } from '@/lib/api';
import { useState, useTransition, useEffect } from 'react';
import { normalizeCrop, getCropTransform } from '@/lib/cropUtils';
import { usePlan } from '@/lib/plan-context';
import { useActionConfirm } from '@/lib/use-action-confirm';
import { InlineErrorMessage } from '../ui/ActionFeedback';

import { normalizeImageUrl } from '@/lib/image-utils';
import { MaintenanceStatusBadge, MaintenanceStatus } from './MaintenanceStatusBadge';

interface VehicleCardProps {
  vehicle: UserVehicle;
}

export function VehicleCard({ vehicle: rawVehicle }: VehicleCardProps) {
  const router = useRouter();
  const { refreshPlan, openUpgradeModal } = usePlan();
  const [isPending, startTransition] = useTransition();
  
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

  const vehicle = mapToVehicleViewModel(rawVehicle);
  const reminders = mapToRemindersViewModel(rawVehicle.reminders || []);
  const documents = mapToDocumentsViewModel(rawVehicle.documents || []);

  const isLocked = vehicle.isLocked;

  const summaryAttention = evaluateVehicleSummaryAttention({
    vehicle,
    reminders,
    documents,
    serviceSummary: rawVehicle.serviceSummary
  });

  // Normalize coordinates (legacy 0-100 to 0-1)
  const x = normalizeCrop(rawVehicle.bannerCropX);
  const y = normalizeCrop(rawVehicle.bannerCropY);

  const handleClick = (e: React.MouseEvent) => {
    if (confirmDelete) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isLocked) {
      e.preventDefault();
      // Force trigger the upgrade modal with specific messaging
      openUpgradeModal({
        title: "Vehicle Locked",
        message: "This vehicle is currently locked because it exceeds your plan limit. Upgrade to Premium to unlock full access to all your vehicles.",
        features: ["Manage Unlimited Vehicles", "Full Service History", "Secure Document Storage", "SpecHUB Technical Data"]
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirmDelete) {
      enterConfirm();
      return;
    }

    startAction();
    try {
      await deleteVehicle(vehicle.id);
      await refreshPlan();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      failAction(err.message || 'Failed to delete vehicle');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLocked) {
      openUpgradeModal({
        title: "Vehicle Locked",
        message: "You cannot edit a locked vehicle. Upgrade to Premium to unlock management controls for your entire fleet.",
        features: ["Manage Unlimited Vehicles", "Full Service History", "Secure Document Storage", "SpecHUB Technical Data"]
      });
      return;
    }

    router.push(`/vehicles/${vehicle.id}/edit`);
  };

  return (
    <Link 
      href={`/vehicles/${vehicle.id}`}
      onClick={handleClick}
      className={`group relative flex flex-col overflow-hidden rounded-[40px] border transition-all duration-500 ${
        isLocked 
          ? 'border-subtle bg-card-overlay opacity-60 grayscale-[0.5]' 
          : 'border-subtle bg-card-overlay hover:border-border-strong hover:shadow-2xl active:scale-[0.99]'
      } p-8 ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''} ${confirmDelete ? 'border-red-500/30' : ''}`}
    >
      {/* Background Layer */}
      {rawVehicle.bannerImageUrl ? (
        <>
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src={normalizeImageUrl(rawVehicle.bannerImageUrl)} 
              alt="" 
              className="select-none"
              style={getCropTransform(x, y, rawVehicle.bannerZoom || 1)}
            />
          </div>
          {/* Overlays for readability */}
          <div className={`absolute inset-0 z-0 transition-colors ${isLocked ? 'bg-black/80' : 'bg-black/60 group-hover:bg-black/50'} ${confirmDelete ? 'bg-black/90' : ''}`} />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-surface via-background/20 to-transparent" />
        </>
      ) : (
        /* Decorative gradient background element for no-banner state */
        <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full ${confirmDelete ? 'bg-red-500/5' : 'bg-foreground/5'} blur-3xl transition-all group-hover:bg-foreground/10`} />
      )}
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className={`text-3xl font-black italic tracking-tighter uppercase drop-shadow-lg transition-colors ${isLocked ? 'text-foreground/40' : 'text-foreground group-hover:text-foreground/90'}`}>
              {vehicle.nickname}
            </h2>
            {vehicle.isActive && !isLocked && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
            )}
            {isLocked && (
              <div className="flex items-center gap-1.5 rounded-full bg-card-overlay px-2.5 py-1 border border-subtle">
                <Lock size={10} className="text-muted" />
                <span className="text-[8px] font-black uppercase tracking-widest text-muted">Locked on Free</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className={`text-[11px] font-bold uppercase tracking-tight ${isLocked ? 'text-muted' : 'text-foreground/60'}`}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <div className="flex items-center gap-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLocked ? 'text-dim' : 'text-muted'}`}>
                {vehicle.licensePlate}
              </p>
              {!isLocked && rawVehicle.serviceSummary && (
                <>
                  <span className="h-1 w-1 rounded-full bg-foreground/20" />
                  <MaintenanceStatusBadge 
                    status={rawVehicle.serviceSummary.status as MaintenanceStatus} 
                    size="sm" 
                    className="py-0.5 px-2" 
                  />
                </>
              )}
              {vehicle.lastServiceDate && !isLocked && (
                <>
                  <span className="h-1 w-1 rounded-full bg-foreground/20" />
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted">
                    Last Service: {vehicle.lastServiceDate}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {confirmDelete && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelConfirm(); }}
              disabled={isDeleting}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/10 text-muted hover:text-foreground transition-all backdrop-blur-md border border-subtle"
              title="Cancel"
            >
              <X size={18} />
            </button>
          )}

          {!isLocked && !confirmDelete && (
            <button
              type="button"
              onClick={handleEdit}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/5 text-muted hover:text-foreground transition-all backdrop-blur-md border border-subtle"
              title="Edit Vehicle"
            >
              <Edit3 size={16} />
            </button>
          )}
          
          <button 
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex items-center justify-center rounded-2xl transition-all backdrop-blur-md border ${
              confirmDelete 
                ? 'bg-red-500 text-white px-4 h-10 text-[9px] font-black uppercase tracking-widest' 
                : isLocked 
                  ? 'bg-foreground/5 text-muted border-subtle hover:bg-red-500/10 hover:text-red-500/40 hover:border-red-500/20 h-10 w-10' 
                  : 'bg-red-500/10 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 border-red-500/10 h-10 w-10'
            }`}
            title={confirmDelete ? "Click to confirm deletion" : "Delete Vehicle"}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : confirmDelete ? 'Confirm' : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      <div className="mt-12 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-left-2 duration-300">
              <AlertCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Delete vehicle and all technical history?</span>
            </div>
          ) : !isLocked ? (
            <>
              <div className="flex items-center gap-3 pr-2">
                <div className="flex items-center gap-1.5" title="Photos">
                  <Camera size={12} className="text-muted" />
                  <span className="text-[10px] font-bold text-foreground/50">{vehicle.photoCount}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Service History">
                  <Wrench size={12} className="text-muted" />
                  <span className="text-[10px] font-bold text-foreground/50">{vehicle.serviceCount}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Work Log Items">
                  <Briefcase size={12} className="text-muted" />
                  <span className="text-[10px] font-bold text-foreground/50">{vehicle.workCount}</span>
                </div>
              </div>

              <div className="h-4 w-px bg-foreground/10" />

              {/* Identification */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-tight text-muted">
                  {vehicle.vin && vehicle.vin !== 'NO VIN' ? `${vehicle.vin.substring(0, 4)}...${vehicle.vin.substring(vehicle.vin.length - 4)}` : 'NO VIN'}
                </span>
              </div>

              {/* Alerts Notifier */}
              {summaryAttention.hasAlerts && (
                <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                  summaryAttention.highestSeverity === 'critical' 
                    ? 'bg-red-500/10 text-red-500 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                    : 'bg-yellow-500/10 text-yellow-500 ring-yellow-500/20'
                }`}>
                  {summaryAttention.highestSeverity === 'critical' 
                    ? <AlertCircle size={12} strokeWidth={3} className="animate-pulse" />
                    : <AlertTriangle size={12} strokeWidth={3} />
                  }
                  {summaryAttention.summaryLabel}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-dim">
              <Info size={12} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Upgrade to view details and history</span>
            </div>
          )}
        </div>
        
        {!confirmDelete && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xl transition-all ${
            isLocked 
              ? 'bg-foreground/5 text-dim' 
              : 'bg-foreground text-background group-hover:translate-x-1 group-hover:scale-110'
          }`}>
            {isLocked ? <Lock size={16} /> : <ArrowRight size={18} strokeWidth={3} />}
          </div>
        )}
      </div>

      <InlineErrorMessage 
        message={errorMessage} 
        onClear={() => setErrorMessage(null)} 
        className="mt-4 relative z-10"
      />
    </Link>
  );
}
