import { IsString, IsOptional, IsNotEmpty, IsInt, Min, Max, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserVehicleDto {
  @IsBoolean()
  @IsOptional()
  isDaily?: boolean;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  specId?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  year?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentOdometer?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  serviceIntervalKms?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  serviceIntervalMonths?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  serviceSettingsBaseDate?: Date;

  @IsInt()
  @Min(0)
  @IsOptional()
  serviceSettingsBaseKms?: number;
}
