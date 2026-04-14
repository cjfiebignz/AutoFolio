import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportSpecRowDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  unit?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class CommitImportDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSpecRowDto)
  rows: ImportSpecRowDto[];

  @IsString()
  @IsNotEmpty()
  fileName: string;
}
