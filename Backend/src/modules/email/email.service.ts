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

  async sendVerificationEmail(email: string, token: string, purpose: 'registration' | 'email_change') {
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;
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
                  <td style="background-color: #3b82f6; border-radius: 4px; padding: 6px 8px; font-weight: 900; color: #ffffff; font-size: 14px; letter-spacing: -0.05em;">AF</td>
                  <td style="padding-left: 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff;">AutoFolio</td>
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
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
          text,
        });

        if (error) {
          this.logger.error(`Resend API error sending email to ${email}:`, error);
        } else {
          this.logger.log(`Verification email sent to ${email} for ${purpose}. ID: ${data?.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send verification email to ${email}`, error);
      }
    } else {
      this.logger.warn('Email provider not configured. Verification email was not sent.');
      this.logger.log('--- DEV EMAIL ---');
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`URL: ${verificationUrl}`);
      this.logger.log('------------------');
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
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
                  <td style="background-color: #3b82f6; border-radius: 4px; padding: 6px 8px; font-weight: 900; color: #ffffff; font-size: 14px; letter-spacing: -0.05em;">AF</td>
                  <td style="padding-left: 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff;">AutoFolio</td>
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
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
          text,
        });

        if (error) {
          this.logger.error(`Resend API error sending password reset email to ${email}:`, error);
        } else {
          this.logger.log(`Password reset email sent to ${email}. ID: ${data?.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send password reset email to ${email}`, error);
      }
    } else {
      this.logger.warn('Email provider not configured. Password reset email was not sent.');
      this.logger.log('--- DEV EMAIL ---');
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`URL: ${resetUrl}`);
      this.logger.log('------------------');
    }
  }
}
