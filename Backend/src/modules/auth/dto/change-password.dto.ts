import { IsNotEmpty, IsString, MinLength, Matches, IsUUID } from 'class-validator';

export class ChangePasswordDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'New password must contain at least one letter and one number.',
  })
  newPassword: string;
}
