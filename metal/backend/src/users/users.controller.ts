import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// ACTIVACIÓN DE ESCUDOS: Solo usuarios autenticados pueden tocar esta ruta
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // SEGURIDAD: Solo el Gerente puede aprovisionar nuevas cuentas
  @Post()
  @Roles(Role.MANAGER)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // SEGURIDAD: Solo el Gerente puede ver el listado de personal
  @Get()
  @Roles(Role.MANAGER)
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  @Roles(Role.MANAGER)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}