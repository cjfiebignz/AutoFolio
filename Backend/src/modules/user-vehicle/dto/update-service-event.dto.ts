import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from './create-service-event.dto';

export class UpdateServiceEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  eventDate?: Date;

  @IsNumber()
  @IsOptional()
  odometerAtEvent?: number;

  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;

  @IsBoolean()
  @IsOptional()
  isMainService?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  totalCost?: number;
}
