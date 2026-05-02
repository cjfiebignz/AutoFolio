import { Module, Global } from '@nestjs/common';
import { DevService } from './dev.service';
import { DevController } from './dev.controller';

@Global()
@Module({
  providers: [DevService],
  controllers: [DevController],
  exports: [DevService],
})
export class DevModule {}
