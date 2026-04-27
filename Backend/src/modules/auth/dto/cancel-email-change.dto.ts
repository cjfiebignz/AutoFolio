import { IsNotEmpty, IsUUID } from 'class-validator';

export class CancelEmailChangeDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
