import { IsString, IsInt, Min, IsArray, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'Debe solicitar al menos 1 unidad' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'El pedido no puede estar vacío' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}