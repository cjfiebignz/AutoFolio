import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum ServiceType {
  WORKSHOP = 'workshop',
  DIY = 'diy',
}

export class CreateServiceEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  eventDate: Date;

  @IsNumber()
  @IsOptional()
  odometerAtEvent?: number;

  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

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
