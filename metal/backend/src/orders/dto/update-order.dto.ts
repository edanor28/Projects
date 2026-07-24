import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Transición de estado inválida o no reconocida por el sistema.' })
  status: OrderStatus;
}