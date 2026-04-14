'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { VehicleViewModel } from "@/lib/mappers/vehicle";
import { ServiceEntryViewModel } from "@/lib/mappers/service";
import { WorkJobViewModel } from "@/lib/mappers/work";
import { DocumentViewModel } from "@/lib/mappers/document";
import { ReminderViewModel } from "@/lib/mappers/reminder";
import { formatDisplayDate } from "@/lib/date-utils";
import { usePreferences } from "@/lib/preferences";
import { ServiceSummary } from "@/types/autofolio";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  category: 'service' | 'work' | 'reminder' | 'registration' | 'insurance' | 'document';
  href: string;
  subtitle?: string;
}

interface VehicleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleViewModel;
  services: ServiceEntryViewModel[];
  workItems: WorkJobViewModel[];
  documents: DocumentViewModel[];
  reminders: ReminderViewModel[];
  serviceSummary?: ServiceSummary['serviceSummary'] | null;
}

export function VehicleCalendarModal({
  isOpen,
  onClose,
  vehicle,
  services,
  workItems,
  documents,
  reminders,
  serviceSummary
}: VehicleCalendarModalProps) {
  const { formatDistance } = usePreferences();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isMobileAgendaOpen, setIsMobileAgendaOpen] = useState(false);

  // 1. Normalize all dated items into events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Services
    services.forEach(s => {
      if (s.date) {
        allEvents.push({
          id: `service-${s.id}`,
          date: new Date(s.date),
          title: s.title,
          category: 'service',
          href: `/vehicles/${vehicle.id}?tab=service`,
          subtitle: 'Service Record'
        });
      }
    });

    // Next Service Due (from Summary)
    if (serviceSummary?.nextServiceDueDate) {
      allEvents.push({
        id: 'next-service-due',
        date: new Date(serviceSummary.nextServiceDueDate),
        title: 'Next Service Due',
        category: 'service',
        href: `/vehicles/${vehicle.id}?tab=service`,
        subtitle: serviceSummary.nextServiceDueKms ? `Approx. ${formatDistance(serviceSummary.nextServiceDueKms)}` : 'Calculated interval'
      });
    }

    // Work Jobs
    workItems.forEach(w => {
      if (w.date) {
        allEvents.push({
          id: `work-${w.id}`,
          date: new Date(w.date),
          title: w.title,
          category: 'work',
          href: `/vehicles/${vehicle.id}?tab=work`,
          subtitle: 'Planned Work'
        });
      }
    });

    // Reminders
    reminders.forEach(r => {
      if (r.dueDate) {
        allEvents.push({
          id: `reminder-${r.id}`,
          date: new Date(r.dueDate),
          title: r.title,
          category: 'reminder',
          href: `/vehicles/${vehicle.id}?tab=overview`,
          subtitle: 'Reminder'
        });
      }
    });

    // Documents
    documents.forEach(d => {
      if (d.date) {
        allEvents.push({
          id: `document-${d.id}`,
          date: new Date(d.date),
          title: d.title,
          category: 'document',
          href: `/vehicles/${vehicle.id}?tab=documents`,
          subtitle: 'Document'
        });
      }
    });

    // Registration Expiry
    if (vehicle.registrationExpiryDate) {
      allEvents.push({
        id: 'reg-expiry',
        date: new Date(vehicle.registrationExpiryDate),
        title: 'Registration Expiry',
        category: 'registration',
        href: `/vehicles/${vehicle.id}/registration`,
        subtitle: vehicle.nickname
      });
    }

    // Insurance Expiry
    if (vehicle.insuranceExpiryDate) {
      allEvents.push({
        id: 'ins-expiry',
        date: new Date(vehicle.insuranceExpiryDate),
        title: 'Insurance Expiry',
        category: 'insurance',
        href: `/vehicles/${vehicle.id}/insurance`,
        subtitle: vehicle.nickname
      });
    }

    return allEvents;
  }, [vehicle, services, workItems, documents, reminders]);

  // 2. Calendar Logic
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const days = [];
    const numDays = daysInMonth(currentMonth);
    const startDay = startDayOfMonth(currentMonth);

    // Padding for start of month
    for (let i = 0; i < startDay; i++) days.push(null);

    // Days of month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  }, [currentMonth]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => isSameDay(e.date, selectedDate));
  }, [events, selectedDate]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileAgendaOpen(true);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[40px] border border-white/10 bg-[#0b0b0c] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/20">
              <CalendarIcon size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tight text-white uppercase">Vehicle Calendar</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/50 mt-1">{vehicle.nickname} Pipeline</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] max-h-[700px] overflow-hidden">
          {/* Calendar Grid Section */}
          <div className="flex-1 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/5 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white/80">{monthLabel}</h4>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-[10px] font-black text-white/20 uppercase tracking-widest">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="aspect-square" />;
                
                const dayEvents = events.filter(e => isSameDay(e.date, day));
                const categories = Array.from(new Set(dayEvents.map(e => e.category)));
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(day)}
                    className={`group relative aspect-square rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center active:scale-95 active:bg-blue-500/20
                      ${isSelected 
                        ? 'border-blue-500/50 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                        : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20 hover:bg-white/5'}
                      ${isToday && !isSelected ? 'ring-1 ring-inset ring-white/20' : ''}
                      ${dayEvents.length > 0 && !isSelected ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}
                    `}
                  >
                    <span className={`text-sm font-black italic ${isSelected ? 'scale-110' : ''}`}>{day.getDate()}</span>
                    
                    {/* Category Indicators */}
                    {categories.length > 0 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-0.5 px-1">
                        {categories.slice(0, 4).map(cat => (
                          <div 
                            key={cat}
                            className={`h-0.5 w-2 rounded-full ${
                              cat === 'service' ? 'bg-blue-500' :
                              cat === 'work' ? 'bg-yellow-500' :
                              cat === 'reminder' ? 'bg-red-500' :
                              cat === 'registration' ? 'bg-purple-500' :
                              cat === 'insurance' ? 'bg-green-500' :
                              'bg-white/40'
                            } ${isSelected ? 'bg-white' : ''}`}
                          />
                        ))}
                        {categories.length > 4 && (
                          <div className={`h-0.5 w-0.5 rounded-full bg-white/20`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events Side Panel (Desktop) */}
          <div className="hidden lg:flex w-full lg:w-80 bg-white/[0.01] flex-col overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.02]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Agenda for</p>
              <h4 className="text-sm font-black italic text-white uppercase leading-none">
                {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar">
              <div className="space-y-4">
                {selectedEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-1 w-8 rounded-full bg-white/5 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/10 italic">No events recorded</p>
                  </div>
                ) : (
                  selectedEvents.map(event => (
                    <EventCard key={event.id} event={event} onClose={onClose} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Agenda Overlay */}
        <div className={`absolute inset-0 z-[10] flex flex-col bg-[#0b0b0c] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden ${isMobileAgendaOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Agenda for</p>
              <h4 className="text-lg font-black italic text-white uppercase leading-none">
                {selectedDate ? formatDisplayDate(selectedDate) : ''}
              </h4>
            </div>
            <button 
              onClick={() => setIsMobileAgendaOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {selectedEvents.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-1 w-8 rounded-full bg-white/5 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/10 italic">No events recorded for this day</p>
              </div>
            ) : (
              selectedEvents.map(event => (
                <EventCard key={event.id} event={event} onClose={onClose} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EventCard({ event, onClose }: { event: CalendarEvent, onClose: () => void }) {
  return (
    <Link 
      href={event.href}
      onClick={onClose}
      className="group block rounded-3xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ring-1 ring-inset
          ${event.category === 'service' ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20' :
            event.category === 'work' ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' :
            event.category === 'reminder' ? 'bg-red-500/10 text-red-400 ring-red-500/20' :
            'bg-white/5 text-white/40 ring-white/10'}
        `}>
          {event.category}
        </span>
        <ArrowRight size={12} className="text-white/0 group-hover:text-white/20 transition-all" />
      </div>
      <h5 className="text-sm font-black italic tracking-tight text-white/90 group-hover:text-white transition-colors">{event.title}</h5>
      {event.subtitle && (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/20">{event.subtitle}</p>
      )}
    </Link>
  );
}
