import { Controller, Post, Patch, Delete, Body, HttpCode, HttpStatus, Get, Param, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CancelEmailChangeDto } from './dto/cancel-email-change.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('account')
  async updateAccount(@Body() dto: UpdateAccountDto) {
    return this.authService.updateAccount(dto);
  }

  @Patch('cancel-email-change')
  @HttpCode(HttpStatus.OK)
  async cancelEmailChange(@Body() dto: CancelEmailChangeDto) {
    return this.authService.cancelEmailChange(dto);
  }

  @Post('verify-credentials')
  @HttpCode(HttpStatus.OK)
  async verifyCredentials(@Body() dto: VerifyCredentialsDto) {
    return this.authService.verifyCredentials(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Patch('change-password')
  async changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  @Patch('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.authService.setPassword(dto);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Body() dto: DeleteAccountDto) {
    return this.authService.deleteAccount(dto.userId);
  }

  @Get('account/:userId')
  async getAccountMetadata(@Param('userId') userId: string) {
    return this.authService.getAccountMetadata(userId);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification-email')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body('userId') userId: string,
    @Body('purpose') purpose?: string
  ) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.authService.resendVerificationEmail(userId, purpose);
  }
}
