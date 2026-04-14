import { IsString, IsNotEmpty, IsDate, IsOptional, IsInt, IsBoolean, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationStatus } from '@prisma/client';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  regNumber: string;

  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @IsString()
  @IsOptional()
  region?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  registrationStartDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  expiryDate: Date;

  @IsInt()
  @IsOptional()
  durationMonths?: number;

  @IsString()
  @IsOptional()
  issuingBody?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsEnum(RegistrationStatus)
  @IsOptional()
  registrationStatus?: RegistrationStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
