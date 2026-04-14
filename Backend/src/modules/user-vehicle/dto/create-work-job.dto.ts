import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkJobStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

export enum WorkJobPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateWorkJobPartDto {
  @IsString()
  @IsNotEmpty()
  savedPartId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPriceSnapshot?: number;

  @IsNumber()
  @IsOptional()
  lineTotalSnapshot?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateWorkJobSpecDto {
  @IsString()
  @IsNotEmpty()
  customSpecId: string;
}

export class CreateWorkJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(WorkJobStatus)
  @IsNotEmpty()
  status: WorkJobStatus;

  @IsEnum(WorkJobPriority)
  @IsOptional()
  priority?: WorkJobPriority;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  estimate?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkJobPartDto)
  parts?: CreateWorkJobPartDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkJobSpecDto)
  specs?: CreateWorkJobSpecDto[];
}
