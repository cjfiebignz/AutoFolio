import { IsString, IsNotEmpty, IsDate, IsOptional, IsBoolean, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InsuranceStatus } from '@prisma/client';

export class CreateInsuranceDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsString()
  @IsNotEmpty()
  policyType: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  policyStartDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  expiryDate: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  premiumAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  paymentFrequency: string;

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
