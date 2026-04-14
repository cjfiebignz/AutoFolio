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
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 ring-1 ring-white/5 shadow-xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
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
