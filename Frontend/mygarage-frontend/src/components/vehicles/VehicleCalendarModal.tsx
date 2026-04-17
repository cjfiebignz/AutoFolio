'use client';

import { useState, useMemo } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Wrench, Bell, Edit3, ArrowRight, Clock
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday as isDateToday, startOfWeek, endOfWeek } from 'date-fns';
import { VehicleViewModel } from '@/lib/mappers/vehicle';
import { ServiceEntryViewModel, ServiceSummaryViewModel } from '@/lib/mappers/service';
import { WorkJobViewModel } from '@/lib/mappers/work';
import { DocumentViewModel } from '@/lib/mappers/document';
import { ReminderViewModel } from '@/lib/mappers/reminder';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'service' | 'work' | 'reminder';
  title: string;
  subtitle: string;
  severity?: 'critical' | 'soon' | 'upcoming' | 'overdue';
}

interface VehicleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleViewModel;
  services: ServiceEntryViewModel[];
  workItems: WorkJobViewModel[];
  documents: DocumentViewModel[];
  reminders: ReminderViewModel[];
  serviceSummary?: ServiceSummaryViewModel | null;
}

export function VehicleCalendarModal({ 
  isOpen, 
  onClose, 
  vehicle,
  services,
  workItems,
  reminders,
  serviceSummary
}: VehicleCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Aggregate all events for this specific vehicle
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // 1. Services
    services.forEach(s => {
      if (s.date) {
        events.push({
          id: `service-${s.id}`,
          date: new Date(s.date),
          type: 'service',
          title: s.title,
          subtitle: 'Service History'
        });
      }
    });

    // 2. Work Items
    workItems.forEach(w => {
      if (w.date) {
        events.push({
          id: `work-${w.id}`,
          date: new Date(w.date),
          type: 'work',
          title: w.title,
          subtitle: w.status.replace('-', ' ')
        });
      }
    });

    // 3. Reminders
    reminders.forEach(r => {
      if (r.dueDate && r.status !== 'done') {
        events.push({
          id: `reminder-${r.id}`,
          date: new Date(r.dueDate),
          type: 'reminder',
          title: r.title,
          subtitle: 'Pending Task',
          severity: r.urgency
        });
      }
    });

    // 4. Next Service Due (from intelligence)
    if (serviceSummary?.nextServiceDueDate) {
      events.push({
        id: 'next-service-predicted',
        date: new Date(serviceSummary.nextServiceDueDate),
        type: 'service',
        title: 'Next Service Due',
        subtitle: 'Predicted Requirement',
        severity: serviceSummary.status === 'overdue' ? 'critical' : 'soon'
      });
    }

    return events;
  }, [services, workItems, reminders, serviceSummary]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const monthLabel = format(currentMonth, 'MMMM yyyy');

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return allEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [allEvents, selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 sm:p-6 transition-all animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-premium transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-card-overlay border border-border-subtle text-muted">
              <CalendarIcon size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase truncate max-w-[200px] sm:max-w-none">
                {vehicle.nickname} Timeline
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-70">Fleet logistics view</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[600px] lg:h-[500px]">
          {/* Calendar Grid */}
          <div className="flex-1 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-border-subtle overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-foreground opacity-80">{monthLabel}</h4>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-card-overlay text-muted hover:text-foreground hover:bg-card-overlay-hover transition-all active:scale-90">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-card-overlay text-muted hover:text-foreground hover:bg-card-overlay-hover transition-all active:scale-90">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border-subtle border border-border-subtle rounded-2xl overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-surface p-2 text-center text-[10px] font-black text-dim uppercase tracking-widest">{day}</div>
              ))}
              {calendarDays.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isDateToday(day);
                const dayEvents = allEvents.filter(event => isSameDay(event.date, day));
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`relative min-h-[60px] p-2 transition-all group overflow-hidden ${
                      !isCurrentMonth ? 'bg-background opacity-20' : 'bg-surface'
                    } ${
                      isSelected 
                        ? 'z-10 ring-2 ring-inset ring-accent bg-accent/[0.03]' 
                        : 'border-border-subtle bg-card-overlay text-muted hover:border-accent/40 hover:bg-card-overlay-hover'
                    } ${isToday && !isSelected ? 'ring-1 ring-inset ring-accent/40' : ''}`}
                  >
                    <span className={`text-xs font-black italic tracking-tighter ${isSelected ? 'text-accent' : isToday ? 'text-accent' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    
                    {hasEvents && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div 
                            key={idx} 
                            className={`h-1.5 w-1.5 rounded-full ${
                              event.type === 'service' ? 'bg-blue-500' :
                              event.type === 'work' ? 'bg-purple-500' :
                              event.severity === 'critical' || event.severity === 'overdue' ? 'bg-red-500' :
                              'bg-accent opacity-60'
                            }`} 
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className={`h-0.5 w-0.5 rounded-full bg-dim`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Sidebar */}
          <div className="hidden lg:flex w-full lg:w-80 bg-background/50 flex-col overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border-subtle bg-card-overlay">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-1">Agenda for</p>
              <h4 className="text-base font-black italic tracking-tighter text-foreground uppercase truncate">
                {selectedDate ? format(selectedDate, 'do MMMM yyyy') : 'Select Date'}
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 no-scrollbar">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-10 opacity-30">
                  <div className="mx-auto h-1 w-8 rounded-full bg-border-subtle mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dim italic">No records</p>
                </div>
              ) : (
                selectedDateEvents.map(event => (
                  <EventRow key={event.id} event={event} vehicleId={vehicle.id} />
                ))
              )}
            </div>
          </div>

          {/* Mobile Agenda Drawer */}
          <div className="lg:hidden border-t border-border-subtle p-6 bg-surface overflow-y-auto flex-1">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-1">Agenda for</p>
                <h4 className="text-sm font-black italic tracking-tighter text-foreground uppercase">
                  {selectedDate ? format(selectedDate, 'do MMM') : 'Select Date'}
                </h4>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card-overlay text-muted hover:bg-card-overlay-hover hover:text-foreground transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-6 opacity-30">
                  <div className="mx-auto h-1 w-8 rounded-full bg-border-subtle mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dim italic">No records for this day</p>
                </div>
              ) : (
                selectedDateEvents.map(event => (
                  <EventRow key={event.id} event={event} vehicleId={vehicle.id} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, vehicleId }: { event: CalendarEvent; vehicleId: string }) {
  const icons = {
    service: <Wrench size={14} />,
    work: <Edit3 size={14} />,
    reminder: <Bell size={14} />
  };

  return (
    <Link 
      href={`/vehicles/${vehicleId}?tab=${event.type === 'reminder' ? 'overview' : event.type}`}
      className="group block rounded-3xl border border-border-subtle bg-card-overlay p-5 transition-all hover:border-border-strong hover:bg-card-overlay-hover active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
          event.type === 'service' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20' :
          event.type === 'work' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-inset ring-purple-500/20' :
          event.severity === 'critical' || event.severity === 'overdue' ? 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/20' :
          'bg-card-overlay text-muted ring-1 ring-inset ring-border-subtle'
        }`}>
          {icons[event.type]}
        </div>
        <ArrowRight size={12} className="text-dim opacity-0 group-hover:opacity-100 transition-all" />
      </div>
      <h5 className="text-sm font-black italic tracking-tight text-foreground opacity-90 group-hover:text-foreground transition-colors">{event.title}</h5>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{event.subtitle}</p>
        {event.type === 'work' && (
          <>
            <div className="h-1 w-1 rounded-full bg-border-subtle" />
            <div className="flex items-center gap-1 text-[8px] font-black text-accent uppercase tracking-tighter">
              <Clock size={8} /> Active Item
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
