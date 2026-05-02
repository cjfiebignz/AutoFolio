import { Controller, Post, Delete, Param, Query } from '@nestjs/common';
import { ReminderDeliveryService } from './reminder-delivery.service';
import { DeliveryChannel } from '@prisma/client';

@Controller('users/:userId/reminders')
export class ReminderDeliveryController {
  constructor(private readonly service: ReminderDeliveryService) {}

  @Post('send-due-emails')
  async sendDueEmails(@Param('userId') userId: string) {
    return this.service.processDueReminders(userId);
  }

  @Delete('deliveries')
  async resetDeliveries(
    @Param('userId') userId: string,
    @Query('channel') channel?: DeliveryChannel,
    @Query('vehicleId') vehicleId?: string,
    @Query('reminderType') reminderType?: string,
  ) {
    return this.service.resetDeliveries(userId, { channel, vehicleId, reminderType });
  }
}
