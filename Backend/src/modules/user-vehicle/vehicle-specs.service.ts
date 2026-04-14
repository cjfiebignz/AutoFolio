import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { CustomSpecGroup } from './dto/create-custom-spec.dto';
import { ImportSpecRowDto } from './dto/import-specs.dto';
import { UserVehicleService } from './user-vehicle.service';

@Injectable()
export class VehicleSpecsService {
  constructor(
    private prisma: PrismaService,
    private userVehicleService: UserVehicleService,
  ) {}

  private allowedCategories = Object.values(CustomSpecGroup);

  async getTemplate() {
    return 'category,label,value,unit,notes\n';
  }

  async getExample() {
    return [
      'category,label,value,unit,notes',
      'Engine,Engine Code,2JZ-GTE,,Twin-turbo inline-6',
      'Engine,Displacement,2997,cc,',
      'Fluids,Engine Oil,5.5,L,Synthetic 5W-30',
      'Dimensions,Wheelbase,2550,mm,',
      'Torque,Wheel Nuts,103,Nm,',
    ].join('\n') + '\n';
  }

  async previewImport(vehicleId: string, fileBuffer: Buffer, fileName: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: { user: { select: { plan: true } } },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const limits = this.userVehicleService.getPlanLimits(vehicle.user.plan);
    if (!limits.canImportSpecCsv) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'import_csv',
        message: 'CSV specification import is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    if (!fileBuffer) {
      throw new BadRequestException('File buffer is empty');
    }

    const csvContent = fileBuffer.toString('utf8');
    if (!csvContent || csvContent.trim().length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    let records: any[];

    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err) {
      throw new BadRequestException('Invalid CSV format: ' + err.message);
    }

    if (!records || records.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    const requiredHeaders = ['category', 'label', 'value'];
    const headers = Object.keys(records[0]);
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`);
    }

    const validRows = [];
    const invalidRows = [];
    const duplicates = [];

    // Fetch existing specs to detect duplicates
    const existingSpecs = await this.prisma.userVehicleCustomSpec.findMany({
      where: { vehicleId },
      select: { group: true, label: true },
    });

    const existingKeys = new Set(existingSpecs.map(s => `${s.group.toLowerCase()}|${s.label.toLowerCase()}`));

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +1 for 0-indexing, +1 for header row
      const errors = [];
      const rowWarnings = [];

      // Normalization
      const category = row.category?.trim();
      const label = row.label?.trim();
      const value = row.value?.trim();
      let unit = row.unit?.trim() || null;
      const notes = row.notes?.trim() || null;

      if (unit) {
        const commonUnits = ['cc', 'l', 'mm', 'nm', 'kg', 'psi', 'bar'];
        if (commonUnits.includes(unit.toLowerCase())) {
          unit = unit.toLowerCase();
        }
      }

      // Validation
      let normalizedCategory = category;
      if (!category) {
        errors.push('Category is required');
      } else {
        const matchedCategory = this.allowedCategories.find(
          c => c.toLowerCase() === category.toLowerCase()
        );
        if (!matchedCategory) {
          errors.push(`Invalid category: "${category}". Allowed values: ${this.allowedCategories.join(', ')}`);
        } else {
          normalizedCategory = matchedCategory; // Normalize to exact enum value
        }
      }

      if (!label) errors.push('Label is required');
      if (!value) errors.push('Value is required');

      const isDuplicate = !!(normalizedCategory && label && existingKeys.has(`${normalizedCategory.toLowerCase()}|${label.toLowerCase()}`));

      const parsedData = {
        category: normalizedCategory || category,
        label: label || '',
        value: value || '',
        unit,
        notes,
      };

      const resultRow = {
        rowNumber,
        parsedData,
        errors,
        warnings: rowWarnings,
        isDuplicate,
      };

      if (errors.length > 0) {
        invalidRows.push(resultRow);
      } else {
        if (isDuplicate) {
          duplicates.push(resultRow);
        }
        validRows.push(resultRow);
      }
    }

    return {
      validRows,
      invalidRows,
      duplicates,
      totalRows: records.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      fileName,
    };
  }

  async commitImport(vehicleId: string, rows: ImportSpecRowDto[], fileName: string) {
    const vehicle = await this.prisma.userVehicle.findUnique({
      where: { id: vehicleId },
      include: { user: { select: { plan: true } } },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const limits = this.userVehicleService.getPlanLimits(vehicle.user.plan);
    if (!limits.canImportSpecCsv) {
      throw new BadRequestException({
        error: 'feature_restricted',
        type: 'import_csv',
        message: 'CSV specification import is available on Pro',
        plan: vehicle.user.plan || 'free',
      });
    }

    // Re-verify duplicates just in case
    const existingSpecs = await this.prisma.userVehicleCustomSpec.findMany({
      where: { vehicleId },
      select: { group: true, label: true },
    });

    const existingKeys = new Set(existingSpecs.map(s => `${s.group.toLowerCase()}|${s.label.toLowerCase()}`));

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1; // This is different from preview rowNumber if we only send valid ones

      try {
        const key = `${row.category.toLowerCase()}|${row.label.toLowerCase()}`;
        if (existingKeys.has(key)) {
          skippedCount++;
          continue;
        }

        await this.prisma.userVehicleCustomSpec.create({
          data: {
            vehicleId,
            group: row.category,
            label: row.label,
            value: row.value,
            unit: row.unit,
            notes: row.notes,
          },
        });
        importedCount++;
        existingKeys.add(key); // Prevent duplicates within the same batch
      } catch (err) {
        failedCount++;
        errors.push({ rowNumber, reason: err.message });
      }
    }

    // Track ImportBatch
    await this.prisma.importBatch.create({
      data: {
        vehicleId,
        fileName,
        totalRows: rows.length,
        importedCount,
        skippedCount,
        failedCount,
      },
    });

    return {
      success: true,
      importedCount,
      skippedCount,
      failedCount,
      errors,
    };
  }
}
