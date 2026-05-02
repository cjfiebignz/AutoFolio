import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UserVehicleModule } from './modules/user-vehicle/user-vehicle.module';
import { PartsModule } from './modules/parts/parts.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { DevModule } from './modules/dev/dev.module';
import { ReminderPreferenceModule } from './modules/reminder-preference/reminder-preference.module';
import { ReminderEngineModule } from './modules/reminder-engine/reminder-engine.module';
import { ReminderDeliveryModule } from './modules/reminder-delivery/reminder-delivery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available globally
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule, 
    UserVehicleModule,
    PartsModule,
    AuthModule,
    EmailModule,
    StorageModule,
    DevModule,
    ReminderPreferenceModule,
    ReminderEngineModule,
    ReminderDeliveryModule
  ],
})
export class AppModule {}
