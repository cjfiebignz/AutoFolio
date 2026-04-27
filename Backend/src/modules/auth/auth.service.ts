import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CancelEmailChangeDto } from './dto/cancel-email-change.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async createVerificationToken(userId: string, email: string, purpose: 'registration' | 'email_change') {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Delete any existing unused tokens for this user and purpose
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId, purpose, usedAt: null },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        email,
        tokenHash,
        purpose,
        expiresAt,
      },
    });

    return rawToken;
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    const genericMessage = 'If an account exists for this email, a reset link has been sent.';

    // Find active user by email
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    // Security: Always return generic success even if user not found or soft-deleted
    if (!user) {
      return { success: true, message: genericMessage };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Invalidate previous reset tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(email, rawToken);

    return { success: true, message: genericMessage };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const user = resetToken.user;

    // Security: Ensure user is still active
    if (user.deletedAt) {
      throw new BadRequestException('This account is no longer active.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    // Update user and mark token used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash,
          emailVerifiedAt: user.emailVerifiedAt || new Date(), // Resetting password proves email access
          emailVerified: user.emailVerified || new Date(),
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate other pending reset tokens for this user
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
    ]);

    return { success: true, message: 'Your password has been successfully reset.' };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    
    this.logger.debug(`Verifying email token. Hash prefix: ${tokenHash.substring(0, 8)}`);

    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
      },
      include: { user: true },
    });

    if (!verificationToken) {
      this.logger.warn(`Verification token not found for hash prefix: ${tokenHash.substring(0, 8)}`);
      throw new BadRequestException('Invalid or expired verification token.');
    }

    if (verificationToken.usedAt) {
      this.logger.warn(`Verification token already used at ${verificationToken.usedAt} for userId ${verificationToken.userId}`);
      throw new BadRequestException('This verification link has already been used.');
    }

    if (verificationToken.expiresAt < new Date()) {
      this.logger.warn(`Verification token expired at ${verificationToken.expiresAt} for userId ${verificationToken.userId}`);
      throw new BadRequestException('This verification link has expired.');
    }

    const { user, email, purpose } = verificationToken;
    this.logger.log(`Found valid token. Purpose: ${purpose}, UserId: ${user.id}`);

    if (purpose === 'registration') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          emailVerifiedAt: new Date(),
          emailVerified: new Date(), // Set legacy field too
        },
      });
    } else if (purpose === 'email_change') {
      // Security check: ensure pending email still matches what was requested
      if (user.pendingEmail !== email) {
        throw new BadRequestException('Verification email mismatch.');
      }

      // Check for conflict
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existing && existing.id !== user.id) {
        throw new ConflictException('The requested email is already in use by another account.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          emailVerifiedAt: new Date(),
          emailVerified: new Date(), // Set legacy field too
          pendingEmail: null,
        },
      });
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    return { 
      success: true, 
      message: purpose === 'registration' 
        ? 'Your account has been successfully verified.' 
        : 'Your new email address has been verified and updated.'
    };
  }

  async resendVerificationEmail(userId: string, purposeInput?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const purpose = (purposeInput === 'email_change' && user.pendingEmail) ? 'email_change' : 'registration';
    const email = purpose === 'email_change' ? user.pendingEmail! : user.email!;

    if (purpose === 'registration' && user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified.');
    }

    const rawToken = await this.createVerificationToken(user.id, email, purpose);
    await this.emailService.sendVerificationEmail(email, rawToken, purpose);

    return { success: true, message: 'Verification email sent.' };
  }

  async updateAccount(dto: UpdateAccountDto) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: dto.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name?.trim() || null;
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      
      // Rule: Require password before email change
      if (!user.passwordHash) {
        throw new BadRequestException('Please set a password before changing your email address.');
      }

      // Check for conflict if email is actually changing
      if (normalizedEmail !== user.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existing) {
          throw new ConflictException('An account already exists with this email.');
        }
        
        // Don't change email immediately
        updateData.pendingEmail = normalizedEmail;
        
        // Generate token and send email
        const rawToken = await this.createVerificationToken(user.id, normalizedEmail, 'email_change');
        await this.emailService.sendVerificationEmail(normalizedEmail, rawToken, 'email_change');
      }
    }

    if (Object.keys(updateData).length === 0) {
      return this.getAccountMetadata(user.id);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return this.getAccountMetadata(user.id);
  }

  async verifyCredentials(dto: VerifyCredentialsDto) {
    const email = dto.email.trim().toLowerCase();

    // Find active user by email
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    // Generic unauthorized error for any failure (user missing, password missing, or mismatch)
    const unauthorizedError = new BadRequestException('Invalid email or password.');

    if (!user || !user.passwordHash) {
      throw unauthorizedError;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw unauthorizedError;
    }

    // Return only safe user fields for session
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    
    // Check if ANY user already exists with this email (including soft-deleted)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        throw new ConflictException('This account has been deactivated. Please contact support.');
      }
      throw new ConflictException('An account already exists with this email.');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    try {
      // Create user (starts unverified)
      const user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name,
          passwordHash,
          emailVerifiedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          createdAt: true,
        },
      });

      // Generate verification token
      const rawToken = await this.createVerificationToken(user.id, email, 'registration');
      
      // Send email (swallows errors in dev if env missing)
      await this.emailService.sendVerificationEmail(email, rawToken, 'registration');

      return user;
    } catch (err) {
      // Defensively catch unique constraint violations (P2002)
      if (err.code === 'P2002') {
        throw new ConflictException('An account already exists with this email.');
      }
      throw err;
    }
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: dto.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('This account does not have a password set. Please use "Set Password" instead.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password changed successfully.' };
  }

  async setPassword(dto: SetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: dto.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.passwordHash) {
      throw new BadRequestException('This account already has a password set. Please use "Change Password" instead.');
    }

    // Hash and save
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password set successfully.' };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // 1. Unlink/Delete NextAuth Account and Session records
    // This allows the user to re-link their Google account to a brand-new AutoFolio account later.
    await this.prisma.account.deleteMany({
      where: { userId },
    });
    
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // 2. Soft delete and anonymize the User record
    // This frees up the original email for a new registration.
    const anonymizedEmail = `deleted+${userId}@autofolio.local`;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        email: anonymizedEmail,
        name: 'Deleted User',
        passwordHash: null,
        image: null,
        dailyVehicleId: null, // Clear canonical daily vehicle link
      },
    });

    return { success: true, message: 'Account deactivated and anonymized successfully.' };
  }

  async cancelEmailChange(dto: CancelEmailChangeDto) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: dto.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.pendingEmail) {
      return this.getAccountMetadata(user.id);
    }

    // Clear pending email and invalidate unused email_change tokens
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { pendingEmail: null },
      }),
      this.prisma.emailVerificationToken.deleteMany({
        where: { 
          userId: user.id, 
          purpose: 'email_change',
          usedAt: null 
        },
      }),
    ]);

    return this.getAccountMetadata(user.id);
  }

  async getAccountMetadata(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: Boolean(user.passwordHash),
      emailVerifiedAt: user.emailVerifiedAt,
      pendingEmail: user.pendingEmail,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt,
    };
  }
}
