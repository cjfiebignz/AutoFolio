import { Controller, Get, Post, Body, Param, Patch, Delete, Res } from '@nestjs/common';
import { Response } from 'express';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { GenerateShoppingListDto } from './dto/shopping-list.dto';

@Controller('user-vehicles/:vehicleId/parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  // --- SAVED PARTS ---

  @Post()
  async createPart(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreatePartDto,
  ) {
    return this.partsService.createPart(vehicleId, dto);
  }

  @Get()
  async findAllParts(@Param('vehicleId') vehicleId: string) {
    return this.partsService.findAllParts(vehicleId);
  }

  @Get(':partId')
  async findOnePart(
    @Param('vehicleId') vehicleId: string,
    @Param('partId') partId: string,
  ) {
    return this.partsService.findOnePart(vehicleId, partId);
  }

  @Patch(':partId')
  async updatePart(
    @Param('vehicleId') vehicleId: string,
    @Param('partId') partId: string,
    @Body() dto: UpdatePartDto,
  ) {
    return this.partsService.updatePart(vehicleId, partId, dto);
  }

  @Delete(':partId')
  async removePart(
    @Param('vehicleId') vehicleId: string,
    @Param('partId') partId: string,
  ) {
    return this.partsService.removePart(vehicleId, partId);
  }

  // --- PART PRESETS ---

  @Post('presets')
  async createPreset(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreatePresetDto,
  ) {
    return this.partsService.createPreset(vehicleId, dto);
  }

  @Get('presets')
  async findAllPresets(@Param('vehicleId') vehicleId: string) {
    return this.partsService.findAllPresets(vehicleId);
  }

  @Get('presets/:presetId')
  async findOnePreset(
    @Param('vehicleId') vehicleId: string,
    @Param('presetId') presetId: string,
  ) {
    return this.partsService.findOnePreset(vehicleId, presetId);
  }

  @Patch('presets/:presetId')
  async updatePreset(
    @Param('vehicleId') vehicleId: string,
    @Param('presetId') presetId: string,
    @Body() dto: UpdatePresetDto,
  ) {
    return this.partsService.updatePreset(vehicleId, presetId, dto);
  }

  @Delete('presets/:presetId')
  async removePreset(
    @Param('vehicleId') vehicleId: string,
    @Param('presetId') presetId: string,
  ) {
    return this.partsService.removePreset(vehicleId, presetId);
  }

  // --- SHOPPING LIST ---

  @Post('shopping-list')
  async generateShoppingList(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: GenerateShoppingListDto,
  ) {
    return this.partsService.generateShoppingList(vehicleId, dto);
  }

  @Post('shopping-list/export')
  async exportShoppingListPdf(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: GenerateShoppingListDto,
    @Res() res: Response,
  ) {
    const doc = await this.partsService.exportShoppingListPdf(vehicleId, dto);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shopping-list.pdf"`);

    doc.pipe(res);
  }
}
