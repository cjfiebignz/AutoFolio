import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteAccountDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
