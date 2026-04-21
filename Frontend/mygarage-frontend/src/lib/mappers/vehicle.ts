import { UserVehicle } from "@/types/autofolio";
import { formatDisplayDate } from "@/lib/date-utils";
import { ServiceSummaryViewModel, mapToServiceSummaryViewModel } from "./service";

export interface VehicleViewModel {
  id: string;
  nickname: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  status: 'active' | 'inactive' | 'sold';
  addedDate: string;
  isActive: boolean;
  // Ownership specific data
  hasRegistration: boolean;
  currentRegistrationId?: string;
  registrationStatus?: string;
  registrationExpiryDate?: string;
  hasInsurance: boolean;
  currentInsuranceId?: string;
  currentInsuranceProvider?: string;
  insuranceStatus?: string;
  insuranceExpiryDate?: string;
  ownershipDuration: string;
  // New metadata for polish
  photoCount: number;
  lastServiceDate?: string;
  serviceCount: number;
  workCount: number;
  isLocked: boolean;
  lockReason?: string | null;
  publicShareEnabled: boolean;
  publicShareToken?: string | null;
  isDaily: boolean;
  serviceSummary: ServiceSummaryViewModel | null;
}

export function mapToVehicleViewModel(raw: UserVehicle): VehicleViewModel {
  const createdDate = new Date(raw.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let duration = `${diffDays} days`;
  if (diffDays > 365) {
    duration = `${(diffDays / 365).toFixed(1)} years`;
  } else if (diffDays > 30) {
    duration = `${(diffDays / 30).toFixed(0)} months`;
  }

  // Find last service date
  let lastServiceDate: string | undefined;
  if (raw.services && raw.services.length > 0) {
    const sortedServices = [...raw.services].sort((a, b) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );
    lastServiceDate = formatDisplayDate(sortedServices[0].eventDate);
  }

  const currentReg = raw.registrations?.find(r => r.isCurrent);
  const currentIns = raw.insurance?.find(i => i.isCurrent);

  return {
    id: raw.id,
    nickname: raw.nickname || "My Vehicle",
    make: raw.make || "Unknown Make",
    model: raw.model || "Unknown Model",
    year: raw.year ? raw.year.toString() : "N/A",
    licensePlate: raw.licensePlate || "NO PLATE",
    vin: raw.vin || "NO VIN",
    status: raw.status,
    addedDate: formatDisplayDate(createdDate),
    isActive: raw.status === 'active',
    hasRegistration: !!currentReg,
    currentRegistrationId: currentReg?.id,
    registrationStatus: currentReg?.registrationStatus,
    registrationExpiryDate: currentReg?.expiryDate,
    hasInsurance: !!currentIns,
    currentInsuranceId: currentIns?.id,
    currentInsuranceProvider: currentIns?.provider,
    insuranceStatus: currentIns?.insuranceStatus,
    insuranceExpiryDate: currentIns?.expiryDate,
    ownershipDuration: duration,
    photoCount: raw.photos?.length || 0,
    lastServiceDate,
    serviceCount: raw.services?.length || 0,
    workCount: raw.workJobs?.length || 0,
    isLocked: !!raw.isLocked,
    lockReason: raw.lockReason,
    publicShareEnabled: !!raw.publicShareEnabled,
    publicShareToken: raw.publicShareToken,
    isDaily: !!raw.isDaily,
    serviceSummary: mapToServiceSummaryViewModel(raw.serviceSummary)
  };
}
