import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UserVehicleService } from './user-vehicle.service';

@Controller('public')
export class PublicReportController {
  constructor(private readonly userVehicleService: UserVehicleService) {}

  @Get('vehicle-report/:token')
  async getPublicReport(@Param('token') token: string) {
    return this.userVehicleService.getPublicReport(token);
  }
}
