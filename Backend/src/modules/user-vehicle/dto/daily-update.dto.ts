import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean, IsUUID, IsIn } from 'class-validator';

export class DailyUpdateDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsNumber()
  @IsOptional()
  odometerKms?: number;

  @IsBoolean()
  @IsOptional()
  noChange?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['odometer', 'no_change'], { message: 'Invalid check-in mode.' })
  mode?: string;
}
