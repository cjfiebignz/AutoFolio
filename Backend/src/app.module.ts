import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UserVehicleModule } from './modules/user-vehicle/user-vehicle.module';
import { PartsModule } from './modules/parts/parts.module';

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
    PartsModule
  ],
})
export class AppModule {}
