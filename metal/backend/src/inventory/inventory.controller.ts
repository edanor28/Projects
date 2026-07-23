import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// 1. ACTIVACIÓN DE ESCUDOS: Todas las rutas de este controlador requieren Token y validación de Rol
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Solo el Gerente puede añadir metales al catálogo base
  @Post()
  @Roles(Role.MANAGER)
  create(@Body() createInventoryDto: CreateInventoryDto, @Req() req: any) {
    return this.inventoryService.create(createInventoryDto, req.user.sub);
  }

  // Todos pueden ver el catálogo (Clientes para comprar, Trabajadores para fabricar)
  @Get()
  @Roles(Role.MANAGER, Role.WORKER, Role.CLIENT)
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.WORKER, Role.CLIENT)
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  // Trabajadores y Gerentes pueden actualizar el stock o precios
  @Patch(':id')
  @Roles(Role.MANAGER, Role.WORKER)
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Req() req: any,
  ) {
    const userRole = req.user.role;

    if (userRole === Role.WORKER) {
      if (updateInventoryDto.priceCents !== undefined) {
        throw new ForbiddenException('Violación de seguridad: Los operarios no pueden alterar precios.');
      }

      delete updateInventoryDto.name;
      delete updateInventoryDto.description;
    }

    return this.inventoryService.update(id, updateInventoryDto, req.user.sub);
  }

  // Solo el Gerente tiene privilegios destructivos
  @Delete(':id')
  @Roles(Role.MANAGER)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.remove(id, req.user.sub);
  }
}