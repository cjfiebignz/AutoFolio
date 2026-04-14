import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehicleAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validates vehicle ownership and checks if the vehicle is locked due to plan limits.
   * Throws NotFoundException if vehicle doesn't exist.
   * Throws BadRequestException if vehicle is locked.
   */
  async ensureVehicleNotLocked(vehicleId: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: { user: { select: { plan: true } } },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    if (vehicle.user.plan === 'pro') {
      return vehicle;
    }

    // On Free plan, only the oldest active vehicle is unlocked.
    const activeVehicles = await this.prisma.userVehicle.findMany({
      where: { userId: vehicle.userId, status: 'active' },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' }
      ],
      select: { id: true },
    });

    if (activeVehicles.length <= 1) {
      return vehicle;
    }

    const unlockedId = activeVehicles[0].id;
    if (vehicleId !== unlockedId) {
      throw new BadRequestException('This vehicle is locked under your current plan. Please upgrade to Pro to access.');
    }

    return vehicle;
  }
}
