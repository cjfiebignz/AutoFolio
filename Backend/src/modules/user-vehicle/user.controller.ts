import { Controller, Get, Body, Param, Patch, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserVehicleService } from './user-vehicle.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userVehicleService: UserVehicleService) {}

  @Get(':userId/preferences')
  async getUserPreferences(@Param('userId') userId: string) {
    return this.userVehicleService.getUserPreferences(userId);
  }

  @Patch(':userId/preferences')
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body() body: any
  ) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body must be a valid JSON object');
    }

    // Explicitly extract and cast to avoid positional argument shifts
    const currency = typeof body.defaultCurrency === 'string' ? body.defaultCurrency : undefined;
    const system = typeof body.measurementSystem === 'string' ? body.measurementSystem : undefined;
    const plan = (body.plan === 'free' || body.plan === 'pro') ? body.plan : undefined;

    return this.userVehicleService.updateUserPreferences(userId, currency, plan, system);
  }
}
