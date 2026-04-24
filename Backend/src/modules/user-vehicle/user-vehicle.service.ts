import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import archiver = require('archiver');
import PDFDocument from 'pdfkit';
import { Prisma, RegistrationStatus, InsuranceStatus, ReminderSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserVehicleDto } from './dto/create-user-vehicle.dto';
import { UpdateUserVehicleDto } from './dto/update-user-vehicle.dto';
import { CreateServiceEventDto } from './dto/create-service-event.dto';
import { UpdateServiceEventDto } from './dto/update-service-event.dto';
import { CreateWorkJobDto } from './dto/create-work-job.dto';
import { UpdateWorkJobDto } from './dto/update-work-job.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { RenewRegistrationDto } from './dto/renew-registration.dto';
import { RenewInsuranceDto } from './dto/renew-insurance.dto';
import { CreateCustomSpecDto } from './dto/create-custom-spec.dto';
import { UpdateCustomSpecDto } from './dto/update-custom-spec.dto';
import { SpecHubClientService, SpecHubGetSpecResponse } from './spec-hub-client.service';
import { UpdateBannerMetadataDto } from './dto/update-banner-metadata.dto';
import { VehicleAccessService } from './vehicle-access.service';

const COUNTRY_RULES: Record<string, { regionRequired: boolean }> = {
  AU: { regionRequired: true },
  US: { regionRequired: true },
  CA: { regionRequired: true },
  GB: { regionRequired: false },
  NZ: { regionRequired: false },
};

@Injectable()
export class UserVehicleService {
  constructor(
    private prisma: PrismaService,
    private specHubClient: SpecHubClientService,
    private vehicleAccess: VehicleAccessService,
  ) {}

  public getPlanLimits(planInput: string | null | undefined) {
    const plan = planInput || 'free';
    return {
      maxVehicles: plan === 'pro' ? 10 : 1,
      maxPhotosPerVehicle: plan === 'pro' ? 1000 : 10,
      maxDocumentSizeMB: plan === 'pro' ? 25 : 5,
      canUseSpecHub: plan === 'pro',
      canExportPdf: plan === 'pro',
      canSharePublicReport: plan === 'pro',
      canExportZip: plan === 'pro',
      canImportSpecCsv: plan === 'pro',
    };
  }

  async getUserPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        defaultCurrency: true,
        measurementSystem: true,
        plan: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentVehicleCount = await this.prisma.userVehicle.count({
      where: { userId, status: 'active' },
    });

    const limits = this.getPlanLimits(user.plan);

