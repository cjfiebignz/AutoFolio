import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Header,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VehicleSpecsService } from './vehicle-specs.service';
import { CommitImportDto } from './dto/import-specs.dto';

@Controller('vehicle-specs')
export class VehicleSpecsController {
  constructor(private readonly vehicleSpecsService: VehicleSpecsService) {}

  @Get('import/template')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="specs-template.csv"')
  async getTemplate() {
    return this.vehicleSpecsService.getTemplate();
  }

  @Get('import/example')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="specs-example.csv"')
  async getExample() {
    return this.vehicleSpecsService.getExample();
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async previewImport(
    @Query('vehicleId') vehicleId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!vehicleId) {
      throw new BadRequestException('Vehicle ID is required');
    }
    
    return this.vehicleSpecsService.previewImport(
      vehicleId,
      file.buffer,
      file.originalname,
    );
  }

  @Post('import/commit')
  async commitImport(@Body() dto: CommitImportDto) {
    return this.vehicleSpecsService.commitImport(
      dto.vehicleId,
      dto.rows,
      dto.fileName,
    );
  }
}
