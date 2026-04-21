import { IsDate, IsNotEmpty, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RenewInsuranceDto {
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  expiryDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  policyStartDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  premiumAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
