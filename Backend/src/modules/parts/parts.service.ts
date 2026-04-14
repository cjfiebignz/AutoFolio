import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { GenerateShoppingListDto } from './dto/shopping-list.dto';
import { VehicleAccessService } from '../user-vehicle/vehicle-access.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private vehicleAccess: VehicleAccessService,
  ) {}

  // --- SAVED PARTS ---

  async createPart(vehicleId: string, dto: CreatePartDto) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    return this.prisma.savedPart.create({
      data: {
        ...dto,
        vehicleId,
      },
    });
  }

  async findAllParts(vehicleId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    return this.prisma.savedPart.findMany({
      where: { vehicleId },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
        { id: 'asc' }
      ],
    });
  }

  async findOnePart(vehicleId: string, partId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    const part = await this.prisma.savedPart.findFirst({
      where: { id: partId, vehicleId },
    });
    if (!part) {
      throw new NotFoundException(`Part with ID ${partId} not found for this vehicle`);
    }
    return part;
  }

  async updatePart(vehicleId: string, partId: string, dto: UpdatePartDto) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    const part = await this.findOnePart(vehicleId, partId);
    return this.prisma.savedPart.update({
      where: { id: part.id },
      data: dto,
    });
  }

  async removePart(vehicleId: string, partId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    const part = await this.findOnePart(vehicleId, partId);
    return this.prisma.savedPart.delete({
      where: { id: part.id },
    });
  }

  // --- PART PRESETS ---

  async createPreset(vehicleId: string, dto: CreatePresetDto) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    
    // Validate that all partIds exist and belong to the same vehicle
    const partIds = dto.items.map(item => item.savedPartId);
    const partsCount = await this.prisma.savedPart.count({
      where: {
        id: { in: partIds },
        vehicleId,
      },
    });

    if (partsCount !== new Set(partIds).size) {
      throw new BadRequestException('One or more parts are invalid or do not belong to this vehicle');
    }

    const { items, ...presetData } = dto;
    return this.prisma.partPreset.create({
      data: {
        ...presetData,
        vehicleId,
        items: {
          create: items.map(item => ({
            savedPartId: item.savedPartId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            savedPart: true,
          },
          orderBy: { savedPart: { name: 'asc' } }
        },
      },
    });
  }

  async findAllPresets(vehicleId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    return this.prisma.partPreset.findMany({
      where: { vehicleId },
      include: {
        items: {
          include: {
            savedPart: true,
          },
          orderBy: { savedPart: { name: 'asc' } }
        },
      },
      orderBy: [
        { name: 'asc' },
        { id: 'asc' }
      ],
    });
  }

  async findOnePreset(vehicleId: string, presetId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    const preset = await this.prisma.partPreset.findFirst({
      where: { id: presetId, vehicleId },
      include: {
        items: {
          include: {
            savedPart: true,
          },
          orderBy: { savedPart: { name: 'asc' } }
        },
      },
    });
    if (!preset) {
      throw new NotFoundException(`Preset with ID ${presetId} not found for this vehicle`);
    }
    return preset;
  }

  async updatePreset(vehicleId: string, presetId: string, dto: UpdatePresetDto) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    const preset = await this.findOnePreset(vehicleId, presetId);
    const { items, ...presetData } = dto;

    if (items) {
      // Validate partIds if they are being updated
      const partIds = items.map(item => item.savedPartId);
      const partsCount = await this.prisma.savedPart.count({
        where: {
          id: { in: partIds },
          vehicleId,
        },
      });

      if (partsCount !== new Set(partIds).size) {
        throw new BadRequestException('One or more parts are invalid or do not belong to this vehicle');
      }
    }

    return this.prisma.partPreset.update({
      where: { id: preset.id },
      data: {
        ...presetData,
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map(item => ({
              savedPartId: item.savedPartId,
              quantity: item.quantity,
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            savedPart: true,
          },
          orderBy: { savedPart: { name: 'asc' } }
        },
      },
    });
  }

  async removePreset(vehicleId: string, presetId: string) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    const preset = await this.findOnePreset(vehicleId, presetId);
    return this.prisma.partPreset.delete({
      where: { id: preset.id },
    });
  }

  // --- SHOPPING LIST ---

  async generateShoppingList(vehicleId: string, dto: GenerateShoppingListDto) {
    await this.vehicleAccess.ensureVehicleNotLocked(vehicleId);
    
    const partIds = dto.items.map(item => item.savedPartId);
    const parts = await this.prisma.savedPart.findMany({
      where: {
        id: { in: partIds },
        vehicleId,
      },
    });

    const items = dto.items.map(listItem => {
      const part = parts.find(p => p.id === listItem.savedPartId);
      if (!part) return null;

      const unitPrice = part.lastPrice ? Number(part.lastPrice) : null;
      const estimatedCost = unitPrice !== null ? unitPrice * listItem.quantity : null;

      return {
        partId: part.id,
        name: part.name,
        partNumber: part.partNumber,
        brand: part.preferredBrand,
        supplier: part.supplier,
        purchaseUrl: part.purchaseUrl,
        lastPrice: unitPrice,
        quantity: listItem.quantity,
        notes: part.notes,
        estimatedCost: estimatedCost,
      };
    }).filter(item => item !== null);

    const totalEstimatedCost = items.reduce((sum, item) => {
      return sum + (item.estimatedCost || 0);
    }, 0);

    const hasIncompletePricing = items.some(item => item.estimatedCost === null);

    return {
      vehicleId,
      generatedAt: new Date(),
      items,
      totalEstimatedCost: totalEstimatedCost || null,
      hasIncompletePricing,
    };
  }

  async exportShoppingListPdf(vehicleId: string, dto: GenerateShoppingListDto) {
    const shoppingList = await this.generateShoppingList(vehicleId, dto);
    
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: {
        user: { select: { defaultCurrency: true } }
      }
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const currency = vehicle.user?.defaultCurrency || 'AUD';
    const moneyFormatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
    });

    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('AutoFolio', { align: 'left' });
    doc.fontSize(24).text('Shopping List');
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown(1);

    // Vehicle Info
    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Summary');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    if (vehicle.nickname) doc.font('Helvetica').text(`Nickname: ${vehicle.nickname}`);
    doc.moveDown(2);

    // Items Table Header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Qty', 50, tableTop);
    doc.text('Part Name / Details', 100, tableTop);
    doc.text('Estimated Cost', 450, tableTop, { align: 'right', width: 100 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveDown(0.5);

    // Items
    shoppingList.items.forEach(item => {
      const currentY = doc.y;
      
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
      }

      doc.fontSize(10).font('Helvetica');
      doc.text(item.quantity.toString(), 50, doc.y, { width: 40 });
      
      const detailsX = 100;
      const detailsWidth = 340;
      doc.font('Helvetica-Bold').text(item.name, detailsX, doc.y, { width: detailsWidth });
      
      doc.font('Helvetica').fontSize(9);
      const subDetails = [];
      if (item.partNumber) subDetails.push(`P/N: ${item.partNumber}`);
      if (item.brand) subDetails.push(`Brand: ${item.brand}`);
      if (item.supplier) subDetails.push(`Supplier: ${item.supplier}`);
      
      if (subDetails.length > 0) {
        doc.text(subDetails.join(' | '), detailsX, doc.y, { width: detailsWidth });
      }
      
      if (item.notes) {
        doc.fillColor('#666666').text(`Note: ${item.notes}`, detailsX, doc.y, { width: detailsWidth });
        doc.fillColor('#000000');
      }

      const lineCost = item.estimatedCost !== null 
        ? moneyFormatter.format(item.estimatedCost) 
        : 'Price N/A';
      
      doc.fontSize(10).text(lineCost, 450, currentY, { align: 'right', width: 100 });
      
      doc.moveDown(0.8);
    });

    // Totals
    doc.moveDown(1);
    doc.moveTo(400, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica-Bold');
    const totalText = shoppingList.totalEstimatedCost !== null 
      ? moneyFormatter.format(shoppingList.totalEstimatedCost) 
      : 'N/A';
    doc.text(`Total Estimated: ${totalText}`, 350, doc.y, { align: 'right', width: 200 });

    if (shoppingList.hasIncompletePricing) {
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#cc0000');
      doc.text('* Some items are missing pricing data. Total is incomplete.', 350, doc.y, { align: 'right', width: 200 });
    }

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').fillColor('#999999').text(
        `Generated by AutoFolio  |  Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    doc.end();
    return doc;
  }
}
