import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateUserVehicleDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  specId?: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  nickname?: string;
}
