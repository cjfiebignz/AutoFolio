import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBannerMetadataDto {
  @IsNumber()
  @Min(0)
  @Max(100) // Allow up to 100 for legacy support, will be normalized in service
  @IsOptional()
  @Type(() => Number)
  bannerCropX?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  bannerCropY?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  bannerZoom?: number;
}
