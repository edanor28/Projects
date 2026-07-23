import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Verificación de colisiones (Evitar errores crípticos de base de datos)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado en el sistema.');
    }

    // 2. Criptografía intensiva (Argon2)
    const passwordHash = await argon2.hash(createUserDto.password);

    // 3. Inserción en la base de datos
    const newUser = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        passwordHash, // Guardamos el hash, NUNCA el texto plano
        role: createUserDto.role,
      },
    });

    // 4. Saneamiento de Memoria (Paranoia de datos sensibles)
    // Extraemos el hash de la respuesta para asegurarnos de que jamás viaje por la red HTTP
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  async findAll() {
    // Obtenemos todos los usuarios activos, excluyendo sus contraseñas a nivel de consulta
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('El usuario solicitado no existe.');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('El correo electrónico ya está registrado en el sistema.');
      }
    }

    let passwordHash = existingUser.passwordHash;
    if (updateUserDto.password) {
      passwordHash = await argon2.hash(updateUserDto.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
        role: updateUserDto.role,
        passwordHash,
      },
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  async remove(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('El usuario solicitado no existe.');
    }

    const deletedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const { passwordHash: _, ...safeUser } = deletedUser;
    return safeUser;
  }
}