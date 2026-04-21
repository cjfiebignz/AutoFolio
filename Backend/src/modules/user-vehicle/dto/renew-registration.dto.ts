import { IsDate, IsNotEmpty, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RenewRegistrationDto {
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  expiryDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  registrationStartDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
