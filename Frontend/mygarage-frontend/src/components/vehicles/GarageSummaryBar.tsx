'use client';

import { useState } from 'react';
import { UserVehicle } from "@/types/autofolio";
import { evaluateVehicleAttention, AttentionItem } from "@/lib/attention-utils";
import { mapToVehicleViewModel } from "@/lib/mappers/vehicle";
import { mapToRemindersViewModel } from "@/lib/mappers/reminder";
import { mapToDocumentsViewModel } from "@/lib/mappers/document";
import { AlertCircle, AlertTriangle, Bell, ChevronRight } from "lucide-react";
import { GarageAlertsModal } from "./GarageAlertsModal";

interface GarageSummaryBarProps {
  vehicles: UserVehicle[];
}

export function GarageSummaryBar({ vehicles }: GarageSummaryBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Aggregate all high-signal attention items across all vehicles
  const allAttentionItems: (AttentionItem & { vehicleName: string })[] = [];
  
  vehicles.forEach(rawVehicle => {
    const vehicle = mapToVehicleViewModel(rawVehicle);
    // Use raw reminders and map them on client to ensure "now" is consistent
    const reminders = mapToRemindersViewModel(rawVehicle.reminders || []);
    const documents = mapToDocumentsViewModel(rawVehicle.documents || []);
    
    const items = evaluateVehicleAttention({
      vehicle,
      reminders,
      documents,
      serviceSummary: rawVehicle.serviceSummary ? JSON.parse(JSON.stringify(rawVehicle.serviceSummary)) : null
    });

    // Filter for only critical and warning items
    items.filter(i => i.severity === 'critical' || i.severity === 'warning').forEach(item => {
      allAttentionItems.push({
        ...item,
        vehicleName: vehicle.nickname
      });
    });
  });

  if (allAttentionItems.length === 0) {
    return null;
  }

  const criticalCount = allAttentionItems.filter(i => i.severity === 'critical').length;
  const warningCount = allAttentionItems.filter(i => i.severity === 'warning').length;
  const vehiclesWithAlerts = new Set(allAttentionItems.map(i => i.vehicleName)).size;

  return (
    <>
      <div className="mb-8 overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.02] p-1 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-6 py-4">
          {/* Status Icon Group */}
          <div className="flex -space-x-2">
            {criticalCount > 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-4 ring-[#0b0b0c] z-20">
                <AlertCircle size={18} strokeWidth={2.5} />
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 ring-4 ring-[#0b0b0c] z-10">
                <AlertTriangle size={18} strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Text Insight */}
          <div className="flex-1 text-center sm:text-left space-y-0.5">
            <p className="text-xs font-black uppercase tracking-widest text-white/80 italic leading-none">
              {criticalCount > 0 
                ? `${criticalCount} Critical Action${criticalCount > 1 ? 's' : ''} Pending` 
                : `${warningCount} Attention Item${warningCount > 1 ? 's' : ''} Identified`}
            </p>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              Summarized across {vehiclesWithAlerts} {vehiclesWithAlerts === 1 ? 'vehicle' : 'vehicles'}
            </p>
          </div>

          {/* Action Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-3 rounded-2xl bg-white/[0.03] pl-4 pr-3 py-2 border border-white/5 transition-all hover:bg-white/5 hover:border-white/10 active:scale-95 shadow-lg"
          >
            <Bell size={12} className="text-white/20 group-hover:text-white/40 transition-colors" />
            <span className="text-[10px] font-black text-white/40 group-hover:text-white/60 uppercase tracking-tighter transition-colors">
              {allAttentionItems.length} Garage Alerts
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white/40 transition-all">
              <ChevronRight size={12} strokeWidth={3} />
            </div>
          </button>
        </div>
      </div>

      <GarageAlertsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        alerts={allAttentionItems} 
      />
    </>
  );
}
