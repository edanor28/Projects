import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // SEGURIDAD FINANCIERA: Siempre validamos que sea un número entero (centavos)
  // No aceptamos floats para evitar vulnerabilidades de redondeo de punto flotante.
  @IsInt({ message: 'El precio debe ser un número entero (en centavos)' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  priceCents: number;

  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stockQuantity: number;
}