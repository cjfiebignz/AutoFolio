import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReminderEngineService, DueReminder } from '../reminder-engine/reminder-engine.service';
import { EmailService } from '../email/email.service';
import { DeliveryChannel, DeliveryStatus } from '@prisma/client';

@Injectable()
export class ReminderDeliveryService {
  private readonly logger = new Logger(ReminderDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reminderEngine: ReminderEngineService,
    private readonly emailService: EmailService,
  ) {}

  async processDueReminders(userId: string) {
    this.logger.log(`Processing due reminders for user: ${userId}`);
    const { reminders } = await this.reminderEngine.getDueReminders(userId);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const isEmailConfigured = this.emailService.isConfigured();
    
    // Structured diagnostic statistics for API response
    const stats = {
      totalEvaluated: reminders.length,
      eligibleCount: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      noEmail: 0,
      noConfig: 0,
      emailMode: 'none' as 'single' | 'digest' | 'none',
      digestCount: 0,
      includedReminderKeys: [],
      skippedReminderKeys: [],
    };
    const details = [];

    if (!user?.email) {
      this.logger.warn(`User ${userId} has no email address. Skipping deliveries.`);
      return { ...stats, noEmail: reminders.length, details: [{ status: 'skipped', reason: 'User missing email' }] };
    }

    const eligibleReminders = [];

    /**
     * DUPLICATE PREVENTION STRATEGY:
     * 1. A unique 'reminderKey' is generated for each specific reminder event (vehicle + type + timing + eventId).
     * 2. We check the 'UserReminderDelivery' table for any existing record with this key and channel.
     * 3. We ONLY skip if the status is 'SENT'. 
     * 4. 'FAILED' or 'SKIPPED' (due to config) records do NOT block future attempts, allowing for retries.
     */
    for (const reminder of reminders) {
      const eventId = reminder.dueDate 
        ? reminder.dueDate.toISOString().split('T')[0] 
        : (reminder.dueOdometer?.toString() || 'no-event');
      
      const reminderKey = `${reminder.vehicleId}-${reminder.type}-${reminder.timing}-${eventId}`;

      const existing = await this.prisma.userReminderDelivery.findFirst({
        where: {
          reminderKey,
          channel: DeliveryChannel.EMAIL,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing && existing.status === DeliveryStatus.SENT) {
        stats.skipped++;
        stats.skippedReminderKeys.push(reminderKey);
        details.push({ 
          key: reminderKey, 
          status: 'skipped_already_sent', 
          reason: 'Already delivered',
          existingStatus: existing.status,
          sentAt: existing.sentAt,
          channel: existing.channel
        });
        continue;
      }

      eligibleReminders.push({ 
        ...reminder, 
        reminderKey, 
        existingStatus: existing?.status || 'none' 
      });
    }

    stats.eligibleCount = eligibleReminders.length;

    if (eligibleReminders.length === 0) {
      return { ...stats, details };
    }

    if (!isEmailConfigured) {
      this.logger.warn(`Email service not configured. Marking ${eligibleReminders.length} reminders as SKIPPED.`);
      stats.noConfig = eligibleReminders.length;
      for (const er of eligibleReminders) {
        stats.skipped++;
        stats.skippedReminderKeys.push(er.reminderKey);
        details.push({ 
          key: er.reminderKey, 
          status: 'skipped_no_config', 
          reason: 'Email provider not configured',
          existingStatus: er.existingStatus
        });
      }
      return { ...stats, details };
    }

    // Determine delivery mode: single email for 1 item, combined digest for 2+
    stats.emailMode = eligibleReminders.length === 1 ? 'single' : 'digest';
    stats.digestCount = eligibleReminders.length;
    stats.includedReminderKeys = eligibleReminders.map(er => er.reminderKey);

    try {
      if (stats.emailMode === 'single') {
        const er = eligibleReminders[0];
        const { vehicleUrl } = await this.emailService.sendReminderEmail(user.email, er);
        
        await this.prisma.userReminderDelivery.create({
          data: {
            userId,
            vehicleId: er.vehicleId,
            reminderKey: er.reminderKey,
            reminderType: er.type,
            channel: DeliveryChannel.EMAIL,
            status: DeliveryStatus.SENT,
            dueDate: er.dueDate,
            dueOdometer: er.dueOdometer,
          },
        });

        stats.sent = 1;
        details.push({ 
          key: er.reminderKey, 
          status: 'sent', 
          vehicleUrl,
          existingStatus: er.existingStatus
        });
      } else {
        // Send combined digest email
        await this.emailService.sendReminderDigestEmail(user.email, eligibleReminders);
        
        // Record individual SENT status for each reminder included in the digest
        for (const er of eligibleReminders) {
          await this.prisma.userReminderDelivery.create({
            data: {
              userId,
              vehicleId: er.vehicleId,
              reminderKey: er.reminderKey,
              reminderType: er.type,
              channel: DeliveryChannel.EMAIL,
              status: DeliveryStatus.SENT,
              dueDate: er.dueDate,
              dueOdometer: er.dueOdometer,
            },
          });
          details.push({ 
            key: er.reminderKey, 
            status: 'sent', 
            existingStatus: er.existingStatus
          });
        }
        stats.sent = eligibleReminders.length;
      }
    } catch (error) {
      this.logger.error(`Failed to deliver reminders in ${stats.emailMode} mode`, error);
      stats.failed = eligibleReminders.length;
      
      for (const er of eligibleReminders) {
        // Record individual FAILED status to allow for future retries
        await this.prisma.userReminderDelivery.create({
          data: {
            userId,
            vehicleId: er.vehicleId,
            reminderKey: er.reminderKey,
            reminderType: er.type,
            channel: DeliveryChannel.EMAIL,
            status: DeliveryStatus.FAILED,
            dueDate: er.dueDate,
            dueOdometer: er.dueOdometer,
          },
        });
        
        details.push({ 
          key: er.reminderKey, 
          status: 'failed', 
          error: error.message,
          existingStatus: er.existingStatus
        });
      }
    }

    return { ...stats, details };
  }

  async resetDeliveries(userId: string, filters: { channel?: DeliveryChannel; vehicleId?: string; reminderType?: string }) {
    this.logger.log(`Resetting delivery records for user: ${userId} with filters: ${JSON.stringify(filters)}`);
    
    const where: any = { userId };
    
    if (filters.channel) where.channel = filters.channel;
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.reminderType) where.reminderType = filters.reminderType;

    const result = await this.prisma.userReminderDelivery.deleteMany({
      where,
    });

    this.logger.log(`Deleted ${result.count} delivery records for user: ${userId}`);
    return { count: result.count };
  }
}
