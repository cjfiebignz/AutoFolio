export interface ServiceAttachment {
  id: string;
  serviceEventId: string;
  title?: string;
  url: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface WorkAttachment {
  id: string;
  workJobId: string;
  title?: string;
  url: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface ServiceEvent {
  id: string;
  vehicleId: string;
  title: string;
  eventDate: string;
  odometerAtEvent?: number;
  serviceType: 'workshop' | 'diy';
  isMainService?: boolean;
  notes?: string;
  totalCost?: number;
  createdAt: string;
  attachments?: ServiceAttachment[];
}

export interface WorkJob {
  id: string;
  vehicleId: string;
  title: string;
  status: 'planned' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  date?: string;
  notes?: string;
  estimate?: number;
  attachments?: WorkAttachment[];
  parts?: WorkJobPart[];
  specs?: WorkJobSpec[];
  createdAt: string;
}

export interface WorkJobPart {
  id: string;
  workJobId: string;
  savedPartId: string;
  savedPart?: SavedPart;
  quantity: number;
  unitPriceSnapshot?: number;
  lineTotalSnapshot?: number;
  notes?: string;
}

export interface WorkJobSpec {
  id: string;
  workJobId: string;
  customSpecId: string;
  customSpec?: UserVehicleCustomSpec;
}

export interface Document {
  id: string;
  vehicleId: string;
  serviceEventId?: string;
  title: string;
  category: string;
  date: string;
  notes?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  title: string;
  dueDate: string;
  type: string;
  status: 'open' | 'done' | 'dismissed';
  notes?: string;
  createdAt: string;
}

export interface VehiclePhoto {
  id: string;
  vehicleId: string;
  url: string;
  createdAt: string;
}

export interface UserVehicleCustomSpec {
  id: string;
  vehicleId: string;
  group: string;
  label: string;
  value: string;
  unit?: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationRecord {
  id: string;
  vehicleId: string;
  regNumber: string;
  countryCode: string;
  region?: string;
  registrationStartDate?: string;
  expiryDate: string;
  durationMonths?: number;
  issuingBody?: string;
  cost?: number;
  currency?: string;
  isCurrent: boolean;
  registrationStatus: 'active' | 'expired' | 'cancelled' | 'pending';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceRecord {
  id: string;
  vehicleId: string;
  provider: string;
  policyNumber?: string;
  policyType: string;
  policyStartDate?: string;
  expiryDate: string;
  premiumAmount?: number;
  currency: string;
  paymentFrequency: string;
  isCurrent: boolean;
  insuranceStatus: 'active' | 'expired' | 'cancelled' | 'pending';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserVehicle {
  id: string;
  userId: string;
  specId: string;
  vin: string;
  licensePlate: string;
  nickname: string;
  make?: string;
  model?: string;
  year?: number;
  currentOdometer?: number | null;
  serviceIntervalKms?: number | null;
  serviceIntervalMonths?: number | null;
  serviceSettingsBaseKms?: number | null;
  serviceSettingsBaseDate?: string | null;
  bannerImageUrl?: string;
  bannerImagePath?: string;
  bannerUpdatedAt?: string;
  bannerCropX?: number;
  bannerCropY?: number;
  bannerZoom?: number;
  status: 'active' | 'inactive' | 'sold';
  createdAt: string;
  attributes: any[];
  registrations: RegistrationRecord[];
  insurance: InsuranceRecord[];
  services: ServiceEvent[];
  workJobs: WorkJob[];
  documents: Document[];
  reminders: Reminder[];
  photos: VehiclePhoto[];
  customSpecs: UserVehicleCustomSpec[];
  savedParts?: SavedPart[];
  partPresets?: PartPreset[];
  isLocked?: boolean;
  lockReason?: string | null;
  publicShareToken?: string | null;
  publicShareEnabled: boolean;
  publicShareCreatedAt?: string | null;
  serviceSummary?: {
    currentKms: number | null;
    baselineSource: string | null;
    baselineDate: string | null;
    baselineKms: number | null;
    lastServiceDate: string | null;
    lastServiceKms: number | null;
    serviceIntervalMonths: number | null;
    serviceIntervalKms: number | null;
    nextServiceDueDate: string | null;
    nextServiceDueKms: number | null;
    kmsUntilNextService: number | null;
    status: 'up_to_date' | 'due_soon' | 'overdue' | 'insufficient_data';
    hasEnoughData: boolean;
  } | null;
}

export interface ServiceSummary {
  vehicleId: string;
  serviceSummary: {
    currentKms: number | null;
    baselineSource: 'main_service' | 'settings_baseline' | 'none';
    baselineDate: string | null;
    baselineKms: number | null;
    lastServiceDate: string | null;
    lastServiceKms: number | null;
    serviceIntervalMonths: number | null;
    serviceIntervalKms: number | null;
    nextServiceDueDate: string | null;
    nextServiceDueKms: number | null;
    kmsUntilNextService: number | null;
    status: 'up_to_date' | 'due_soon' | 'overdue' | 'insufficient_data';
    hasEnoughData: boolean;
  };
}

export interface VehicleReference {
  specID: string;
  specSlug: string;
  make: string;
  model: string;
  generation: string;
  variant: string;
  engine: string;
  drivetrain: string;
  transmission: string;
}

export interface FluidSpec {
  fluidType: string;
  capacityLitres: number;
  specCode: string;
}

export interface TorqueSpec {
  label: string;
  torqueNm: number;
}

export interface PartSpec {
  partType: string;
  brand: string;
  partNumber: string;
  isOem: boolean;
  notes: string | null;
}

export interface VehicleSpecs {
  vehicle: VehicleReference;
  specs: {
    fluids: FluidSpec[];
    torque: TorqueSpec[];
    parts: PartSpec[];
  };
}

export interface UserVehicleWithSpecs {
  vehicle: UserVehicle;
  specs: VehicleSpecs;
}

export interface LifetimeCostSummary {
  vehicleId: string;
  totalServiceCost: number;
  totalDoneWorkCost: number;
  totalPredictedWorkCost: number;
  totalLifetimeCost: number;
  preferredCurrencyDisplay: string;
  costBreakdownMeta: {
    serviceRecordCount: number;
    doneWorkJobCount: number;
    predictedWorkJobCount: number;
  };
}

export interface PublicReport {
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
    nickname?: string;
    licensePlate?: string;
    vin?: string;
    currentOdometer?: number;
  };
  services: {
    title: string;
    eventDate: string;
    odometerAtEvent?: number;
    totalCost?: number;
  }[];
  workHistory: {
    title: string;
    date?: string;
    estimate?: number;
    notes?: string;
  }[];
  financials: {
    totalServiceCost: number;
    totalDoneWorkCost: number;
    totalLifetimeCost: number;
    currency: string;
  };
  generatedAt: string;
}

export interface ImportSpecRow {
  category: string;
  label: string;
  value: string;
  unit?: string | null;
  notes?: string | null;
}

export interface ImportPreviewRow {
  rowNumber: number;
  parsedData: ImportSpecRow;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

export interface ImportPreviewResponse {
  validRows: ImportPreviewRow[];
  invalidRows: ImportPreviewRow[];
  duplicates: ImportPreviewRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  fileName: string;
}

export interface ImportCommitResponse {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface SavedPart {
  id: string;
  vehicleId: string;
  category: string;
  name: string;
  partNumber?: string | null;
  description?: string | null;
  preferredBrand?: string | null;
  supplier?: string | null;
  purchaseUrl?: string | null;
  lastPrice?: number | null;
  lastPurchaseDate?: string | null;
  defaultQuantity: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartPreset {
  id: string;
  vehicleId: string;
  name: string;
  notes?: string | null;
  items: PartPresetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PartPresetItem {
  id: string;
  presetId: string;
  savedPartId: string;
  savedPart?: SavedPart;
  quantity: number;
}
