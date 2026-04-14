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

  // ... (existing endpoints)

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
