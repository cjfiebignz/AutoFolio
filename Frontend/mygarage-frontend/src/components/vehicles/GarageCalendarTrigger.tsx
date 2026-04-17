'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { UserVehicle } from '@/types/autofolio';
import { GarageCalendarModal } from './GarageCalendarModal';

interface GarageCalendarTriggerProps {
  vehicles: UserVehicle[];
}

export function GarageCalendarTrigger({ vehicles }: GarageCalendarTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (vehicles.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-overlay border border-border-subtle shadow-xl text-muted transition-all hover:bg-card-overlay-hover hover:text-foreground hover:border-border-strong active:scale-95"
        title="Open Garage Calendar"
      >
        <Calendar size={20} strokeWidth={2} />
      </button>

      <GarageCalendarModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        vehicles={vehicles}
      />
    </>
  );
}
