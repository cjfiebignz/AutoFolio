import { IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReminderType, ReminderTiming } from '@prisma/client';

export class UpdateReminderPreferenceDto {
  @IsEnum(ReminderType)
  type: ReminderType;

  @IsEnum(ReminderTiming)
  timing: ReminderTiming;

  @IsBoolean()
  enabled: boolean;
}

export class BulkUpdateReminderPreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateReminderPreferenceDto)
  preferences: UpdateReminderPreferenceDto[];
}
