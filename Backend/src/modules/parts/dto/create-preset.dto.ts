import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class PresetItemDto {
  @IsString()
  @IsNotEmpty()
  savedPartId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePresetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Preset must contain at least one part' })
  @ValidateNested({ each: true })
  @Type(() => PresetItemDto)
  items: PresetItemDto[];
}
