import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReminderType, ReminderTiming } from '@prisma/client';
import { UpdateReminderPreferenceDto } from './dto/update-reminder-preference.dto';

@Injectable()
export class ReminderPreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly DEFAULT_PREFERENCES = [
    // SERVICE_DUE
    { type: ReminderType.SERVICE_DUE, timing: ReminderTiming.AT_EVENT, enabled: true },
    { type: ReminderType.SERVICE_DUE, timing: ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE, enabled: true },
    { type: ReminderType.SERVICE_DUE, timing: ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE, enabled: false },
    { type: ReminderType.SERVICE_DUE, timing: ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE, enabled: false },

    // REGISTRATION_EXPIRY
    { type: ReminderType.REGISTRATION_EXPIRY, timing: ReminderTiming.AT_EVENT, enabled: true },
    { type: ReminderType.REGISTRATION_EXPIRY, timing: ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE, enabled: true },
    { type: ReminderType.REGISTRATION_EXPIRY, timing: ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE, enabled: false },
    { type: ReminderType.REGISTRATION_EXPIRY, timing: ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE, enabled: false },

    // INSURANCE_EXPIRY
    { type: ReminderType.INSURANCE_EXPIRY, timing: ReminderTiming.AT_EVENT, enabled: true },
    { type: ReminderType.INSURANCE_EXPIRY, timing: ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE, enabled: true },
    { type: ReminderType.INSURANCE_EXPIRY, timing: ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE, enabled: false },
    { type: ReminderType.INSURANCE_EXPIRY, timing: ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE, enabled: false },

    /* 
    // INSPECTION_EXPIRY (Gated until module implementation)
    { type: ReminderType.INSPECTION_EXPIRY, timing: ReminderTiming.AT_EVENT, enabled: true },
    { type: ReminderType.INSPECTION_EXPIRY, timing: ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE, enabled: true },
    { type: ReminderType.INSPECTION_EXPIRY, timing: ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE, enabled: false },
    { type: ReminderType.INSPECTION_EXPIRY, timing: ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE, enabled: false },
    */
  ];

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { measurementSystem: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const dbPreferences = await this.prisma.userReminderPreference.findMany({
      where: { userId },
    });

    // Merge defaults with DB values
    const preferences = this.DEFAULT_PREFERENCES.map(def => {
      const dbMatch = dbPreferences.find(p => p.type === def.type && p.timing === def.timing);
      return {
        type: def.type,
        timing: def.timing,
        enabled: dbMatch ? dbMatch.enabled : def.enabled,
      };
    });

    return {
      preferences,
      metadata: this.getMetadata(user.measurementSystem),
    };
  }

  async updatePreference(userId: string, dto: UpdateReminderPreferenceDto) {
    return this.prisma.userReminderPreference.upsert({
      where: {
        userId_type_timing: {
          userId,
          type: dto.type,
          timing: dto.timing,
        },
      },
      update: {
        enabled: dto.enabled,
      },
      create: {
        userId,
        type: dto.type,
        timing: dto.timing,
        enabled: dto.enabled,
      },
    });
  }

  async updatePreferences(userId: string, preferences: UpdateReminderPreferenceDto[]) {
    return this.prisma.$transaction(
      preferences.map(pref =>
        this.prisma.userReminderPreference.upsert({
          where: {
            userId_type_timing: {
              userId,
              type: pref.type,
              timing: pref.timing,
            },
          },
          update: {
            enabled: pref.enabled,
          },
          create: {
            userId,
            type: pref.type,
            timing: pref.timing,
            enabled: pref.enabled,
          },
        }),
      ),
    );
  }

  private getMetadata(measurementSystem: string) {
    const distanceUnit = measurementSystem === 'imperial' ? 'miles' : 'km';

    return {
      types: [
        {
          key: ReminderType.SERVICE_DUE,
          label: 'Service Due',
          supportsDate: true,
          supportsDistance: true,
        },
        {
          key: ReminderType.REGISTRATION_EXPIRY,
          label: 'Registration Expiry',
          supportsDate: true,
          supportsDistance: false,
        },
        {
          key: ReminderType.INSURANCE_EXPIRY,
          label: 'Insurance Expiry',
          supportsDate: true,
          supportsDistance: false,
        },
        /*
        {
          key: ReminderType.INSPECTION_EXPIRY,
          label: 'Inspection / WOF Expiry',
          supportsDate: true,
          supportsDistance: false,
        },
        */
      ],
      timings: [
        {
          key: ReminderTiming.AT_EVENT,
          label: 'At event',
          daysOffset: 0,
          distanceOffset: 0,
        },
        {
          key: ReminderTiming.ONE_WEEK_OR_100_DISTANCE_BEFORE,
          label: `1 week or 100 ${distanceUnit} before`,
          daysOffset: 7,
          distanceOffset: 100,
        },
        {
          key: ReminderTiming.TWO_WEEKS_OR_200_DISTANCE_BEFORE,
          label: `2 weeks or 200 ${distanceUnit} before`,
          daysOffset: 14,
          distanceOffset: 200,
        },
        {
          key: ReminderTiming.ONE_MONTH_OR_1000_DISTANCE_BEFORE,
          label: `1 month or 1000 ${distanceUnit} before`,
          daysOffset: 30,
          distanceOffset: 1000,
        },
      ],
      measurementSystem,
    };
  }
}
