export type PlanTier = 'free' | 'pro' | 'workshop';

export interface PlanEntitlements {
  tier: PlanTier;
  label: string;
  maxVehicles: number;
  maxPhotos: number;
  maxDocumentSizeMB: number;
  canUseSpecHub: boolean;
  canExportPdf: boolean;
  canExportZip: boolean;
  canSharePublicReport: boolean;
  canImportSpecCsv: boolean;
  features: {
    premiumExports: boolean;
    advancedReminders: boolean;
    workshopTools: boolean;
    multiVehicle: boolean;
  };
}

const PLANS: Record<PlanTier, PlanEntitlements> = {
  free: {
    tier: 'free',
    label: 'Free',
    maxVehicles: 1,
    maxPhotos: 10,
    maxDocumentSizeMB: 5,
    canUseSpecHub: false,
    canExportPdf: false,
    canExportZip: false,
    canSharePublicReport: false,
    canImportSpecCsv: false,
    features: {
      premiumExports: false,
      advancedReminders: false,
      workshopTools: false,
      multiVehicle: false,
    },
  },
  pro: {
    tier: 'pro',
    label: 'Premium',
    maxVehicles: 10,
    maxPhotos: 1000,
    maxDocumentSizeMB: 25,
    canUseSpecHub: true,
    canExportPdf: true,
    canExportZip: true,
    canSharePublicReport: true,
    canImportSpecCsv: true,
    features: {
      premiumExports: true,
      advancedReminders: true,
      workshopTools: false,
      multiVehicle: true,
    },
  },
  workshop: {
    tier: 'workshop',
    label: 'Workshop',
    maxVehicles: 100,
    maxPhotos: 10000,
    maxDocumentSizeMB: 100,
    canUseSpecHub: true,
    canExportPdf: true,
    canExportZip: true,
    canSharePublicReport: true,
    canImportSpecCsv: true,
    features: {
      premiumExports: true,
      advancedReminders: true,
      workshopTools: true,
      multiVehicle: true,
    },
  },
};

export function getEntitlements(tier: PlanTier = 'free'): PlanEntitlements {
  return PLANS[tier] || PLANS.free;
}
