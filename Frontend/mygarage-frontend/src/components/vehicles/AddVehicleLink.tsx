'use client';

import { useRouter } from 'next/navigation';
import { useVehicleLimitGate } from '@/lib/limit-gate';
import { usePlan } from '@/lib/plan-context';
import React from 'react';

interface AddVehicleLinkProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

/**
 * A limit-aware wrapper for adding a vehicle.
 * Checks the user's plan limit from PlanProvider before allowing navigation to /vehicles/new.
 */
export function AddVehicleLink({ 
  className, 
  children,
  onClick
}: AddVehicleLinkProps) {
  const router = useRouter();
  const { checkLimit } = useVehicleLimitGate();
  const { vehicleCount, plan, loading } = usePlan();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) onClick();

    // If still loading plan data, we allow it but log a warning. 
    // The server-side check on /vehicles/new will be the final safety gate.
    if (loading || !plan) {
      router.push('/vehicles/new');
      return;
    }

    const maxCount = plan.maxVehicles;
    
    checkLimit(vehicleCount, maxCount, () => {
      router.push('/vehicles/new');
    });
  };

  return (
    <button 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </button>
  );
}
