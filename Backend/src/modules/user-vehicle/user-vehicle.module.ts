import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UserVehicleService } from './user-vehicle.service';
import { UserVehicleController } from './user-vehicle.controller';
import { UserController } from './user.controller';
import { PublicReportController } from './public-report.controller';
import { VehicleSpecsController } from './vehicle-specs.controller';
import { VehicleSpecsService } from './vehicle-specs.service';
import { SpecHubClientService } from './spec-hub-client.service';
import { VehicleAccessModule } from './vehicle-access.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    VehicleAccessModule,
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [
    UserVehicleController, 
    UserController, 
    PublicReportController,
    VehicleSpecsController
  ],
  providers: [
    UserVehicleService, 
    VehicleSpecsService,
    SpecHubClientService
  ],
})
export class UserVehicleModule {}
