import { Module } from '@nestjs/common';
import { ReminderEngineController } from './reminder-engine.controller';
import { ReminderEngineService } from './reminder-engine.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevModule } from '../dev/dev.module';

@Module({
  imports: [PrismaModule, DevModule],
  controllers: [ReminderEngineController],
  providers: [ReminderEngineService],
  exports: [ReminderEngineService],
})
export class ReminderEngineModule {}
