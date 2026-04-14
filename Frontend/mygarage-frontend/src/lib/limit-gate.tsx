'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { PremiumUpgradeModal } from '@/components/ui/PremiumUpgradeModal';
import { usePlan } from './plan-context';

interface CheckLimitOptions {
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

interface VehicleLimitGateContextType {
  checkLimit: (currentCount: number, maxCount: number, onAllowed: () => void, options?: CheckLimitOptions) => void;
  openUpgradeModal: (options?: CheckLimitOptions) => void;
}

const VehicleLimitGateContext = createContext<VehicleLimitGateContextType | undefined>(undefined);

export function VehicleLimitGateProvider({ children }: { children: ReactNode }) {
  const { plan, openUpgradeModal } = usePlan();

  const checkLimit = useCallback((currentCount: number, maxCount: number, onAllowed: () => void, options?: CheckLimitOptions) => {
    if (currentCount >= maxCount) {
      if (options) {
        openUpgradeModal(options);
      } else if (plan?.tier === 'pro') {
        // Default 'Coming Soon' state for Pro users at max limit
        openUpgradeModal({
          title: "Fleet Tier Coming Soon",
          message: "We're building advanced multi-vehicle management for larger garages. Stay tuned for our upcoming fleet-tier release.",
          features: [
            "Unlimited Vehicle Slots",
            "Advanced Collection Analytics",
            "Team & Multi-user Access",
            "Bulk Import/Export Tools"
          ],
          primaryAction: {
            label: "Got it"
          },
          secondaryActionLabel: "" 
        });
      } else {
        openUpgradeModal({}); // Use standard Premium Upgrade defaults for Free users
      }
    } else {
      onAllowed();
    }
  }, [plan, openUpgradeModal]);

  return (
    <VehicleLimitGateContext.Provider value={{ checkLimit, openUpgradeModal }}>
      {children}
    </VehicleLimitGateContext.Provider>
  );
}

export function useVehicleLimitGate() {
  const context = useContext(VehicleLimitGateContext);
  if (context === undefined) {
    throw new Error('useVehicleLimitGate must be used within a VehicleLimitGateProvider');
  }
  return context;
}
