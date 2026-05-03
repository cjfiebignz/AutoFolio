import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevGuard implements CanActivate {
  private readonly logger = new Logger(DevGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const devToken = request.headers['x-dev-token'];
    const devPassword = this.configService.get<string>('DEV_MODE_PASSWORD');

    if (!devPassword) {
      this.logger.error('DEV_MODE_PASSWORD is not configured in backend environment.');
      throw new UnauthorizedException('Dev mode is not enabled on this server.');
    }

    if (!devToken || devToken !== devPassword) {
      this.logger.warn(`Unauthorized dev access attempt from IP: ${request.ip}`);
      throw new UnauthorizedException('Invalid or missing developer access token.');
    }

    return true;
  }
}
