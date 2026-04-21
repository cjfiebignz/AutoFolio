import { IsString, IsDate, IsOptional, IsInt, IsBoolean, IsNumber, Min, IsEnum, Allow } from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationStatus } from '@prisma/client';

export class UpdateRegistrationDto {
  @Allow()
  @IsBoolean()
  @IsOptional()
  renew?: boolean;

  @IsString()
  @IsOptional()
  regNumber?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  registrationStartDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

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
