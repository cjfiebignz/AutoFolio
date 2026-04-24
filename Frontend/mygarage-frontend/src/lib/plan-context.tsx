'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPreferences, getUserVehicles } from './api';
import { getEntitlements, PlanEntitlements, PlanTier } from './entitlements';
import { PremiumUpgradeModal } from '@/components/ui/PremiumUpgradeModal';
import { UserVehicle } from '@/types/autofolio';

interface UpgradeModalOptions {
  title?: string;
  message?: string;
  features?: string[];
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryActionLabel?: string;
}

interface PlanContextType {
  plan: PlanEntitlements | null;
  vehicles: UserVehicle[];
  vehicleCount: number;
  isLimitReached: boolean;
  canAddVehicle: boolean;
  loading: boolean;
  refreshPlan: () => Promise<void>;
  triggerUpgrade: (feature: 'export_pdf' | 'export_zip' | 'share_report' | 'spec_import') => void;
  openUpgradeModal: (options?: UpgradeModalOptions) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<PlanEntitlements | null>(null);
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [canAddVehicle, setCanAddVehicle] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<UpgradeModalOptions>({});

  const fetchPlanData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch preferences for plan entitlements
      const prefs = await getUserPreferences(session.user.id);
      
      // 2. Fetch real vehicle collection (Source of Truth for Daily status)
      const vehicleList = await getUserVehicles(session.user.id);
      setVehicles(vehicleList);

      // Map backend tier to entitlements (feature flags)
      const baseEntitlements = getEntitlements(prefs.plan as PlanTier);
      
      // Source of truth for limits is the backend response
      const mergedPlan: PlanEntitlements = {
        ...baseEntitlements,
        maxVehicles: prefs.vehicleLimit,
        maxPhotos: prefs.limits?.maxPhotosPerVehicle ?? baseEntitlements.maxPhotos,
        maxDocumentSizeMB: prefs.limits?.maxDocumentSizeMB ?? baseEntitlements.maxDocumentSizeMB,
        canUseSpecHub: prefs.limits?.canUseSpecHub ?? baseEntitlements.canUseSpecHub,
        canExportPdf: prefs.limits?.canExportPdf ?? baseEntitlements.canExportPdf,
        canExportZip: prefs.limits?.canExportZip ?? baseEntitlements.canExportZip,
        canSharePublicReport: prefs.limits?.canSharePublicReport ?? baseEntitlements.canSharePublicReport,
        canSharePublicReport: prefs.limits?.canSharePublicReport ?? baseEntitlements.canSharePublicReport,
        canImportSpecCsv: prefs.limits?.canImportSpecCsv ?? baseEntitlements.canImportSpecCsv,
      };

      setPlan(mergedPlan);
      setVehicleCount(prefs.currentVehicleCount);
      setCanAddVehicle(prefs.canAddVehicle);
    } catch (err) {
      console.error('Failed to fetch backend plan data', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const openUpgradeModal = useCallback((options?: UpgradeModalOptions) => {
    if (options) {
      setModalOptions(options);
    } else {
      setModalOptions({}); // Reset to defaults
    }
    setIsModalOpen(true);
  }, []);

  const triggerUpgrade = useCallback((feature: 'export_pdf' | 'export_zip' | 'share_report' | 'spec_import') => {
    const messaging = {
      export_pdf: {
        title: "Unlock PDF Reports",
        message: "Upgrade to Premium to download full, professional vehicle history reports.",
        features: ["Full Service History PDF", "Technical Work Summaries", "Professional Layout", "Verified Record Badge"]
      },
      export_zip: {
        title: "Unlock Document Bundles",
        message: "Upgrade to Premium to download all your vehicle documents and receipts as a single ZIP archive.",
        features: ["All Documents in one ZIP", "High-speed Bundling", "Original File Quality", "Unlimited Exports"]
      },
      share_report: {
        title: "Share Your Vehicle History",
        message: "Upgrade to Premium to create secure, read-only public links for your vehicle history reports.",
        features: ["Shareable Public Links", "Professional Buyer View", "Verified History Badge", "Instant Link Control"]
      },
      spec_import: {
        title: "Bulk Spec Import",
        message: "Upgrade to Premium to bulk import technical specifications and records from CSV files.",
        features: ["CSV Data Import", "Smart Row Preview", "Bulk Technical Reference", "Instant Spec Library"]
      }
    };

    openUpgradeModal(messaging[feature]);
  }, [openUpgradeModal]);

  const isLimitReached = !canAddVehicle;

  return (
    <PlanContext.Provider value={{ 
      plan, 
      vehicles,
      vehicleCount, 
      isLimitReached, 
      canAddVehicle,
      loading,
      refreshPlan: fetchPlanData,
      triggerUpgrade,
      openUpgradeModal
    }}>
      {children}
      <PremiumUpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalOptions.title}
        message={modalOptions.message}
        features={modalOptions.features}
        primaryAction={modalOptions.primaryAction}
        secondaryActionLabel={modalOptions.secondaryActionLabel}
      />
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
