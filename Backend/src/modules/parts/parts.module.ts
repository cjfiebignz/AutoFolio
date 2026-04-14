import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { VehicleAccessModule } from '../user-vehicle/vehicle-access.module';

@Module({
  imports: [PrismaModule, VehicleAccessModule],
  controllers: [PartsController],
  providers: [PartsService],
  exports: [PartsService],
})
export class PartsModule {}
