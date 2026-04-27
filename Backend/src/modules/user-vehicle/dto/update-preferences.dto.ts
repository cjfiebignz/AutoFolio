import { IsString, IsOptional, Length, IsEnum } from 'class-validator';
import { AccountPlan } from '@prisma/client';

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  @Length(3, 3, { message: 'Currency code must be exactly 3 characters.' })
  defaultCurrency?: string;

  @IsString()
  @IsOptional()
  measurementSystem?: string;

  @IsString()
  @IsOptional()
  appearance?: string;

  @IsEnum(AccountPlan)
  @IsOptional()
  plan?: AccountPlan;
}
