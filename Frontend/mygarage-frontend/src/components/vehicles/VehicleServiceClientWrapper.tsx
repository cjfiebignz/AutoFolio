'use client';

import { ServiceEntryViewModel, ServiceSummaryViewModel } from "@/lib/mappers/service";
import { VehicleServiceDisplay } from "./VehicleServiceDisplay";
import { LifetimeCostSummary } from "@/types/autofolio";

interface VehicleServiceClientWrapperProps {
  vehicleId: string;
  vehicleNickname: string;
  services: ServiceEntryViewModel[];
  serviceSummary: ServiceSummaryViewModel | null;
  costSummary: LifetimeCostSummary | null;
}

/**
 * VehicleServiceClientWrapper
 * 
 * Acts as a client boundary for the service log.
 * Ensures that props passed from the server are serializable 
 * and isolates client-only logic.
 */
export function VehicleServiceClientWrapper({ 
  vehicleId, 
  vehicleNickname,
  services,
  serviceSummary,
  costSummary
}: VehicleServiceClientWrapperProps) {
  return (
    <VehicleServiceDisplay 
      vehicleId={vehicleId} 
      vehicleNickname={vehicleNickname}
      services={services} 
      serviceSummary={serviceSummary}
      costSummary={costSummary}
    />
  );
}
