import { Module } from '@nestjs/common';
import { ReminderDeliveryService } from './reminder-delivery.service';
import { ReminderDeliveryController } from './reminder-delivery.controller';
import { ReminderEngineModule } from '../reminder-engine/reminder-engine.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ReminderEngineModule, EmailModule],
  controllers: [ReminderDeliveryController],
  providers: [ReminderDeliveryService],
  exports: [ReminderDeliveryService],
})
export class ReminderDeliveryModule {}
