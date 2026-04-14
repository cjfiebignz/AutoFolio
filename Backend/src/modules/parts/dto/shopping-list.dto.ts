import { IsArray, ValidateNested, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ShoppingListItemDto {
  @IsString()
  savedPartId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class GenerateShoppingListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShoppingListItemDto)
  items: ShoppingListItemDto[];
}
