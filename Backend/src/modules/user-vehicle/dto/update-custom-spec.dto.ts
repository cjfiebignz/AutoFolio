import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomSpecDto } from './create-custom-spec.dto';

// Since we don't have @nestjs/mapped-types installed (based on previous turns), 
// I will manually define it to keep it safe.
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CustomSpecGroup } from './create-custom-spec.dto';

export class UpdateCustomSpecDto {
  @IsEnum(CustomSpecGroup)
  @IsOptional()
  group?: CustomSpecGroup;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
