import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum CustomSpecGroup {
  ENGINE = 'Engine',
  OIL_FLUIDS = 'Oil & Fluids',
  TRANSMISSION = 'Transmission',
  FUEL = 'Fuel',
  COOLING = 'Cooling',
  TORQUE = 'Torque',
  WHEELS_TYRES = 'Wheels & Tyres',
  SUSPENSION = 'Suspension',
  BRAKES = 'Brakes',
  ELECTRICAL = 'Electrical',
  DIMENSIONS = 'Dimensions',
  GENERAL = 'General',
}

export class CreateCustomSpecDto {
  @IsEnum(CustomSpecGroup)
  @IsNotEmpty()
  group: CustomSpecGroup;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
