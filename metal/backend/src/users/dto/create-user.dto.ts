import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña temporal debe tener al menos 8 caracteres' })
  password: string;

  // SEGURIDAD: Restringimos los roles estrictamente a los definidos en Prisma
  @IsEnum(Role, { message: 'Rol inválido. Debe ser MANAGER, WORKER o CLIENT' })
  role: Role;
}