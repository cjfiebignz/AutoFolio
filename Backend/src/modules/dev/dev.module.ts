import { Module, Global } from '@nestjs/common';
import { DevService } from './dev.service';
import { DevController } from './dev.controller';
import { DevGuard } from './guards/dev.guard';

@Global()
@Module({
  providers: [DevService, DevGuard],
  controllers: [DevController],
  exports: [DevService, DevGuard],
})
export class DevModule {}
