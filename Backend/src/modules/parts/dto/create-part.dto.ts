import { IsString, IsOptional, IsUrl, IsNumber, IsInt, Min, IsDateString, IsNotEmpty } from 'class-validator';

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  partNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  preferredBrand?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsUrl({}, { message: 'Please enter a valid URL' })
  @IsOptional()
  purchaseUrl?: string;

  @IsNumber()
  @IsOptional()
  lastPrice?: number;

  @IsDateString()
  @IsOptional()
  lastPurchaseDate?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  defaultQuantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
