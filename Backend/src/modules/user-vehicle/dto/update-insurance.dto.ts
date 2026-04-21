import { IsString, IsDate, IsOptional, IsBoolean, IsNumber, Min, IsEnum, Allow } from 'class-validator';
import { Type } from 'class-transformer';
import { InsuranceStatus } from '@prisma/client';

export class UpdateInsuranceDto {
  @Allow()
  @IsBoolean()
  @IsOptional()
  renew?: boolean;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsString()
  @IsOptional()
  policyType?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  policyStartDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  premiumAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  paymentFrequency?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsEnum(InsuranceStatus)
  @IsOptional()
  insuranceStatus?: InsuranceStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
