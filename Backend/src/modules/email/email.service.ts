import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromEmail = this.configService.get<string>('EMAIL_FROM');
    const appUrl = this.configService.get<string>('APP_URL');

    this.fromEmail = fromEmail || 'noreply@autofolio.local';
    this.appUrl = appUrl || 'http://localhost:3000';

    if (apiKey && fromEmail && appUrl) {
      this.resend = new Resend(apiKey);
    } else {
      const missing = [];
      if (!apiKey) missing.push('RESEND_API_KEY');
      if (!fromEmail) missing.push('EMAIL_FROM');
      if (!appUrl) missing.push('APP_URL');
      
      this.logger.warn(`Email provider not fully configured. Missing: ${missing.join(', ')}. Fallback mode active.`);
    }
  }

  isConfigured(): boolean {
    return !!this.resend;
  }

  /**
   * Generates a safe frontend URL with proper path handling.
   */
  private getFrontendUrl(path: string): string {
    const baseUrl = this.appUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${baseUrl}/${cleanPath}`;
  }

  async sendVerificationEmail(email: string, token: string, purpose: 'registration' | 'email_change') {
    const verificationUrl = this.getFrontendUrl(`/verify-email?token=${token}`);
    const subject = purpose === 'registration' ? 'Verify your AutoFolio account' : 'Verify your new email address';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #111111; border: 1px solid #222222; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 22px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff;">AutoFolio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; font-style: italic; text-transform: uppercase; letter-spacing: -0.02em; color: #ffffff;">
                VERIFY YOUR EMAIL
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                Welcome to AutoFolio. Verifying your email secures your account and enables critical vehicle alerts, maintenance reminders, and document expiry notifications.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; background-color: #ffffff; text-decoration: none; border-radius: 6px;">VERIFY EMAIL</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; font-size: 13px; color: #52525b;">
                This link expires in 24 hours.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #0d0d0d; border-top: 1px solid #222222;">
              <p style="margin: 0 0 12px; font-size: 12px; line-height: 1.5; color: #52525b;">
                If you did not request this, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #3f3f46; word-break: break-all;">
                Trouble with the button? Copy and paste this link:<br>
                <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: none;">${verificationUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
AUTOFOLIO: VERIFY YOUR EMAIL

Welcome to AutoFolio. Verifying your email secures your account and enables critical vehicle alerts, maintenance reminders, and document expiry notifications.

Verify your email by visiting the link below:
${verificationUrl}

This link expires in 24 hours.

If you did not request this, you can safely ignore this email.
    `.trim();

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
          text,
        });
      } catch (error) {
        this.logger.error(`Failed to send verification email to ${email}`, error);
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = this.getFrontendUrl(`/reset-password?token=${token}`);
    const subject = 'Reset your AutoFolio password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #111111; border: 1px solid #222222; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 22px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff;">AutoFolio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; font-style: italic; text-transform: uppercase; letter-spacing: -0.02em; color: #ffffff;">
                RESET YOUR PASSWORD
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                A password reset was requested for your AutoFolio account. Click the button below to set a new password.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; background-color: #ffffff; text-decoration: none; border-radius: 6px;">RESET PASSWORD</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; font-size: 13px; color: #52525b;">
                This link expires in 1 hour.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #0d0d0d; border-top: 1px solid #222222;">
              <p style="margin: 0 0 12px; font-size: 12px; line-height: 1.5; color: #52525b;">
                If you did not request this, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #3f3f46; word-break: break-all;">
                Trouble with the button? Copy and paste this link:<br>
                <a href="${resetUrl}" style="color: #3b82f6; text-decoration: none;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
AUTOFOLIO: RESET YOUR PASSWORD

A password reset was requested for your AutoFolio account. Visit the link below to set a new password:
${resetUrl}

This link expires in 1 hour.

If you did not request this, you can safely ignore this email.
    `.trim();

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
          text,
        });
      } catch (error) {
        this.logger.error(`Failed to send password reset email to ${email}`, error);
      }
    }
  }

  async sendReminderEmail(email: string, reminder: any): Promise<{ vehicleUrl: string }> {
    const vehicleUrl = this.getFrontendUrl(`/vehicles/${reminder.vehicleId}`);
    const subject = `AutoFolio: ${reminder.vehicleDisplayName} ${reminder.type.replace('_', ' ').toLowerCase()} is ${reminder.severity.replace('_', ' ')}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #111111; border: 1px solid #222222; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 22px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff;">AutoFolio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; font-style: italic; text-transform: uppercase; letter-spacing: -0.02em; color: #ffffff;">
                ${reminder.title.toUpperCase()}
              </h1>
              <p style="margin: 0 0 24px; font-size: 18px; font-weight: 600; color: #ffffff;">
                Status: <span style="color: ${reminder.severity === 'overdue' ? '#ef4444' : '#f59e0b'};">${reminder.severity.replace('_', ' ').toUpperCase()}</span>
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                ${reminder.message}
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #1a1a1a; border-radius: 8px;">
                ${reminder.dueDate ? `
                <tr>
                  <td style="padding: 15px; color: #71717a; font-size: 14px;">Due Date</td>
                  <td style="padding: 15px; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${new Date(reminder.dueDate).toLocaleDateString()}</td>
                </tr>
                ` : ''}
                ${reminder.dueOdometer ? `
                <tr>
                  <td style="padding: 15px; color: #71717a; font-size: 14px;">Due Odometer</td>
                  <td style="padding: 15px; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${reminder.dueOdometer.toLocaleString()}</td>
                </tr>
                ` : ''}
                ${reminder.currentOdometer ? `
                <tr>
                  <td style="padding: 15px; color: #71717a; font-size: 14px;">Current Odometer</td>
                  <td style="padding: 15px; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${reminder.currentOdometer.toLocaleString()}</td>
                </tr>
                ` : ''}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <a href="${vehicleUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; background-color: #ffffff; text-decoration: none; border-radius: 6px;">VIEW VEHICLE</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #0d0d0d; border-top: 1px solid #222222;">
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #3f3f46;">
                You are receiving this because you enabled ${reminder.type.replace('_', ' ').toLowerCase()} reminders for this vehicle.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
AUTOFOLIO REMINDER: ${reminder.title}
Status: ${reminder.severity.replace('_', ' ').toUpperCase()}

${reminder.message}
${reminder.dueDate ? `Due Date: ${new Date(reminder.dueDate).toLocaleDateString()}` : ''}
${reminder.dueOdometer ? `Due Odometer: ${reminder.dueOdometer.toLocaleString()}` : ''}

View your vehicle: ${vehicleUrl}
    `.trim();

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
          text,
        });
      } catch (error) {
        this.logger.error(`Failed to send reminder email to ${email}`, error);
        throw error;
      }
    } else {
      throw new Error('Email provider not configured');
    }

    return { vehicleUrl };
  }

  async sendReminderDigestEmail(email: string, reminders: any[]): Promise<{ garageUrl: string }> {
    const garageUrl = this.getFrontendUrl('/vehicles');
    const count = reminders.length;
    const subject = `AutoFolio: ${count} vehicle reminder${count > 1 ? 's' : ''} need attention`;

    const reminderItemsHtml = reminders.map(r => `
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #222222;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em;">${r.vehicleDisplayName}</p>
        <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #ffffff;">${r.title}</h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #a1a1aa;">${r.message}</p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a; border-radius: 6px;">
          ${r.dueDate ? `
          <tr>
            <td style="padding: 10px 15px; color: #71717a; font-size: 13px;">Due Date</td>
            <td style="padding: 10px 15px; color: #ffffff; font-size: 13px; text-align: right; font-weight: 600;">${new Date(r.dueDate).toLocaleDateString()}</td>
          </tr>
          ` : ''}
          ${r.dueOdometer ? `
          <tr>
            <td style="padding: 10px 15px; color: #71717a; font-size: 13px;">Due Odometer</td>
            <td style="padding: 10px 15px; color: #ffffff; font-size: 13px; text-align: right; font-weight: 600;">${r.dueOdometer.toLocaleString()}</td>
          </tr>
          ` : ''}
          ${r.currentOdometer ? `
          <tr>
            <td style="padding: 10px 15px; color: #71717a; font-size: 13px;">Current Odometer</td>
            <td style="padding: 10px 15px; color: #ffffff; font-size: 13px; text-align: right; font-weight: 600;">${r.currentOdometer.toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #111111; border: 1px solid #222222; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 22px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff;">AutoFolio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 800; font-style: italic; text-transform: uppercase; letter-spacing: -0.02em; color: #ffffff;">
                VEHICLE REMINDERS
              </h1>
              
              ${reminderItemsHtml}

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
                <tr>
                  <td align="left">
                    <a href="${garageUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; background-color: #ffffff; text-decoration: none; border-radius: 6px;">GO TO GARAGE</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #0d0d0d; border-top: 1px solid #222222;">
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #3f3f46;">
                You are receiving this digest because multiple reminders are due for your vehicles.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
AUTOFOLIO REMINDER DIGEST
${reminders.map(r => `
--- ${r.vehicleDisplayName.toUpperCase()} ---
${r.title}
Status: ${r.severity.toUpperCase()}
${r.message}
${r.dueDate ? `Due Date: ${new Date(r.dueDate).toLocaleDateString()}` : ''}
${r.dueOdometer ? `Due Odometer: ${r.dueOdometer.toLocaleString()}` : ''}
`).join('\n')}

View your garage: ${garageUrl}
    `.trim();

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
          text,
        });
      } catch (error) {
        this.logger.error(`Failed to send reminder digest email to ${email}`, error);
        throw error;
      }
    } else {
      throw new Error('Email provider not configured');
    }

    return { garageUrl };
  }

}
