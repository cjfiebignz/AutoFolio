import { IsString, IsDate, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkJobStatus, WorkJobPriority, CreateWorkJobPartDto, CreateWorkJobSpecDto } from './create-work-job.dto';

export class UpdateWorkJobDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(WorkJobStatus)
  @IsOptional()
  status?: WorkJobStatus;

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