    return {
      defaultCurrency: user.defaultCurrency,
      measurementSystem: user.measurementSystem,
      plan: user.plan || 'free',
      vehicleLimit: limits.maxVehicles,
      currentVehicleCount,
      canAddVehicle: currentVehicleCount < limits.maxVehicles,
      limits,
    };
  }

  async updateUserPreferences(userId: string, defaultCurrency?: string, plan?: 'free' | 'pro', measurementSystem?: string) {
    const data: any = {};
    
    if (defaultCurrency) {
      if (typeof defaultCurrency !== 'string' || defaultCurrency.length !== 3) {
        throw new BadRequestException(`Invalid currency code format: "${defaultCurrency}". Expected 3-letter ISO code.`);
      }
      data.defaultCurrency = defaultCurrency.toUpperCase();
    }

    if (plan) {
      data.plan = plan;
    }

    if (measurementSystem) {
      if (measurementSystem !== 'metric' && measurementSystem !== 'imperial') {
        throw new BadRequestException(`Invalid measurement system: "${measurementSystem}". Expected 'metric' or 'imperial'.`);
      }
      data.measurementSystem = measurementSystem;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No preference updates provided.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getUserPreferences(userId);
  }

  async getDailyUsageSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyVehicleId: true },
    });

    if (!user || !user.dailyVehicleId) {
      return {
        dailyVehicleId: null,
        hasDailyVehicle: false,
        hasUsageData: false,
        currentStreak: 0,
        lastLoggedAt: null,
        activeDaysLast7: 0,
      };
    }

    // Get odometer readings for the daily vehicle
    const readings = await this.prisma.odometerReading.findMany({
      where: { vehicleId: user.dailyVehicleId },
      orderBy: { readingDate: 'desc' },
      take: 50,
      select: { readingDate: true },
    });

    if (readings.length === 0) {
      return {
        dailyVehicleId: user.dailyVehicleId,
        hasDailyVehicle: true,
        hasUsageData: false,
        currentStreak: 0,
        lastLoggedAt: null,
        activeDaysLast7: 0,
      };
    }

    const lastLoggedAt = readings[0].readingDate;

    // Helper to get date string in YYYY-MM-DD format (UTC)
    const toDateKey = (date: Date) => date.toISOString().split('T')[0];

    // Unique days logged
    const loggedDays = new Set(readings.map(r => toDateKey(r.readingDate)));
    const sortedLoggedDays = Array.from(loggedDays).sort((a, b) => b.localeCompare(a));

    const today = new Date();
    const todayKey = toDateKey(today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    let currentStreak = 0;
    const latestLoggedDay = sortedLoggedDays[0];

    // Streak logic:Alive if logged today OR yesterday
    if (latestLoggedDay === todayKey || latestLoggedDay === yesterdayKey) {
      currentStreak = 1;
      let checkDate = new Date(latestLoggedDay);
      
      for (let i = 1; i < sortedLoggedDays.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const expectedKey = toDateKey(checkDate);
        
        if (sortedLoggedDays[i] === expectedKey) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Active days in last 7 days
    let activeDaysLast7 = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoKey = toDateKey(sevenDaysAgo);

    for (const dayKey of sortedLoggedDays) {
      if (dayKey >= sevenDaysAgoKey) {
        activeDaysLast7++;
      } else {
        break;
      }
    }

    return {
      dailyVehicleId: user.dailyVehicleId,
      hasDailyVehicle: true,
      hasUsageData: true,
      currentStreak,
      lastLoggedAt,
      activeDaysLast7,
    };
  }

  async getDailyStreak(userId: string) {
    const summary = await this.getDailyUsageSummary(userId);
    
    // Check if updated today
    const today = new Date().toISOString().split('T')[0];
    const lastLogged = summary.lastLoggedAt ? summary.lastLoggedAt.toISOString().split('T')[0] : null;

    let currentOdometerKms = null;
    let dailyVehicleNickname = null;

    if (summary.dailyVehicleId) {
      const vehicle = await this.prisma.userVehicle.findUnique({
        where: { id: summary.dailyVehicleId },
        include: {
          odometers: {
            where: { source: 'manual' },
            take: 1,
            orderBy: { readingDate: 'desc' },
            select: {
              value: true,
              readingDate: true,
              createdAt: true,
            }
          },
          services: {
            orderBy: { eventDate: 'desc' },
            select: { 
              id: true, 
              eventDate: true, 
              isMainService: true,
              odometerAtEvent: true,
              createdAt: true,
            },
          },
        }
      });

      if (vehicle) {
        dailyVehicleNickname = vehicle.nickname || null;
        const svc = this.calculateServiceSummary(vehicle);
        currentOdometerKms = svc.currentKms;
      }
    }

    return {
      dailyVehicleId: summary.dailyVehicleId,
      dailyVehicleNickname,
      currentStreak: summary.currentStreak,
      updatedToday: lastLogged === today,
      lastLoggedAt: summary.lastLoggedAt,
      currentOdometerKms,
    };
  }

  async create(dto: CreateUserVehicleDto) {
    // Diagnostic: Check if user exists first to give a better error message
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, dailyVehicleId: true, plan: true }
    });

    if (!user) {
      throw new NotFoundException(
        `User identity synchronization error: Authenticated User ID "${dto.userId}" was not found in the database. Ensure the database is shared between frontend/backend and migrations are applied.`,
      );
    }

    // Enforce Plan Limits - FRESH COUNT
    const currentActiveCount = await this.prisma.userVehicle.count({
      where: { userId: dto.userId, status: 'active' },
    });

    const limits = this.getPlanLimits(user.plan);

    if (currentActiveCount >= limits.maxVehicles) {
      throw new BadRequestException({
        error: 'limit_reached',
        type: 'vehicle_limit',
        message: `Your current plan (${user.plan || 'free'}) allows a maximum of ${limits.maxVehicles} vehicle(s). Please upgrade to add more.`,
        plan: user.plan || 'free',
        limit: limits.maxVehicles,
        current: currentActiveCount
      });
    }

    // Enforce SpecHUB Restriction
    if (!limits.canUseSpecHub && dto.specId) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'spechub_restriction',
        message: 'SpecHUB linking is a Pro feature. Please upgrade to use this feature.',
        plan: user.plan || 'free',
      });
    }

    try {
      const newVehicle = await this.prisma.userVehicle.create({
        data: {
          userId: dto.userId,
          specId: dto.specId,
          vin: dto.vin,
          licensePlate: dto.licensePlate,
          nickname: dto.nickname,
          make: dto.make,
          model: dto.model,
          year: dto.year,
          currentOdometer: dto.currentOdometer,
          serviceIntervalKms: dto.serviceIntervalKms,
          serviceIntervalMonths: dto.serviceIntervalMonths,
          serviceSettingsBaseDate: dto.serviceSettingsBaseDate,
          serviceSettingsBaseKms: dto.serviceSettingsBaseKms,
        },
      });

      // Daily Vehicle Assignment Logic
      // 1. If explicitly requested
      // 2. OR if it's the user's ONLY active vehicle (first vehicle created)
      const currentDailyId = user.dailyVehicleId;
      if (dto.isDaily || !currentDailyId) {
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: { dailyVehicleId: newVehicle.id }
        });
        return { ...newVehicle, isDaily: true };
      }

      return { ...newVehicle, isDaily: false };
    } catch (err: any) {
      throw err;
    }
  }

  async update(id: string, dto: UpdateUserVehicleDto) {
    await this.ensureVehicleNotLocked(id);
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: { user: { select: { plan: true } } }
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan as 'free' | 'pro');

    // Enforce SpecHUB Restriction
    if (!limits.canUseSpecHub && dto.specId) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'spechub_restriction',
        message: 'SpecHUB linking is a Pro feature. Please upgrade to use this feature.',
        plan: vehicle.user.plan || 'free',
      });
    }
    
    // Prepare update data
    const { isDaily, ...rest } = dto;
    const updateData: Prisma.UserVehicleUpdateInput = { ...rest };

    // Baseline fallback logic:
    // If ANY service settings are being updated AND no main service exists yet, 
    // refresh the fallback baseline (unless explicit baseline values were provided in the DTO).
    const isUpdatingServiceSettings = 
      dto.serviceIntervalKms !== undefined || 
      dto.serviceIntervalMonths !== undefined ||
      dto.currentOdometer !== undefined;
    
    if (isUpdatingServiceSettings) {
      const hasMainService = await this.prisma.serviceEvent.findFirst({
        where: { vehicleId: id, isMainService: true },
      });

      if (!hasMainService) {
        // Auto-refresh baseline if not explicitly provided in this update
        if (updateData.serviceSettingsBaseDate === undefined) {
          updateData.serviceSettingsBaseDate = new Date();
        }
        if (updateData.serviceSettingsBaseKms === undefined) {
          updateData.serviceSettingsBaseKms = dto.currentOdometer !== undefined ? dto.currentOdometer : vehicle.currentOdometer;
        }
      }
    }

    const updatedVehicle = await this.prisma.userVehicle.update({
      where: { id: vehicle.id },
      data: updateData,
    });

    // Daily Vehicle Assignment Logic
    if (isDaily === true) {
      await this.prisma.user.update({
        where: { id: vehicle.userId },
        data: { dailyVehicleId: vehicle.id }
      });
    }

    // If currentOdometer was updated manually, record it in history as 'manual'
    if (dto.currentOdometer !== undefined && dto.currentOdometer !== null) {
      await this.prisma.odometerReading.create({
        data: {
          vehicleId: id,
          value: dto.currentOdometer,
          readingDate: new Date(),
          source: 'manual',
        },
      });
    }

    return updatedVehicle;
  }

  private normalizeBannerMetadata(metadata?: UpdateBannerMetadataDto): Prisma.UserVehicleUpdateInput {
    if (!metadata) return {};

    const data: Prisma.UserVehicleUpdateInput = {};
    let { bannerCropX, bannerCropY, bannerZoom } = metadata;

    // Handle X coordinate
    if (bannerCropX !== undefined) {
      if (bannerCropX > 1) bannerCropX = bannerCropX / 100;
      data.bannerCropX = Math.max(0, Math.min(1, bannerCropX));
    } else {
      data.bannerCropX = 0.5; // Default to center
    }

    // Handle Y coordinate
    if (bannerCropY !== undefined) {
      if (bannerCropY > 1) bannerCropY = bannerCropY / 100;
      data.bannerCropY = Math.max(0, Math.min(1, bannerCropY));
    } else {
      data.bannerCropY = 0.5; // Default to center
    }

    // Handle Zoom
    if (bannerZoom !== undefined) {
      data.bannerZoom = Math.max(1, Math.min(5, bannerZoom));
    } else {
      data.bannerZoom = 1.0; // Default zoom
    }

    return data;
  }

  async findAllByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyVehicleId: true }
    });

    const vehicles = await this.prisma.userVehicle.findMany({
      where: {
        userId,
        status: 'active',
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' }
      ],
      include: {
        odometers: {
          where: { source: 'manual' },
          take: 1,
          orderBy: { readingDate: 'desc' },
          select: {
            value: true,
            readingDate: true,
            createdAt: true,
          }
        },
        services: {
          orderBy: { eventDate: 'desc' },
          select: { 
            id: true, 
            eventDate: true, 
            title: true, 
            isMainService: true,
            odometerAtEvent: true,
            createdAt: true,
          },
        },
        workJobs: {
          select: { 
            id: true, 
            date: true, 
            title: true, 
            status: true 
          },
        },
        photos: {
          select: { id: true },
        },
        registrations: {
          select: { 
            id: true, 
            regNumber: true, 
            expiryDate: true, 
            registrationStartDate: true,
            isCurrent: true 
          },
        },
        insurance: {
          select: { 
            id: true, 
            provider: true, 
            expiryDate: true, 
            policyStartDate: true,
            isCurrent: true 
          },
        },
        documents: {
          select: {
            id: true,
            date: true,
            title: true,
            category: true
          }
        },
        reminders: {
          where: { status: 'open' },
          select: { id: true, dueDate: true, title: true },
        },
      },
    });

    const { lockedIds, reason } = await this.getLockStatusForUserVehicles(userId);

    // Return plain objects with serviceSummary and lock state attached
    return vehicles.map(v => {
      const serviceSummary = this.calculateServiceSummary(v);
      return {
        ...v,
        isDaily: v.id === user?.dailyVehicleId,
        isLocked: lockedIds.includes(v.id),
        lockReason: lockedIds.includes(v.id) ? reason : null,
        serviceSummary,
      };
    });
  }

  private async getLockStatusForUserVehicles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user || user.plan === 'pro') {
      return { lockedIds: [], reason: null };
    }

    // On Free plan, only the oldest active vehicle is unlocked.
    const activeVehicles = await this.prisma.userVehicle.findMany({
      where: { userId, status: 'active' },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' } // Secondary stable key
      ],
      select: { id: true },
    });

    if (activeVehicles.length <= 1) {
      return { lockedIds: [], reason: null };
    }

    // Keep the first one, lock the rest
    const lockedIds = activeVehicles.slice(1).map((v) => v.id);
    return { lockedIds, reason: 'free_plan_limit' };
  }

  private calculateServiceSummary(vehicle: any) {
    const lastService = vehicle.services[0] || null;
    const latestMainService = vehicle.services.find(s => s.isMainService) || null;
    
    // SOURCE OF TRUTH: Newer of (Latest Manual Update) vs (Latest Main Service)
    let currentKms = vehicle.currentOdometer;
    const latestManualReading = vehicle.odometers?.find(o => o.source === 'manual') || null;
    
    const manualDate = latestManualReading?.readingDate ? latestManualReading.readingDate.getTime() : 0;
    const mainServiceDate = (latestMainService?.eventDate && latestMainService?.odometerAtEvent !== null) 
      ? latestMainService.eventDate.getTime() 
      : 0;

    if (latestManualReading && latestMainService && latestMainService.odometerAtEvent !== null) {
      // If dates are identical, use createdAt as a secondary tie-breaker if available.
      if (manualDate === mainServiceDate && latestManualReading.createdAt && latestMainService.createdAt) {
        currentKms = latestManualReading.createdAt.getTime() >= latestMainService.createdAt.getTime()
          ? latestManualReading.value
          : latestMainService.odometerAtEvent;
      } else {
        currentKms = manualDate >= mainServiceDate ? latestManualReading.value : latestMainService.odometerAtEvent;
      }
    } else if (latestManualReading) {
      currentKms = latestManualReading.value;
    } else if (latestMainService && latestMainService.odometerAtEvent !== null) {
      currentKms = latestMainService.odometerAtEvent;
    }

    const serviceIntervalMonths = vehicle.serviceIntervalMonths || null;
    const serviceIntervalKms = vehicle.serviceIntervalKms || null;

    // Baseline calculation logic
    let baselineSource: 'main_service' | 'settings_baseline' | 'none' = 'none';
    let baselineDate: Date | null = null;
    let baselineKms: number | null = null;

    if (latestMainService && latestMainService.odometerAtEvent !== null) {
      baselineSource = 'main_service';
      baselineDate = latestMainService.eventDate;
      baselineKms = latestMainService.odometerAtEvent;
    } else if (vehicle.serviceSettingsBaseDate) {
      baselineSource = 'settings_baseline';
      baselineDate = vehicle.serviceSettingsBaseDate;
      baselineKms = vehicle.serviceSettingsBaseKms;
    }

    let nextServiceDueDate = null;
    let nextServiceDueKms = null;

    if (baselineDate && serviceIntervalMonths) {
      nextServiceDueDate = new Date(baselineDate);
      nextServiceDueDate.setMonth(nextServiceDueDate.getMonth() + serviceIntervalMonths);
    }

    if (baselineKms !== null && serviceIntervalKms) {
      nextServiceDueKms = baselineKms + serviceIntervalKms;
    }

    // Determine status
    let status = 'insufficient_data';
    const hasEnoughData = !!((baselineDate && serviceIntervalMonths) || (baselineKms !== null && serviceIntervalKms));

    if (hasEnoughData) {
      status = 'up_to_date';
      const now = new Date();
      
      if (nextServiceDueDate) {
        const diffTime = nextServiceDueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
          status = 'overdue';
        } else if (diffDays <= 30) {
          status = 'due_soon';
        }
      }

      if (status !== 'overdue' && nextServiceDueKms !== null && currentKms !== null) {
        const kmsRemaining = nextServiceDueKms - currentKms;
        
        if (kmsRemaining <= 0) {
          status = 'overdue';
        } else if (kmsRemaining <= 1000) {
          if (status !== 'overdue') status = 'due_soon';
        }
      }
    }

    let kmsUntilNextService = null;
    if (nextServiceDueKms !== null && currentKms !== null) {
      kmsUntilNextService = nextServiceDueKms - currentKms;
    }

    return {
      currentKms,
      baselineSource,
      baselineDate,
      baselineKms,
      lastServiceDate: lastService?.eventDate || null,
      lastServiceKms: lastService?.odometerAtEvent || null,
      serviceIntervalMonths,
      serviceIntervalKms,
      nextServiceDueDate,
      nextServiceDueKms,
      kmsUntilNextService,
      status,
      hasEnoughData,
    };
  }

  private async ensureVehicleNotLocked(vehicleId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        user: { select: { dailyVehicleId: true, plan: true } },
        attributes: true,
        odometers: {
          where: { source: 'manual' },
          take: 1,
          orderBy: { readingDate: 'desc' },
        },
        registrations: true,
        insurance: true,
        services: {
          orderBy: { eventDate: 'desc' },
          include: {
            attachments: true,
          },
        },
        workJobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            attachments: true,
            parts: {
              include: { savedPart: true },
              orderBy: { savedPart: { name: 'asc' } }
            },
            specs: {
              include: { customSpec: true },
              orderBy: { customSpec: { label: 'asc' } }
            },
          },
        },
        documents: {
          orderBy: { date: 'desc' },
        },
        reminders: {
          where: { status: 'open' },
          orderBy: { dueDate: 'asc' },
        },
        photos: {
          orderBy: { createdAt: 'desc' },
        },
        customSpecs: {
          orderBy: [{ group: 'asc' }, { label: 'asc' }],
        },
        savedParts: {
          orderBy: [
            { category: 'asc' },
            { name: 'asc' },
            { id: 'asc' }
          ],
        },
        partPresets: {
          include: {
            items: {
              include: {
                savedPart: true,
              },
              orderBy: { savedPart: { name: 'asc' } }
            },
          },
          orderBy: [
            { name: 'asc' },
            { id: 'asc' }
          ],
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const { lockedIds, reason } = await this.getLockStatusForUserVehicles(vehicle.userId);
    const isLocked = lockedIds.includes(id);

    if (isLocked) {
      throw new BadRequestException({
        error: 'Vehicle Locked',
        message: 'This vehicle is locked under your current plan. Please upgrade to Pro to regain access.',
        lockReason: reason,
        isLocked: true,
        vehicleNickname: vehicle.nickname,
      });
    }

    const { user, ...vehicleData } = vehicle;

    return {
      ...vehicleData,
      isDaily: vehicle.id === user.dailyVehicleId,
      serviceSummary: this.calculateServiceSummary(vehicle),
    };
  }

  async setDailyVehicle(userId: string, vehicleId: string) {
    // 1. Validate vehicle ownership and existence
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle || vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found or does not belong to this user.');
    }

    // 2. Update user's daily vehicle reference
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyVehicleId: vehicleId }
    });

    return { success: true, dailyVehicleId: vehicleId };
  }

  async createServiceEvent(vehicleId: string, dto: CreateServiceEventDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const data = { ...dto };
    if (typeof data.eventDate === 'string') {
      data.eventDate = new Date(data.eventDate);
    }

    const serviceEvent = await this.prisma.serviceEvent.create({
      data: {
        ...data,
        vehicleId,
      },
    });

    // Sync odometer history if provided
    if (dto.odometerAtEvent !== undefined && dto.odometerAtEvent !== null) {
      await this.prisma.odometerReading.create({
        data: {
          vehicleId,
          value: dto.odometerAtEvent,
          readingDate: serviceEvent.eventDate,
          source: 'service',
        },
      });

      // ONLY Main Service entries can update the currentOdometer cache.
      // Sub-services record the odometer in history but do not advance the vehicle cache.
      if (serviceEvent.isMainService) {
        const vehicle = await this.prisma.userVehicle.findUnique({ where: { id: vehicleId } });
        const currentEffectiveKms = vehicle.currentOdometer || 0;

        const newerReading = await this.prisma.odometerReading.findFirst({
          where: {
            vehicleId,
            readingDate: { gt: serviceEvent.eventDate },
          },
        });

        const isHigher = dto.odometerAtEvent > currentEffectiveKms;
        const isNewestByDate = !newerReading;

        // Rule: Never reduce current kms from a service entry, but always advance if higher
        // or if it's the newest reading by date and doesn't reduce the current value.
        if (isHigher || (isNewestByDate && dto.odometerAtEvent >= currentEffectiveKms)) {
          await this.prisma.userVehicle.update({
            where: { id: vehicleId },
            data: { currentOdometer: dto.odometerAtEvent },
          });
        }
      }
    }

    return serviceEvent;
  }

  private async getVehicleFinancials(vehicleId: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: {
        user: {
          select: { defaultCurrency: true },
        },
        services: {
          select: { totalCost: true },
        },
        workJobs: {
          select: { estimate: true, status: true },
        },
        registrations: {
          select: { cost: true },
        },
        insurance: {
          select: { premiumAmount: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    // Aggregation Logic:
    // 1. Services: All costs counted
    const totalServiceCost = vehicle.services.reduce((acc, s) => acc + (s.totalCost ? Number(s.totalCost) : 0), 0);
    
    // 2. Work: Split into Done vs Predicted
    const totalDoneWorkCost = vehicle.workJobs
      .filter(w => w.status === 'done')
      .reduce((acc, w) => acc + (w.estimate ? Number(w.estimate) : 0), 0);

    const totalPredictedWorkCost = vehicle.workJobs
      .filter(w => w.status !== 'done')
      .reduce((acc, w) => acc + (w.estimate ? Number(w.estimate) : 0), 0);

    // 3. Registration: All costs counted
    const totalRegistrationCost = vehicle.registrations.reduce((acc, r) => acc + (r.cost ? Number(r.cost) : 0), 0);

    // 4. Insurance: All costs counted
    const totalInsuranceCost = vehicle.insurance.reduce((acc, i) => acc + (i.premiumAmount ? Number(i.premiumAmount) : 0), 0);

    // Rule: Lifetime total includes all services, done work, registrations, and insurance premiums.
    const totalLifetimeCost = totalServiceCost + totalDoneWorkCost + totalRegistrationCost + totalInsuranceCost;

    const preferredCurrencyDisplay = vehicle.user?.defaultCurrency || 'AUD';

    return {
      totalServiceCost,
      totalDoneWorkCost,
      totalPredictedWorkCost,
      totalRegistrationCost,
      totalInsuranceCost,
      totalLifetimeCost,
      preferredCurrencyDisplay,
      costBreakdownMeta: {
        serviceRecordCount: vehicle.services.length,
        doneWorkJobCount: vehicle.workJobs.filter(w => w.status === 'done').length,
        predictedWorkJobCount: vehicle.workJobs.filter(w => w.status !== 'done').length,
        registrationRecordCount: vehicle.registrations.length,
        insuranceRecordCount: vehicle.insurance.length,
      },
    };
  }

  async getLifetimeCostSummary(vehicleId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const financials = await this.getVehicleFinancials(vehicleId);
    return {
      vehicleId,
      ...financials,
    };
  }

  async getServiceSummary(vehicleId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: {
        services: {
          orderBy: { eventDate: 'desc' },
        },
        odometers: {
          where: { source: 'manual' },
          take: 1,
          orderBy: { readingDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const financials = await this.getVehicleFinancials(vehicleId);

    return {
      vehicleId,
      serviceSummary: {
        ...this.calculateServiceSummary(vehicle),
        financials: {
          totalServiceSpend: financials.totalServiceCost,
          totalWorkSpend: financials.totalDoneWorkCost,
          totalLifetimeSpend: financials.totalLifetimeCost,
        },
      },
    };
  }

  // --- REGISTRATION ---

  private validateCountryRules(countryCode: string, region?: string) {
    const rules = COUNTRY_RULES[countryCode];
    if (rules?.regionRequired && !region) {
      throw new BadRequestException(`Region (State/Province) is required for country ${countryCode}`);
    }
  }

  private async deactivatePreviousCurrent(
    vehicleId: string,
    model: 'registrationRecord' | 'insuranceRecord',
    excludeId?: string,
  ) {
    const sourceType: ReminderSourceType = 
      model === 'registrationRecord' ? ReminderSourceType.registration : ReminderSourceType.insurance;

    if (model === 'registrationRecord') {
      // 1. Find all currently active records for this vehicle, excluding the one we might be updating
      const previousActive = await this.prisma.registrationRecord.findMany({
        where: {
          vehicleId,
          isCurrent: true,
          NOT: excludeId ? { id: excludeId } : undefined,
        },
        select: { id: true },
      });

      const previousIds = previousActive.map((r) => r.id);

      if (previousIds.length > 0) {
        // 2. Deactivate them
        await this.prisma.registrationRecord.updateMany({
          where: { id: { in: previousIds } },
          data: { isCurrent: false },
        });

        // 3. Remove their associated auto-reminders
        await this.prisma.reminder.deleteMany({
          where: {
            sourceId: { in: previousIds },
            sourceType,
            autoGenerated: true,
          },
        });
      }
    } else {
      // 1. Find all currently active records for this vehicle, excluding the one we might be updating
      const previousActive = await this.prisma.insuranceRecord.findMany({
        where: {
          vehicleId,
          isCurrent: true,
          NOT: excludeId ? { id: excludeId } : undefined,
        },
        select: { id: true },
      });

      const previousIds = previousActive.map((r) => r.id);

      if (previousIds.length > 0) {
        // 2. Deactivate them
        await this.prisma.insuranceRecord.updateMany({
          where: { id: { in: previousIds } },
          data: { isCurrent: false },
        });

        // 3. Remove their associated auto-reminders
        await this.prisma.reminder.deleteMany({
          where: {
            sourceId: { in: previousIds },
            sourceType,
            autoGenerated: true,
          },
        });
      }
    }
  }

  private async upsertAutoReminder(
    vehicleId: string,
    sourceId: string,
    sourceType: ReminderSourceType,
    title: string,
    expiryDate: Date,
  ) {
    // Normalize to midnight UTC to ensure consistency across timezones for date-only expiries.
    // This prevents "Today" expiries from becoming "Yesterday" (Overdue) in western timezones.
    const reminderDate = new Date(Date.UTC(
      expiryDate.getUTCFullYear(),
      expiryDate.getUTCMonth(),
      expiryDate.getUTCDate(),
      0, 0, 0, 0
    ));

    // To prevent any possible duplication or stale records, we clean up first
    // then recreate or update the single source of truth for this record.
    const existing = await this.prisma.reminder.findFirst({
      where: { sourceId, sourceType, autoGenerated: true },
    });

    if (existing) {
      await this.prisma.reminder.update({
        where: { id: existing.id },
        data: {
          title,
          dueDate: reminderDate,
          status: 'open',
        },
      });
      
      // Safety: Delete any accidental duplicates for this source
      await this.prisma.reminder.deleteMany({
        where: { 
          sourceId, 
          sourceType, 
          autoGenerated: true,
          NOT: { id: existing.id }
        },
      });
    } else {
      await this.prisma.reminder.create({
        data: {
          vehicleId,
          title,
          dueDate: reminderDate,
          type: sourceType.toString(),
          status: 'open',
          sourceId,
          sourceType,
          autoGenerated: true,
        },
      });
    }
  }

  private async removeAutoReminder(sourceId: string, sourceType: ReminderSourceType) {
    await this.prisma.reminder.deleteMany({
      where: { sourceId, sourceType, autoGenerated: true },
    });
  }

  async findOneRegistration(vehicleId: string, regId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const reg = await this.prisma.registrationRecord.findFirst({
      where: { id: regId, vehicleId },
    });
    if (!reg) {
      throw new NotFoundException(`Registration record with ID ${regId} not found for this vehicle`);
    }
    return reg;
  }

  async createRegistration(vehicleId: string, dto: CreateRegistrationDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const { isCurrent, cost, ...rest } = dto;
    
    this.validateCountryRules(dto.countryCode, dto.region);

    // Validation: Expiry must be after start date
    if (dto.registrationStartDate && dto.expiryDate <= dto.registrationStartDate) {
      throw new BadRequestException('Registration expiry date must be after the start date');
    }

    const effectiveIsCurrent = isCurrent ?? true;

    try {
      if (effectiveIsCurrent) {
        await this.deactivatePreviousCurrent(vehicleId, 'registrationRecord');
      }

      const reg = await this.prisma.registrationRecord.create({
        data: {
          ...rest,
          cost: cost !== undefined ? new Prisma.Decimal(cost) : null,
          vehicleId,
          isCurrent: effectiveIsCurrent,
          registrationStatus: dto.registrationStatus || RegistrationStatus.active,
        },
      });

      if (reg.isCurrent && reg.registrationStatus === RegistrationStatus.active) {
        await this.upsertAutoReminder(
          vehicleId,
          reg.id,
          ReminderSourceType.registration,
          `Registration Renewal: ${reg.regNumber}`,
          reg.expiryDate,
        );
      }

      return reg;
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      console.error('[UserVehicleService] createRegistration failure:', err);
      // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
      throw new BadRequestException(`Failed to save registration record: ${err.message || 'Internal database error'}`);
    }
  }

  async updateRegistration(vehicleId: string, regId: string, dto: UpdateRegistrationDto) {
    // Safety check: record exists and belongs to vehicle
    const existing = await this.findOneRegistration(vehicleId, regId);

    // If it's a renewal, delegate to specialized logic to create new historical record
    if (dto.renew) {
      return this.renewRegistration(vehicleId, regId, {
        expiryDate: dto.expiryDate || existing.expiryDate,
        registrationStartDate: dto.registrationStartDate,
        cost: dto.cost,
        notes: dto.notes,
      });
    }

    if (dto.countryCode) {
      this.validateCountryRules(dto.countryCode, dto.region || existing.region);
    } else if (dto.region) {
      this.validateCountryRules(existing.countryCode, dto.region);
    }

    // Validation: Expiry must be after start date
    const start = dto.registrationStartDate || existing.registrationStartDate;
    const expiry = dto.expiryDate || existing.expiryDate;
    if (start && expiry <= start) {
      throw new BadRequestException('Registration expiry date must be after the start date');
    }

    try {
      if (dto.isCurrent) {
        await this.deactivatePreviousCurrent(vehicleId, 'registrationRecord', regId);
      }

      const { cost, renew, ...updateData } = dto;
      const data: Prisma.RegistrationRecordUpdateInput = { ...updateData };
      if (cost !== undefined) {
        data.cost = cost !== null ? new Prisma.Decimal(cost) : null;
      }

      const reg = await this.prisma.registrationRecord.update({
        where: { id: regId },
        data,
      });

      // Sync reminder
      if (reg.isCurrent && reg.registrationStatus === RegistrationStatus.active) {
        await this.upsertAutoReminder(
          vehicleId,
          reg.id,
          ReminderSourceType.registration,
          `Registration Renewal: ${reg.regNumber}`,
          reg.expiryDate,
        );
      } else {
        // If downgraded from current or no longer active, remove reminder
        await this.removeAutoReminder(reg.id, ReminderSourceType.registration);
      }

      return reg;
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      console.error('[UserVehicleService] updateRegistration failure:', err);
      throw new BadRequestException(`Failed to update registration record: ${err.message || 'Internal database error'}`);
    }
  }

  async removeRegistration(vehicleId: string, regId: string) {
    // Safety check: record exists and belongs to vehicle
    await this.findOneRegistration(vehicleId, regId);

    // Clean up auto-reminders
    await this.removeAutoReminder(regId, ReminderSourceType.registration);
    
    return this.prisma.registrationRecord.delete({
      where: { id: regId },
    });
  }

  async findAllRegistrations(vehicleId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    return this.prisma.registrationRecord.findMany({
      where: { vehicleId },
      orderBy: { expiryDate: 'desc' },
    });
  }

  async renewRegistration(vehicleId: string, regId: string, dto: RenewRegistrationDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const existing = await this.findOneRegistration(vehicleId, regId);

    // Logic: 
    // 1. Deactivate current active records
    await this.deactivatePreviousCurrent(vehicleId, 'registrationRecord');

    // 2. Create new record based on existing, but with new expiry and cost
    const newReg = await this.prisma.registrationRecord.create({
      data: {
        vehicleId,
        regNumber: existing.regNumber,
        countryCode: existing.countryCode,
        region: existing.region,
        issuingBody: existing.issuingBody,
        registrationStartDate: dto.registrationStartDate || existing.expiryDate,
        expiryDate: dto.expiryDate,
        cost: dto.cost !== undefined ? new Prisma.Decimal(dto.cost) : null,
        currency: existing.currency,
        isCurrent: true,
        registrationStatus: RegistrationStatus.active,
        notes: dto.notes || `Renewed from record ${regId}`,
      },
    });

    // 3. Create reminder for new record
    await this.upsertAutoReminder(
      vehicleId,
      newReg.id,
      ReminderSourceType.registration,
      `Registration Renewal: ${newReg.regNumber}`,
      newReg.expiryDate,
    );

    return newReg;
  }

  // --- INSURANCE ---

  async findOneInsurance(vehicleId: string, insId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const ins = await this.prisma.insuranceRecord.findFirst({
      where: { id: insId, vehicleId },
    });
    if (!ins) {
      throw new NotFoundException(`Insurance record with ID ${insId} not found for this vehicle`);
    }
    return ins;
  }

  async createInsurance(vehicleId: string, dto: CreateInsuranceDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const { isCurrent, premiumAmount, ...rest } = dto;

    // Validation: Expiry must be after start date
    if (dto.policyStartDate && dto.expiryDate <= dto.policyStartDate) {
      throw new BadRequestException('Insurance expiry date must be after the policy start date');
    }

    const effectiveIsCurrent = isCurrent ?? true;

    try {
      if (effectiveIsCurrent) {
        await this.deactivatePreviousCurrent(vehicleId, 'insuranceRecord');
      }

      const ins = await this.prisma.insuranceRecord.create({
        data: {
          ...rest,
          premiumAmount: premiumAmount !== undefined ? new Prisma.Decimal(premiumAmount) : null,
          vehicleId,
          isCurrent: effectiveIsCurrent,
          insuranceStatus: dto.insuranceStatus || InsuranceStatus.active,
        },
      });

      if (ins.isCurrent && ins.insuranceStatus === InsuranceStatus.active) {
        await this.upsertAutoReminder(
          vehicleId,
          ins.id,
          ReminderSourceType.insurance,
          `Insurance Renewal: ${ins.provider}`,
          ins.expiryDate,
        );
      }

      return ins;
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      console.error('[UserVehicleService] createInsurance failure:', err);
      throw new BadRequestException(`Failed to save insurance record: ${err.message || 'Internal database error'}`);
    }
  }

  async updateInsurance(vehicleId: string, insId: string, dto: UpdateInsuranceDto) {
    // Safety check: record exists and belongs to vehicle
    const existing = await this.findOneInsurance(vehicleId, insId);

    // If it's a renewal, delegate to specialized logic to create new historical record
    if (dto.renew) {
      return this.renewInsurance(vehicleId, insId, {
        expiryDate: dto.expiryDate || existing.expiryDate,
        policyStartDate: dto.policyStartDate,
        premiumAmount: dto.premiumAmount,
        notes: dto.notes,
      });
    }

    // Validation: Expiry must be after start date
    const start = dto.policyStartDate || existing.policyStartDate;
    const expiry = dto.expiryDate || existing.expiryDate;
    if (start && expiry <= start) {
      throw new BadRequestException('Insurance expiry date must be after the policy start date');
    }

    try {
      if (dto.isCurrent) {
        await this.deactivatePreviousCurrent(vehicleId, 'insuranceRecord', insId);
      }

      const { premiumAmount, renew, ...updateData } = dto;
      const data: Prisma.InsuranceRecordUpdateInput = { ...updateData };
      if (premiumAmount !== undefined) {
        data.premiumAmount = premiumAmount !== null ? new Prisma.Decimal(premiumAmount) : null;
      }

      const ins = await this.prisma.insuranceRecord.update({
        where: { id: insId },
        data,
      });

      // Sync reminder
      if (ins.isCurrent && ins.insuranceStatus === InsuranceStatus.active) {
        await this.upsertAutoReminder(
          vehicleId,
          ins.id,
          ReminderSourceType.insurance,
          `Insurance Renewal: ${ins.provider}`,
          ins.expiryDate,
        );
      } else {
        // If downgraded from current or no longer active, remove reminder
        await this.removeAutoReminder(ins.id, ReminderSourceType.insurance);
      }

      return ins;
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      console.error('[UserVehicleService] updateInsurance failure:', err);
      throw new BadRequestException(`Failed to update insurance record: ${err.message || 'Internal database error'}`);
    }
  }

  async removeInsurance(vehicleId: string, insId: string) {
    // Safety check: record exists and belongs to vehicle
    await this.findOneInsurance(vehicleId, insId);

    // Clean up auto-reminders
    await this.removeAutoReminder(insId, ReminderSourceType.insurance);

    return this.prisma.insuranceRecord.delete({
      where: { id: insId },
    });
  }

  async findAllInsurance(vehicleId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    return this.prisma.insuranceRecord.findMany({
      where: { vehicleId },
      orderBy: { expiryDate: 'desc' },
    });
  }

  async renewInsurance(vehicleId: string, insId: string, dto: RenewInsuranceDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const existing = await this.findOneInsurance(vehicleId, insId);

    // Logic:
    // 1. Deactivate current active records
    await this.deactivatePreviousCurrent(vehicleId, 'insuranceRecord');

    // 2. Create new record based on existing, but with new expiry and premium
    const newIns = await this.prisma.insuranceRecord.create({
      data: {
        vehicleId,
        provider: existing.provider,
        policyNumber: existing.policyNumber,
        policyType: existing.policyType,
        policyStartDate: dto.policyStartDate || existing.expiryDate,
        expiryDate: dto.expiryDate,
        premiumAmount: dto.premiumAmount !== undefined ? new Prisma.Decimal(dto.premiumAmount) : null,
        currency: existing.currency,
        paymentFrequency: existing.paymentFrequency,
        isCurrent: true,
        insuranceStatus: InsuranceStatus.active,
        notes: dto.notes || `Renewed from record ${insId}`,
      },
    });

    // 3. Create reminder for new record
    await this.upsertAutoReminder(
      vehicleId,
      newIns.id,
      ReminderSourceType.insurance,
      `Insurance Renewal: ${newIns.provider}`,
      newIns.expiryDate,
    );

    return newIns;
  }

  async createWorkJob(vehicleId: string, dto: CreateWorkJobDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const { parts, specs, ...dtoData } = dto;
    const data: any = { ...dtoData };
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date);
    }

    if (parts) {
      const partIds = parts.map(p => p.savedPartId);
      const partsCount = await this.prisma.savedPart.count({
        where: { id: { in: partIds }, vehicleId },
      });
      if (partsCount !== new Set(partIds).size) {
        throw new BadRequestException('One or more parts are invalid or do not belong to this vehicle');
      }
    }

    if (specs) {
      const specIds = specs.map(s => s.customSpecId);
      const specsCount = await this.prisma.userVehicleCustomSpec.count({
        where: { id: { in: specIds }, vehicleId },
      });
      if (specsCount !== new Set(specIds).size) {
        throw new BadRequestException('One or more specs are invalid or do not belong to this vehicle');
      }
    }

    return this.prisma.workJob.create({
      data: {
        ...data,
        vehicleId,
        parts: parts ? {
          create: parts.map(p => ({
            savedPartId: p.savedPartId,
            quantity: p.quantity,
            unitPriceSnapshot: p.unitPriceSnapshot,
            lineTotalSnapshot: p.lineTotalSnapshot,
            notes: p.notes,
          })),
        } : undefined,
        specs: specs ? {
          create: specs.map(s => ({
            customSpecId: s.customSpecId,
          })),
        } : undefined,
      },
      include: {
        attachments: true,
        parts: { include: { savedPart: true } },
        specs: { include: { customSpec: true } },
      },
    });
  }

  async findOneServiceEvent(vehicleId: string, serviceId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const service = await this.prisma.serviceEvent.findFirst({
      where: { id: serviceId, vehicleId },
      include: { attachments: true },
    });
    if (!service) {
      throw new NotFoundException(`Service event with ID ${serviceId} not found for this vehicle`);
    }
    return service;
  }

  async updateServiceEvent(vehicleId: string, serviceId: string, dto: UpdateServiceEventDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const data: any = { ...dto };
    if (data.eventDate && typeof data.eventDate === 'string') {
      data.eventDate = new Date(data.eventDate);
    }

    await this.findOneServiceEvent(vehicleId, serviceId);
    return this.prisma.serviceEvent.update({
      where: { id: serviceId },
      data,
    });
  }

  async removeServiceEvent(vehicleId: string, serviceId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const service = await this.prisma.serviceEvent.findFirst({
      where: { id: serviceId, vehicleId },
      include: { attachments: true },
    });
    if (!service) {
      throw new NotFoundException(`Service event with ID ${serviceId} not found for this vehicle`);
    }

    // Physical cleanup for attachments
    for (const attachment of service.attachments) {
      try {
        const filename = attachment.url.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'uploads', filename);
        await unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete physical attachment file during service removal: ${attachment.url}`, err);
      }
    }

    return this.prisma.serviceEvent.delete({
      where: { id: serviceId },
    });
  }

  async addServiceAttachment(serviceId: string, file: Express.Multer.File) {
    const attachment = await this.prisma.serviceAttachment.findFirst({
      where: { serviceEventId: serviceId },
      include: { serviceEvent: true },
    });
    if (attachment) {
      await this.ensureVehicleNotLocked(attachment.serviceEvent.vehicleId);
    }
    // If no attachment yet, we need to find the service event to get vehicleId
    if (!attachment) {
      const service = await this.prisma.serviceEvent.findUnique({ where: { id: serviceId } });
      if (service) await this.ensureVehicleNotLocked(service.vehicleId);
    }

    return this.prisma.serviceAttachment.create({
      data: {
        serviceEventId: serviceId,
        url: `/uploads/${file.filename}`,
        fileType: file.mimetype.split('/')[1],
        fileSize: file.size,
        title: file.originalname,
      },
    });
  }

  async removeServiceAttachment(serviceId: string, attachmentId: string) {
    const attachment = await this.prisma.serviceAttachment.findFirst({
      where: { id: attachmentId, serviceEventId: serviceId },
      include: { serviceEvent: true },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found for this service`);
    }

    await this.ensureVehicleNotLocked(attachment.serviceEvent.vehicleId);

    // Attempt physical cleanup
    try {
      const filename = attachment.url.replace('/uploads/', '');
      const filePath = join(process.cwd(), 'uploads', filename);
      await unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete physical attachment file: ${attachment.url}`, err);
    }

    return this.prisma.serviceAttachment.delete({
      where: { id: attachmentId },
    });
  }

  async findOneWorkJob(vehicleId: string, id: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const workJob = await this.prisma.workJob.findFirst({
      where: { id, vehicleId },
      include: { 
        attachments: true,
        parts: { include: { savedPart: true } },
        specs: { include: { customSpec: true } },
      },
    });
    if (!workJob) {
      throw new NotFoundException(`Work job with ID ${id} not found for this vehicle`);
    }
    return workJob;
  }

  async updateWorkJob(vehicleId: string, id: string, dto: UpdateWorkJobDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const { parts, specs, ...dtoData } = dto;
    const data: any = { ...dtoData };
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date);
    }
    await this.findOneWorkJob(vehicleId, id);

    if (parts) {
      const partIds = parts.map(p => p.savedPartId);
      const partsCount = await this.prisma.savedPart.count({
        where: { id: { in: partIds }, vehicleId },
      });
      if (partsCount !== new Set(partIds).size) {
        throw new BadRequestException('One or more parts are invalid or do not belong to this vehicle');
      }
    }

    if (specs) {
      const specIds = specs.map(s => s.customSpecId);
      const specsCount = await this.prisma.userVehicleCustomSpec.count({
        where: { id: { in: specIds }, vehicleId },
      });
      if (specsCount !== new Set(specIds).size) {
        throw new BadRequestException('One or more specs are invalid or do not belong to this vehicle');
      }
    }

    return this.prisma.workJob.update({
      where: { id },
      data: {
        ...data,
        parts: parts ? {
          deleteMany: {},
          create: parts.map(p => ({
            savedPartId: p.savedPartId,
            quantity: p.quantity,
            unitPriceSnapshot: p.unitPriceSnapshot,
            lineTotalSnapshot: p.lineTotalSnapshot,
            notes: p.notes,
          })),
        } : undefined,
        specs: specs ? {
          deleteMany: {},
          create: specs.map(s => ({
            customSpecId: s.customSpecId,
          })),
        } : undefined,
      },
      include: {
        attachments: true,
        parts: { include: { savedPart: true } },
        specs: { include: { customSpec: true } },
      },
    });
  }

  async removeWorkJob(vehicleId: string, workJobId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const workJob = await this.findOneWorkJob(vehicleId, workJobId);

    // Physical cleanup for attachments
    for (const attachment of workJob.attachments) {
      try {
        const filename = attachment.url.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'uploads', filename);
        await unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete physical attachment file during work job removal: ${attachment.url}`, err);
      }
    }

    return this.prisma.workJob.delete({
      where: { id: workJobId },
    });
  }

  async addWorkAttachment(workJobId: string, file: Express.Multer.File) {
    const workJob = await this.prisma.workJob.findUnique({ where: { id: workJobId } });
    if (workJob) await this.ensureVehicleNotLocked(workJob.vehicleId);

    return this.prisma.workAttachment.create({
      data: {
        workJobId: workJobId,
        url: `/uploads/${file.filename}`,
        fileType: file.mimetype.split('/')[1],
        fileSize: file.size,
        title: file.originalname,
      },
    });
  }

  async removeWorkAttachment(workJobId: string, attachmentId: string) {
    const attachment = await this.prisma.workAttachment.findFirst({
      where: { id: attachmentId, workJobId: workJobId },
      include: { workJob: true },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found for this work job`);
    }

    await this.ensureVehicleNotLocked(attachment.workJob.vehicleId);

    // Attempt physical cleanup
    try {
      const filename = attachment.url.replace('/uploads/', '');
      const filePath = join(process.cwd(), 'uploads', filename);
      await unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete physical attachment file: ${attachment.url}`, err);
    }

    return this.prisma.workAttachment.delete({
      where: { id: attachmentId },
    });
  }

  async createDocument(vehicleId: string, dto: CreateDocumentDto, file?: Express.Multer.File) {
    await this.ensureVehicleNotLocked(vehicleId);

    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: { user: { select: { plan: true } } }
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);

    const fileData: any = {};
    if (file) {
      // Enforce Size Limits
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > limits.maxDocumentSizeMB) {
        // Since the file is already uploaded to disk by Multer, we should clean it up
        try {
          await unlink(file.path);
        } catch (err) {
          console.error('Failed to cleanup oversized document file:', err);
        }

        throw new BadRequestException({
          error: 'limit_reached',
          type: 'document_size_limit',
          message: `Your current plan (${vehicle.user.plan || 'free'}) allows a maximum document size of ${limits.maxDocumentSizeMB} MB.`,
          plan: vehicle.user.plan || 'free',
          limit: limits.maxDocumentSizeMB,
          current: parseFloat(fileSizeMB.toFixed(2))
        });
      }

      fileData.fileUrl = `/uploads/${file.filename}`;
      fileData.fileType = file.mimetype.split('/')[1];
      fileData.fileSize = file.size;
    }

    return this.prisma.document.create({
      data: {
        ...dto,
        ...fileData,
        vehicleId,
      },
    });
  }

  async createReminder(vehicleId: string, dto: CreateReminderDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    return this.prisma.reminder.create({
      data: {
        ...dto,
        vehicleId,
      },
    });
  }

  async findOneReminder(vehicleId: string, id: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, vehicleId },
    });
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found for this vehicle`);
    }
    return reminder;
  }

  async updateReminderMetadata(vehicleId: string, id: string, dto: UpdateReminderDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    await this.findOneReminder(vehicleId, id);
    return this.prisma.reminder.update({
      where: { id },
      data: dto as Prisma.ReminderUpdateInput,
    });
  }

  async updateReminder(id: string, status: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (reminder) await this.ensureVehicleNotLocked(reminder.vehicleId);

    return this.prisma.reminder.update({
      where: { id },
      data: { status },
    });
  }

  async removeReminder(vehicleId: string, reminderId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    await this.findOneReminder(vehicleId, reminderId);
    return this.prisma.reminder.delete({
      where: { id: reminderId },
    });
  }

  async findOneDocument(vehicleId: string, id: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const document = await this.prisma.document.findFirst({
      where: { id, vehicleId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found for this vehicle`);
    }
    return document;
  }

  async updateDocument(vehicleId: string, id: string, dto: UpdateDocumentDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    await this.findOneDocument(vehicleId, id);
    return this.prisma.document.update({
      where: { id },
      data: dto as Prisma.DocumentUpdateInput,
    });
  }

  async removeDocument(vehicleId: string, documentId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const document = await this.findOneDocument(vehicleId, documentId);

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found for this vehicle`);
    }

    // Attempt to delete physical file if it exists
    if (document.fileUrl) {
      try {
        // fileUrl is something like "/uploads/filename.ext"
        const filename = document.fileUrl.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'uploads', filename);
        await unlink(filePath);
      } catch (err) {
        // Log error but continue with DB deletion
        console.error(`Failed to delete physical file: ${document.fileUrl}`, err);
      }
    }

    return this.prisma.document.delete({
      where: { id: documentId },
    });
  }

  async remove(id: string) {
    // Locking should not prevent deletion of the vehicle itself?
    // Requirement says: "extra vehicles must NOT be deleted... Downgrading to Free must not delete any vehicles"
    // It doesn't explicitly say deleting a locked vehicle should be blocked.
    // Usually, you should be able to delete a locked vehicle if you want to make room.
    // Wait, if Free allows 1 usable vehicle (the oldest active), and I delete the oldest active, then the next oldest becomes usable.
    // So allowing deletion of any vehicle seems fine.
    // Let's NOT enforce lock on removal of the vehicle itself.
    
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        documents: true,
        photos: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Physical cleanup for documents
    for (const doc of vehicle.documents) {
      if (doc.fileUrl) {
        try {
          const filename = doc.fileUrl.replace('/uploads/', '');
          const filePath = join(process.cwd(), 'uploads', filename);
          await unlink(filePath);
        } catch (err) {
          console.error(`Failed to delete physical document file during vehicle removal: ${doc.fileUrl}`, err);
        }
      }
    }

    // Physical cleanup for photos
    for (const photo of vehicle.photos) {
      try {
        const filename = photo.url.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'uploads', filename);
        await unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete physical photo file during vehicle removal: ${photo.url}`, err);
      }
    }

    // Physical cleanup for banner
    if (vehicle.bannerImagePath) {
      try {
        const filePath = join(process.cwd(), 'uploads', vehicle.bannerImagePath);
        await unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete physical banner file during vehicle removal: ${vehicle.bannerImagePath}`, err);
      }
    }

    return this.prisma.userVehicle.delete({
      where: { id: vehicle.id },
    });
  }

  async updateBanner(id: string, file: Express.Multer.File, metadata?: UpdateBannerMetadataDto) {
    await this.ensureVehicleNotLocked(id);
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Delete old banner file if it exists
    if (vehicle.bannerImagePath) {
      try {
        const oldPath = join(process.cwd(), 'uploads', vehicle.bannerImagePath);
        await unlink(oldPath);
      } catch (err) {
        console.error(`Failed to delete old banner file: ${vehicle.bannerImagePath}`, err);
      }
    }

    return this.prisma.userVehicle.update({
      where: { id },
      data: {
        bannerImageUrl: `/uploads/${file.filename}`,
        bannerImagePath: file.filename,
        bannerUpdatedAt: new Date(),
        ...this.normalizeBannerMetadata(metadata),
      },
    });
  }

  async updateBannerMetadata(id: string, metadata: UpdateBannerMetadataDto) {
    await this.ensureVehicleNotLocked(id);
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return this.prisma.userVehicle.update({
      where: { id },
      data: this.normalizeBannerMetadata(metadata),
    });
  }

  async removeBanner(id: string) {
    await this.ensureVehicleNotLocked(id);
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    if (vehicle.bannerImagePath) {
      try {
        const filePath = join(process.cwd(), 'uploads', vehicle.bannerImagePath);
        await unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete banner file: ${vehicle.bannerImagePath}`, err);
      }
    }

    return this.prisma.userVehicle.update({
      where: { id },
      data: {
        bannerImageUrl: null,
        bannerImagePath: null,
        bannerUpdatedAt: null,
      },
    });
  }

  async addVehiclePhoto(vehicleId: string, file: Express.Multer.File) {
    await this.ensureVehicleNotLocked(vehicleId);
    
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: {
        user: { select: { plan: true } },
        _count: { select: { photos: true } }
      }
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (vehicle._count.photos >= limits.maxPhotosPerVehicle) {
      // Cleanup uploaded file before throwing
      try {
        await unlink(file.path);
      } catch (err) {
        console.error('Failed to cleanup rejected photo file:', err);
      }

      throw new BadRequestException({
        error: 'limit_reached',
        type: 'photo_limit',
        message: `Your current plan (${vehicle.user.plan || 'free'}) allows a maximum of ${limits.maxPhotosPerVehicle} photos per vehicle.`,
        plan: vehicle.user.plan || 'free',
        limit: limits.maxPhotosPerVehicle,
        current: vehicle._count.photos
      });
    }

    return this.prisma.vehiclePhoto.create({
      data: {
        vehicleId,
        url: `/uploads/${file.filename}`,
      },
    });
  }

  async removeVehiclePhoto(vehicleId: string, photoId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const photo = await this.prisma.vehiclePhoto.findFirst({
      where: { id: photoId, vehicleId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found for this vehicle`);
    }

    // Attempt physical cleanup
    try {
      const filename = photo.url.replace('/uploads/', '');
      const filePath = join(process.cwd(), 'uploads', filename);
      await unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete physical photo file: ${photo.url}`, err);
    }

    return this.prisma.vehiclePhoto.delete({
      where: { id: photoId },
    });
  }

  async getVehicleWithSpecs(id: string) {
    // Locking should probably block this too as it's "details"
    await this.ensureVehicleNotLocked(id);
    const vehicle = await this.findOne(id);

    if (!vehicle.specId) {
      return {
        vehicle,
        specs: null,
        message: 'Vehicle is not linked to SpecHUB',
      };
    }

    try {
      const specs: SpecHubGetSpecResponse = await this.specHubClient.getSpecs(vehicle.specId);

      return {
        vehicle,
        specs,
      };
    } catch {
      return {
        vehicle,
        specs: null,
        message: 'Unable to fetch detailed specifications at this time.',
      };
    }
  }

  async createCustomSpec(vehicleId: string, dto: CreateCustomSpecDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    return this.prisma.userVehicleCustomSpec.create({
      data: {
        ...dto,
        vehicleId,
      },
    });
  }

  async updateCustomSpec(vehicleId: string, specId: string, dto: UpdateCustomSpecDto) {
    await this.ensureVehicleNotLocked(vehicleId);
    const spec = await this.prisma.userVehicleCustomSpec.findFirst({
      where: { id: specId, vehicleId },
    });
    if (!spec) {
      throw new NotFoundException(`Custom spec with ID ${specId} not found for this vehicle`);
    }
    return this.prisma.userVehicleCustomSpec.update({
      where: { id: specId },
      data: dto as Prisma.UserVehicleCustomSpecUpdateInput,
    });
  }

  async removeCustomSpec(vehicleId: string, specId: string) {
    await this.ensureVehicleNotLocked(vehicleId);
    const spec = await this.prisma.userVehicleCustomSpec.findFirst({
      where: { id: specId, vehicleId },
    });
    if (!spec) {
      throw new NotFoundException(`Custom spec with ID ${specId} not found for this vehicle`);
    }
    return this.prisma.userVehicleCustomSpec.delete({
      where: { id: specId },
    });
  }

  async exportVehicleHistory(id: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        user: { select: { plan: true } },
        services: {
          orderBy: { eventDate: 'desc' },
        },
        workJobs: {
          where: { status: 'done' },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (!limits.canExportPdf) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'export_pdf',
        message: 'PDF export is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    const financials = await this.getVehicleFinancials(id);
    const moneyFormatter = this.getPdfMoneyFormatter(financials);

    const doc = new PDFDocument({ 
      margin: 50,
      bufferPages: true,
      info: {
        Title: `Vehicle History - ${vehicle.nickname || vehicle.model}`,
        Author: 'AutoFolio',
      }
    });
    
    doc.fontSize(20).font('Helvetica-Bold').text('AutoFolio', { align: 'left' });
    doc.fontSize(24).text('Vehicle History Report');
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown(2);

    this.buildVehicleSummarySection(doc, vehicle, financials);

    // --- Vehicle Health Summary (New Section) ---
    const lastService = vehicle.services[0];
    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Health Summary');
    doc.moveTo(50, doc.y).lineTo(300, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Maintenance Records: ${vehicle.services.length + vehicle.workJobs.length}`);
    doc.text(`Total Lifetime Investment: ${moneyFormatter.format(financials.totalLifetimeCost)}`);
    doc.text(`Last Service Date: ${lastService ? lastService.eventDate.toLocaleDateString('en-AU') : 'No record'}`);
    doc.moveDown(2);

    // Maintenance History (Renamed from Service History)
    doc.fontSize(16).font('Helvetica-Bold').text('Maintenance History');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);

    if (vehicle.services.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No maintenance records available');
    } else {
      vehicle.services.forEach(s => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${s.eventDate.toLocaleDateString('en-AU')} — ${s.title}`);
        doc.font('Helvetica');
        if (s.odometerAtEvent) doc.text(`Odometer: ${new Intl.NumberFormat('en-AU').format(s.odometerAtEvent)} km`);
        doc.text(`Cost: ${this.formatPdfCurrency(s.totalCost, moneyFormatter)}`);
        if (s.notes && s.notes.trim()) {
          doc.fontSize(10).text(`Notes: ${s.notes}`, { width: 450 });
        }
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1.5);

    // Upgrades & Repairs (Renamed from Work History)
    doc.fontSize(16).font('Helvetica-Bold').text('Upgrades & Repairs');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);

    if (vehicle.workJobs.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No upgrades or repairs recorded');
    } else {
      vehicle.workJobs.forEach(w => {
        const workDate = w.date || w.createdAt;
        doc.fontSize(12).font('Helvetica-Bold').text(`${workDate.toLocaleDateString('en-AU')} — ${w.title}`);
        doc.font('Helvetica');
        doc.text(`Cost: ${this.formatPdfCurrency(w.estimate, moneyFormatter)}`);
        if (w.notes && w.notes.trim()) {
          doc.fontSize(10).text(`Notes: ${w.notes}`, { width: 450 });
        }
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(2);

    // Totals
    doc.fontSize(16).font('Helvetica-Bold').text('Totals');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Service Spend: ${moneyFormatter.format(financials.totalServiceCost)}`);
    doc.text(`Work Spend: ${moneyFormatter.format(financials.totalDoneWorkCost)}`);
    
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(250, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(14).font('Helvetica-Bold').text(`Total Lifetime Spend: ${moneyFormatter.format(financials.totalLifetimeCost)}`);

    this.buildPdfFooter(doc);
    doc.end();
    return doc;
  }

  // --- PUBLIC REPORT SHARING ---

  async enablePublicReport(vehicleId: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: { user: { select: { plan: true } } },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (!limits.canSharePublicReport) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'public_report',
        message: 'Public vehicle reports are available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    // Generate a secure, unguessable token
    const token = randomBytes(16).toString('hex');

    return this.prisma.userVehicle.update({
      where: { id: vehicleId },
      data: {
        publicShareToken: token,
        publicShareEnabled: true,
        publicShareCreatedAt: new Date(),
      },
      select: {
        id: true,
        publicShareToken: true,
        publicShareEnabled: true,
        publicShareCreatedAt: true,
      },
    });
  }

  async disablePublicReport(vehicleId: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    return this.prisma.userVehicle.update({
      where: { id: vehicleId },
      data: {
        publicShareEnabled: false,
        publicShareToken: null,
        publicShareCreatedAt: null,
      },
      select: {
        id: true,
        publicShareEnabled: false,
      },
    });
  }

  async getPublicReport(token: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { publicShareToken: token },
      include: {
        user: { select: { defaultCurrency: true } },
        services: {
          orderBy: { eventDate: 'desc' },
          select: {
            title: true,
            eventDate: true,
            odometerAtEvent: true,
            totalCost: true,
          },
        },
        workJobs: {
          where: { status: 'done' },
          orderBy: { date: 'desc' },
          select: {
            title: true,
            date: true,
            estimate: true,
            notes: true,
          },
        },
      },
    });

    if (!vehicle || !vehicle.publicShareEnabled) {
      throw new NotFoundException('Public report not found or is no longer available');
    }

    const financials = await this.getVehicleFinancials(vehicle.id);

    // Return only safe read-only data
    return {
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        nickname: vehicle.nickname,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        currentOdometer: vehicle.currentOdometer,
      },
      services: vehicle.services,
      workHistory: vehicle.workJobs,
      financials: {
        totalServiceCost: financials.totalServiceCost,
        totalDoneWorkCost: financials.totalDoneWorkCost,
        totalLifetimeCost: financials.totalLifetimeCost,
        currency: financials.preferredCurrencyDisplay,
      },
      generatedAt: vehicle.publicShareCreatedAt,
    };
  }

  private buildVehicleSummarySection(doc: any, vehicle: any, financials: any) {
    const formatOdometer = (value: number | null | undefined) => {
      if (value === null || value === undefined) return 'N/A';
      return new Intl.NumberFormat('en-AU').format(value) + ' km';
    };

    doc.fontSize(16).font('Helvetica-Bold').text('Vehicle Summary');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica-Bold').text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    doc.font('Helvetica');
    if (vehicle.nickname) doc.text(`Nickname: ${vehicle.nickname}`);
    if (vehicle.licensePlate) doc.text(`Plate: ${vehicle.licensePlate}`);
    if (vehicle.vin) doc.text(`VIN: ${vehicle.vin}`);
    doc.text(`Current Odometer: ${formatOdometer(vehicle.currentOdometer)}`);
    doc.moveDown(2);
  }

  private buildPdfFooter(doc: any) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').fillColor('#999999').text(
        `Generated by AutoFolio  |  Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }
  }

  private getPdfMoneyFormatter(financials: any) {
    return new Intl.NumberFormat('en-AU', { 
      style: 'currency', 
      currency: financials.preferredCurrencyDisplay || 'AUD' 
    });
  }

  private formatPdfCurrency(amount: number | Prisma.Decimal | null | undefined, formatter: Intl.NumberFormat) {
    if (amount === null || amount === undefined || Number(amount) === 0) {
      return 'Not recorded';
    }
    return formatter.format(Number(amount));
  }

  // --- TAB-SPECIFIC EXPORTS ---

  async exportWorkJobPdf(vehicleId: string, workJobId: string) {
    const workJob = await this.prisma.workJob.findFirst({
      where: { id: workJobId, vehicleId },
      include: {
        vehicle: {
          include: {
            user: { select: { plan: true, defaultCurrency: true } }
          }
        },
        parts: { include: { savedPart: true } },
        specs: { include: { customSpec: true } },
        attachments: true,
      }
    });

    if (!workJob) {
      throw new NotFoundException(`Work job with ID ${workJobId} not found for this vehicle`);
    }

    const limits = this.getPlanLimits(workJob.vehicle.user.plan);
    if (!limits.canExportPdf) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'export_pdf',
        message: 'Job card PDF export is a Pro feature. Please upgrade to use this feature.',
        plan: workJob.vehicle.user.plan || 'free',
      });
    }

    const currency = workJob.vehicle.user.defaultCurrency || 'AUD';
    const moneyFormatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
    });

    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('AutoFolio', { align: 'left' });
    doc.fontSize(24).text('Job Card');
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown(1);

    // Vehicle Summary
    const formatOdometer = (value: number | null | undefined) => {
      if (value === null || value === undefined) return 'N/A';
      return new Intl.NumberFormat('en-AU').format(value) + ' km';
    };

    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Summary');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text(`${workJob.vehicle.year} ${workJob.vehicle.make} ${workJob.vehicle.model}`);
    doc.font('Helvetica').fontSize(10);
    if (workJob.vehicle.nickname) doc.text(`Nickname: ${workJob.vehicle.nickname}`);
    if (workJob.vehicle.licensePlate) doc.text(`Plate: ${workJob.vehicle.licensePlate}`);
    if (workJob.vehicle.vin) doc.text(`VIN: ${workJob.vehicle.vin}`);
    doc.text(`Odometer: ${formatOdometer(workJob.vehicle.currentOdometer)}`);
    doc.moveDown(1.5);

    // Work Details
    doc.fontSize(14).font('Helvetica-Bold').text('Work Item Details');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(workJob.title);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Status: ${workJob.status.toUpperCase()} | Priority: ${workJob.priority?.toUpperCase() || 'MEDIUM'}`);
    if (workJob.date) doc.text(`Date: ${workJob.date.toLocaleDateString('en-AU')}`);
    doc.moveDown(1.5);

    // Linked Specs
    if (workJob.specs.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Required Specifications');
      doc.moveTo(50, doc.y).lineTo(300, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
      doc.moveDown(0.5);

      workJob.specs.forEach(s => {
        const spec = s.customSpec;
        doc.fontSize(10).font('Helvetica-Bold').text(`${spec.group} - ${spec.label}: `, { continued: true })
           .font('Helvetica').text(`${spec.value}${spec.unit ? ' ' + spec.unit : ''}`);
        if (spec.notes) doc.fontSize(9).fillColor('#666666').text(`Note: ${spec.notes}`).fillColor('#000000');
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Linked Parts
    if (workJob.parts.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Parts & Materials');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Qty', 50, tableTop);
      doc.text('Part Description', 100, tableTop);
      doc.text('Unit Price', 400, tableTop, { align: 'right', width: 70 });
      doc.text('Total', 480, tableTop, { align: 'right', width: 70 });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.3).strokeColor('#eeeeee').stroke();
      doc.moveDown(0.5);

      workJob.parts.forEach(p => {
        const currentY = doc.y;
        if (currentY > 700) doc.addPage();
        
        doc.fontSize(10).font('Helvetica');
        doc.text(p.quantity.toString(), 50, currentY);
        
        doc.font('Helvetica-Bold').text(p.savedPart.name, 100, currentY, { width: 280 });
        doc.font('Helvetica').fontSize(9);
        const partDetails = [];
        if (p.savedPart.partNumber) partDetails.push(`P/N: ${p.savedPart.partNumber}`);
        if (p.savedPart.supplier) partDetails.push(`Supplier: ${p.savedPart.supplier}`);
        if (partDetails.length > 0) doc.text(partDetails.join(' | '), 100, doc.y);
        if (p.notes) doc.fontSize(8).fillColor('#666666').text(`Job Part Note: ${p.notes}`).fillColor('#000000');

        const unitPrice = p.unitPriceSnapshot ? moneyFormatter.format(Number(p.unitPriceSnapshot)) : '---';
        const lineTotal = p.lineTotalSnapshot ? moneyFormatter.format(Number(p.lineTotalSnapshot)) : '---';

        doc.fontSize(10).text(unitPrice, 400, currentY, { align: 'right', width: 70 });
        doc.text(lineTotal, 480, currentY, { align: 'right', width: 70 });
        
        doc.moveDown(0.8);
      });
      doc.moveDown(1);
    }

    // Work Notes
    if (workJob.notes) {
      doc.fontSize(12).font('Helvetica-Bold').text('Notes & Description');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(workJob.notes, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // Totals
    if (workJob.estimate) {
      doc.fontSize(12).font('Helvetica-Bold').text('Estimate / Total', 350, doc.y, { align: 'right', width: 200 });
      doc.moveTo(400, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('#000000').stroke();
      doc.moveDown(0.3);
      doc.fontSize(16).text(moneyFormatter.format(Number(workJob.estimate)), 350, doc.y, { align: 'right', width: 200 });
    }

    this.buildPdfFooter(doc);
    doc.end();
    return doc;
  }

  async exportVehicleSpecs(id: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        user: { select: { plan: true } },
        customSpecs: {
          orderBy: [{ group: 'asc' }, { label: 'asc' }],
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (!limits.canExportPdf) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'export_pdf',
        message: 'PDF export is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    const financials = await this.getVehicleFinancials(id);
    const doc = new PDFDocument({ 
      margin: 50,
      bufferPages: true,
      info: {
        Title: `Technical Specifications - ${vehicle.nickname || vehicle.model}`,
        Author: 'AutoFolio',
      }
    });

    doc.fontSize(20).font('Helvetica-Bold').text('AutoFolio', { align: 'left' });
    doc.fontSize(24).text('Technical Specifications');
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown(2);

    this.buildVehicleSummarySection(doc, vehicle, financials);

    // Group specs by category
    const groupedSpecs = vehicle.customSpecs.reduce((acc, spec) => {
      if (!acc[spec.group]) acc[spec.group] = [];
      acc[spec.group].push(spec);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(groupedSpecs).forEach(([group, specs]: [string, any[]]) => {
      doc.moveDown(1);
      doc.fontSize(16).font('Helvetica-Bold').text(group);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
      doc.moveDown(0.5);

      specs.forEach(spec => {
        const startY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').text(spec.label, 50, startY, { width: 200 });
        doc.fontSize(10).font('Helvetica').text(`${spec.value}${spec.unit ? ' ' + spec.unit : ''}`, 250, startY, { width: 300, align: 'right' });
        
        if (spec.notes) {
          doc.moveDown(0.2);
          doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666').text(spec.notes, 50, doc.y, { width: 500 });
          doc.fillColor('#000000');
        }
        doc.moveDown(0.5);
      });
    });

    if (vehicle.customSpecs.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No technical specifications recorded.');
    }

    this.buildPdfFooter(doc);
    doc.end();
    return doc;
  }

  async exportServiceHistory(id: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        user: { select: { plan: true } },
        services: {
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (!limits.canExportPdf) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'export_pdf',
        message: 'This export feature is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    const financials = await this.getVehicleFinancials(id);
    const moneyFormatter = this.getPdfMoneyFormatter(financials);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    
    doc.fontSize(20).font('Helvetica-Bold').text('AutoFolio', { align: 'left' });
    doc.fontSize(24).text('Service History Report');
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown(2);

    this.buildVehicleSummarySection(doc, vehicle, financials);

    // --- Vehicle Health Summary (New Section) ---
    const lastService = vehicle.services[0];
    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Health Summary');
    doc.moveTo(50, doc.y).lineTo(300, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Maintenance Records: ${vehicle.services.length}`);
    doc.text(`Total Maintenance Investment: ${moneyFormatter.format(financials.totalServiceCost)}`);
    doc.text(`Last Service Date: ${lastService ? lastService.eventDate.toLocaleDateString('en-AU') : 'No record'}`);
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('Maintenance History');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);

    if (vehicle.services.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No maintenance records available');
    } else {
      vehicle.services.forEach(s => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${s.eventDate.toLocaleDateString('en-AU')} — ${s.title}`);
        doc.font('Helvetica');
        if (s.odometerAtEvent) doc.text(`Odometer: ${new Intl.NumberFormat('en-AU').format(s.odometerAtEvent)} km`);
        doc.text(`Cost: ${this.formatPdfCurrency(s.totalCost, moneyFormatter)}`);
        if (s.notes && s.notes.trim()) {
          doc.fontSize(10).text(`Notes: ${s.notes}`, { width: 450 });
        }
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1.5);

    doc.fontSize(16).font('Helvetica-Bold').text('Totals');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Service Spend: ${moneyFormatter.format(financials.totalServiceCost)}`);

    this.buildPdfFooter(doc);
    doc.end();
    return doc;
  }

  async exportWorkHistory(id: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        user: { select: { plan: true } },
        workJobs: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (!limits.canExportPdf) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'export_pdf',
        message: 'This export feature is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    const financials = await this.getVehicleFinancials(id);
    const moneyFormatter = this.getPdfMoneyFormatter(financials);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    
    doc.fontSize(20).font('Helvetica-Bold').text('AutoFolio', { align: 'left' });
    doc.fontSize(24).text('Work History Report');
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown(2);

    this.buildVehicleSummarySection(doc, vehicle, financials);

    // --- Vehicle Health Summary (New Section) ---
    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Health Summary');
    doc.moveTo(50, doc.y).lineTo(300, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Projects/Upgrades: ${vehicle.workJobs.length}`);
    doc.text(`Total Completed Work Investment: ${moneyFormatter.format(financials.totalDoneWorkCost)}`);
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('Upgrades & Repairs');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);

    if (vehicle.workJobs.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No upgrades or repairs recorded');
    } else {
      vehicle.workJobs.forEach(w => {
        const workDate = w.date || w.createdAt;
        doc.fontSize(12).font('Helvetica-Bold').text(`${workDate.toLocaleDateString('en-AU')} — ${w.title} [${w.status.toUpperCase()}]`);
        doc.font('Helvetica');
        doc.text(`Cost/Estimate: ${this.formatPdfCurrency(w.estimate, moneyFormatter)}`);
        if (w.notes && w.notes.trim()) {
          doc.fontSize(10).text(`Notes: ${w.notes}`, { width: 450 });
        }
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1.5);

    doc.fontSize(16).font('Helvetica-Bold').text('Totals');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Done Work Spend: ${moneyFormatter.format(financials.totalDoneWorkCost)}`);
    doc.text(`Predicted Work Spend: ${moneyFormatter.format(financials.totalPredictedWorkCost)}`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(250, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(`Total Work Pipeline: ${moneyFormatter.format(financials.totalDoneWorkCost + financials.totalPredictedWorkCost)}`);

    this.buildPdfFooter(doc);
    doc.end();
    return doc;
  }

  async exportDocumentsZip(id: string, documentIds?: string[]) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id },
      include: {
        user: { select: { plan: true } },
        documents: {
          where: documentIds ? { id: { in: documentIds } } : undefined,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const limits = this.getPlanLimits(vehicle.user.plan);
    if (!limits.canExportZip) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'export_zip',
        message: 'This export feature is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    const documentsWithFiles = vehicle.documents.filter(d => d.fileUrl);
    if (documentsWithFiles.length === 0) {
      throw new NotFoundException({
        error: 'not_found',
        type: 'documents_empty',
        message: 'No downloadable documents available for this vehicle',
      });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    for (const doc of documentsWithFiles) {
      const filename = doc.fileUrl.replace('/uploads/', '');
      const filePath = join(process.cwd(), 'uploads', filename);
      archive.file(filePath, { name: filename });
    }

    archive.finalize();
    return { archive, vehicleName: vehicle.nickname || vehicle.model };
  }
}
