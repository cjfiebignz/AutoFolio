import { Controller, Get, Param } from '@nestjs/common';
import { ReminderEngineService } from './reminder-engine.service';

@Controller('users/:userId/reminders/due')
export class ReminderEngineController {
  constructor(private readonly service: ReminderEngineService) {}

  @Get()
  async getDueReminders(@Param('userId') userId: string) {
    return this.service.getDueReminders(userId);
  }
}
