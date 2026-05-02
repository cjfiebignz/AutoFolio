import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * DEV MODE ONLY: This service manages developer tools for testing.
 * It is not intended for production environments.
 */
@Injectable()
export class DevService {
  private readonly logger = new Logger(DevService.name);
  private overrideNow: Date | null = null;

  /**
   * Returns the current application time. 
   * Returns the overridden time if active, otherwise the real system time.
   */
  getNow(): Date {
    return this.overrideNow ?? new Date();
  }

  getOverrideState() {
    return {
      realNow: new Date().toISOString(),
      effectiveNow: this.getNow().toISOString(),
      overrideActive: !!this.overrideNow,
      overrideNow: this.overrideNow ? this.overrideNow.toISOString() : null,
    };
  }

  setOverride(input: string | Date) {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date provided');
    }
    this.overrideNow = date;
    this.logger.warn(`Dev Time Override ACTIVE: ${this.overrideNow.toISOString()}`);
  }

  advanceOverride(hours: number) {
    const current = this.getNow();
    const advanced = new Date(current.getTime() + hours * 60 * 60 * 1000);
    this.setOverride(advanced);
  }

  clearOverride() {
    this.overrideNow = null;
    this.logger.log('Dev Time Override cleared. Returning to real system time.');
  }
}
