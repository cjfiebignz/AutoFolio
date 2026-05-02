import { Controller, Get, Body, Param, Patch } from '@nestjs/common';
import { ReminderPreferenceService } from './reminder-preference.service';
import { UpdateReminderPreferenceDto, BulkUpdateReminderPreferencesDto } from './dto/update-reminder-preference.dto';

@Controller('users/:userId/reminder-preferences')
export class ReminderPreferenceController {
  constructor(private readonly service: ReminderPreferenceService) {}

  @Get()
  getPreferences(@Param('userId') userId: string) {
    return this.service.getPreferences(userId);
  }

  @Patch()
  updatePreference(
    @Param('userId') userId: string,
    @Body() dto: UpdateReminderPreferenceDto | BulkUpdateReminderPreferencesDto,
  ) {
    if ('preferences' in dto) {
      return this.service.updatePreferences(userId, dto.preferences);
    }
    return this.service.updatePreference(userId, dto);
  }
}
