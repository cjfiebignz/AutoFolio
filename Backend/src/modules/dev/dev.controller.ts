import { Controller, Post, Get, Patch, Delete, Body, UnauthorizedException, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevService } from './dev.service';

@Controller('dev')
export class DevController {
  constructor(
    private readonly devService: DevService,
    private readonly configService: ConfigService,
  ) {}

  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  async unlock(@Body('password') password?: string) {
    const devPassword = this.configService.get<string>('DEV_MODE_PASSWORD');
    
    if (!devPassword) {
      throw new BadRequestException('Dev mode is not configured. Add DEV_MODE_PASSWORD to Backend/.env');
    }

    if (password !== devPassword) {
      throw new UnauthorizedException('Invalid dev mode password.');
    }

    return { devModeEnabled: true };
  }

  @Get('time')
  async getTime() {
    return this.devService.getOverrideState();
  }

  @Patch('time')
  async setTime(@Body('overrideNow') overrideNow: string) {
    if (!overrideNow) throw new BadRequestException('overrideNow (ISO string) is required');
    const date = new Date(overrideNow);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid ISO string date');
    
    this.devService.setOverride(date);
    return this.devService.getOverrideState();
  }

  @Post('time/advance')
  @HttpCode(HttpStatus.OK)
  async advanceTime(@Body('hours') hours: number) {
    if (typeof hours !== 'number') throw new BadRequestException('hours must be a number');
    
    this.devService.advanceOverride(hours);
    return this.devService.getOverrideState();
  }

  @Delete('time')
  async clearTime() {
    this.devService.clearOverride();
    return this.devService.getOverrideState();
  }
}
