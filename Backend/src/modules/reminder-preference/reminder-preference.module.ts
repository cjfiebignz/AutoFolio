import { Module } from '@nestjs/common';
import { ReminderPreferenceController } from './reminder-preference.controller';
import { ReminderPreferenceService } from './reminder-preference.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReminderPreferenceController],
  providers: [ReminderPreferenceService],
  exports: [ReminderPreferenceService],
})
export class ReminderPreferenceModule {}
