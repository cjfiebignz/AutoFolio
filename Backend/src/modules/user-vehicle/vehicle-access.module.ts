import { Module } from '@nestjs/common';
import { VehicleAccessService } from './vehicle-access.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VehicleAccessService],
  exports: [VehicleAccessService],
})
export class VehicleAccessModule {}
