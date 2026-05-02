import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DevService } from '../dev/dev.service';
import { ReminderType, ReminderTiming, UserVehicle, RegistrationRecord, InsuranceRecord, AccountPlan } from '@prisma/client';

export interface DueReminder {
  id: string; // Deterministic key: vehicleId-type
  type: ReminderType;
  timing: ReminderTiming;
  vehicleId: string;
  vehicleDisplayName: string;
  dueDate?: Date;
  dueOdometer?: number;
  currentOdometer?: number;
  distanceRemaining?: number;
  daysRemaining?: number;
  severity: 'due_now' | 'due_soon' | 'overdue';
  title: string;
  message: string;
}

@Injectable()
export class ReminderEngineService {
  private readonly logger = new Logger(ReminderEngineService.name);

  // Urgency order: lower value = more urgent (smaller threshold)
  private readonly timingUrgency: Record<ReminderTiming, number> = {
    [ReminderTiming.AT_EVENT]: 0,
    [ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE]: 1,
    [ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE]: 2,
    [ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE]: 3,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly devService: DevService,
  ) {}

  async getDueReminders(userId: string): Promise<{ effectiveNow: string; reminders: DueReminder[]; counts: Record<string, number> }> {
    const now = this.devService.getNow();

    // 1. Fetch user, preferences and vehicles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        reminderPreferences: true,
        vehicles: {
          where: { status: 'active' },
          include: {
            registrations: { where: { isCurrent: true }, take: 1 },
            insurance: { where: { isCurrent: true }, take: 1 },
            services: { orderBy: { eventDate: 'desc' } },
            odometers: { orderBy: { readingDate: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!user) {
      return { effectiveNow: now.toISOString(), reminders: [], counts: {} };
    }

    const preferences = user.reminderPreferences;
    const reminders: DueReminder[] = [];

    for (const vehicle of user.vehicles) {
      // 2. Process each reminder type - return only one best reminder per type
      const serviceReminder = this.evaluateServiceReminders(vehicle, preferences, now, user.measurementSystem);
      if (serviceReminder) reminders.push(serviceReminder);

      const registrationReminder = this.evaluateRegistrationReminders(vehicle, preferences, now);
      if (registrationReminder) reminders.push(registrationReminder);

      const insuranceReminder = this.evaluateInsuranceReminders(vehicle, preferences, now);
      if (insuranceReminder) reminders.push(insuranceReminder);
    }

    // 3. Calculate counts
    const counts = reminders.reduce((acc, r) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      effectiveNow: now.toISOString(),
      reminders,
      counts,
    };
  }

  private evaluateServiceReminders(
    vehicle: any,
    preferences: any[],
    now: Date,
    measurementSystem: string
  ): DueReminder | null {
    const type = ReminderType.SERVICE_DUE;
    const typePrefs = preferences
      .filter(p => p.type === type && p.enabled)
      .sort((a, b) => this.timingUrgency[a.timing as ReminderTiming] - this.timingUrgency[b.timing as ReminderTiming]);

    if (typePrefs.length === 0) return null;

    // Logic similar to getServiceSummary
    const latestMainService = vehicle.services.find(s => s.isMainService) || null;
    let currentKms = vehicle.currentOdometer || 0;
    
    const serviceIntervalMonths = vehicle.serviceIntervalMonths || null;
    const serviceIntervalKms = vehicle.serviceIntervalKms || null;

    let baselineDate: Date | null = null;
    let baselineKms: number | null = null;

    if (latestMainService) {
      // Prioritize the latest Main Service as the authoritative baseline
      baselineDate = latestMainService.eventDate;
      baselineKms = latestMainService.odometerAtEvent;
    } else if (vehicle.serviceSettingsBaseDate) {
      baselineDate = vehicle.serviceSettingsBaseDate;
      baselineKms = vehicle.serviceSettingsBaseKms;
    } else if (currentKms > 0) {
      baselineDate = vehicle.createdAt;
      baselineKms = currentKms;
    }

    let dueDate = null;
    let dueKms = null;

    if (baselineDate && serviceIntervalMonths) {
      dueDate = new Date(baselineDate);
      dueDate.setMonth(dueDate.getMonth() + serviceIntervalMonths);
    }
    if (baselineKms !== null && serviceIntervalKms) {
      dueKms = baselineKms + serviceIntervalKms;
    }

    if (!dueDate && dueKms === null) return null;

    for (const pref of typePrefs) {
      const timing = pref.timing as ReminderTiming;
      const threshold = this.getTimingThreshold(timing);
      
      let triggered = false;
      let severity: 'due_now' | 'due_soon' | 'overdue' = 'due_soon';
      let daysRemaining: number | undefined;
      let distanceRemaining: number | undefined;

      // Date check
      if (dueDate) {
        const diffTime = dueDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 0) {
          triggered = true;
          severity = 'overdue';
        } else if (daysRemaining <= threshold.days) {
          triggered = true;
          severity = daysRemaining === 0 ? 'due_now' : 'due_soon';
        }
      }

      // Distance check - ONLY trigger if not already triggered by date (to avoid double trigger per timing)
      // Actually, if distance is MORE urgent, we should update the severity.
      if (dueKms !== null) {
        distanceRemaining = dueKms - currentKms;
        if (distanceRemaining <= 0) {
          triggered = true;
          severity = 'overdue';
        } else if (distanceRemaining <= threshold.distance) {
          triggered = true;
          // If already triggered by date, only upgrade to due_now if distance is very close
          const distanceSeverity = distanceRemaining <= 10 ? 'due_now' : 'due_soon';
          if (severity !== 'overdue') {
            if (distanceSeverity === 'due_now') severity = 'due_now';
          }
        }
      }

      if (triggered) {
        const unit = measurementSystem === 'imperial' ? 'mi' : 'km';
        const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        
        return {
          id: `${vehicle.id}-${type}`,
          type,
          timing,
          vehicleId: vehicle.id,
          vehicleDisplayName: vehicleName,
          dueDate: dueDate || undefined,
          dueOdometer: dueKms || undefined,
          currentOdometer: currentKms,
          distanceRemaining,
          daysRemaining,
          severity,
          title: `Service Due: ${vehicleName}`,
          message: this.formatMessage(type, severity, daysRemaining, distanceRemaining, unit),
        };
      }
    }

    return null;
  }

  private evaluateRegistrationReminders(vehicle: any, preferences: any[], now: Date): DueReminder | null {
    const type = ReminderType.REGISTRATION_EXPIRY;
    const typePrefs = preferences
      .filter(p => p.type === type && p.enabled)
      .sort((a, b) => this.timingUrgency[a.timing as ReminderTiming] - this.timingUrgency[b.timing as ReminderTiming]);

    if (typePrefs.length === 0) return null;

    const registration = vehicle.registrations[0];
    if (!registration || !registration.expiryDate) return null;

    const expiryDate = registration.expiryDate;

    for (const pref of typePrefs) {
      const timing = pref.timing as ReminderTiming;
      const threshold = this.getTimingThreshold(timing);
      
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let triggered = false;
      let severity: 'due_now' | 'due_soon' | 'overdue' = 'due_soon';

      if (daysRemaining <= 0) {
        triggered = true;
        severity = 'overdue';
      } else if (daysRemaining <= threshold.days) {
        triggered = true;
        severity = daysRemaining === 0 ? 'due_now' : 'due_soon';
      }

      if (triggered) {
        const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        return {
          id: `${vehicle.id}-${type}`,
          type,
          timing,
          vehicleId: vehicle.id,
          vehicleDisplayName: vehicleName,
          dueDate: expiryDate,
          daysRemaining,
          severity,
          title: `Registration Expiry: ${vehicleName}`,
          message: this.formatMessage(type, severity, daysRemaining),
        };
      }
    }

    return null;
  }

  private evaluateInsuranceReminders(vehicle: any, preferences: any[], now: Date): DueReminder | null {
    const type = ReminderType.INSURANCE_EXPIRY;
    const typePrefs = preferences
      .filter(p => p.type === type && p.enabled)
      .sort((a, b) => this.timingUrgency[a.timing as ReminderTiming] - this.timingUrgency[b.timing as ReminderTiming]);

    if (typePrefs.length === 0) return null;

    const insurance = vehicle.insurance[0];
    if (!insurance || !insurance.expiryDate) return null;

    const expiryDate = insurance.expiryDate;

    for (const pref of typePrefs) {
      const timing = pref.timing as ReminderTiming;
      const threshold = this.getTimingThreshold(timing);
      
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let triggered = false;
      let severity: 'due_now' | 'due_soon' | 'overdue' = 'due_soon';

      if (daysRemaining <= 0) {
        triggered = true;
        severity = 'overdue';
      } else if (daysRemaining <= threshold.days) {
        triggered = true;
        severity = daysRemaining === 0 ? 'due_now' : 'due_soon';
      }

      if (triggered) {
        const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        return {
          id: `${vehicle.id}-${type}`,
          type,
          timing,
          vehicleId: vehicle.id,
          vehicleDisplayName: vehicleName,
          dueDate: expiryDate,
          daysRemaining,
          severity,
          title: `Insurance Expiry: ${vehicleName}`,
          message: this.formatMessage(type, severity, daysRemaining),
        };
      }
    }

    return null;
  }

  private getTimingThreshold(timing: ReminderTiming): { days: number; distance: number } {
    switch (timing) {
      case ReminderTiming.AT_EVENT:
        return { days: 0, distance: 0 };
      case ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE:
        return { days: 7, distance: 100 };
      case ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE:
        return { days: 14, distance: 200 };
      case ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE:
        return { days: 30, distance: 1000 };
      default:
        return { days: 0, distance: 0 };
    }
  }

  private formatMessage(type: ReminderType, severity: string, days?: number, distance?: number, unit?: string): string {
    const typeStr = type.replace('_', ' ').toLowerCase();
    if (severity === 'overdue') {
      return `Your ${typeStr} is overdue.`;
    }
    
    const parts = [];
    if (days !== undefined && days >= 0) {
      parts.push(`${days} day${days === 1 ? '' : 's'}`);
    }
    if (distance !== undefined && distance >= 0) {
      parts.push(`${distance} ${unit}`);
    }

    if (parts.length === 0) return `Your ${typeStr} is due.`;
    return `Your ${typeStr} is due in ${parts.join(' or ')}.`;
  }
}
