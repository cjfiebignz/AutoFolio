'use client';

import { SessionProvider } from "next-auth/react";
import { PreferencesProvider } from "@/lib/preferences";
import { VehicleLimitGateProvider } from "@/lib/limit-gate";
import { PlanProvider } from "@/lib/plan-context";

export function Providers({ children }: { children: React.Node }) {
  return (
    <SessionProvider>
      <PlanProvider>
        <PreferencesProvider>
          <VehicleLimitGateProvider>
            {children}
          </VehicleLimitGateProvider>
        </PreferencesProvider>
      </PlanProvider>
    </SessionProvider>
  );
}

