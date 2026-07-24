// backend/src/orders/orders.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { Query } from '@nestjs/common'; // Añadir a las importaciones de @nestjs/common
import { OrderStatus } from '@prisma/client'; // Importar enum

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard) // ESCUDO PERIMETRAL: Bloquea accesos sin token
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. CREACIÓN: Solo los clientes pueden comprar
  @Post()
  @Roles(Role.CLIENT)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const clientId = req.user.sub; // Extraemos el UUID incondicionalmente del JWT
    return this.ordersService.create(createOrderDto, clientId);
  }

  // 2. LECTURA GLOBAL: Solo RRHH y Operarios ven todo el flujo logístico
  @Get()
  @Roles(Role.MANAGER, Role.WORKER)
  findAll() {
    return this.ordersService.findAll();
  }

  // 3. LECTURA AISLADA (Zero Trust): Endpoint específico para que el cliente vea su historial
  @Get('my-orders')
  @Roles(Role.CLIENT)
  findMyOrders(@Req() req: any) {
    return this.ordersService.findMyOrders(req.user.sub);
  }

  // 4. LECTURA POR ID: Mitigación IDOR en tiempo real
  @Get(':id')
  @Roles(Role.MANAGER, Role.WORKER, Role.CLIENT)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const order = await this.ordersService.findOne(id);
    
    // Si es un cliente intentando ver un pedido que no le pertenece, bloqueamos y registramos el intento
    if (req.user.role === Role.CLIENT && order.userId !== req.user.sub) {
      throw new ForbiddenException('Violación de seguridad: No tienes permisos para visualizar este recurso.');
    }
    
    return order;
  }
  // 5. MUTACIÓN ESPECÍFICA: Prevención de Mass Assignment
  @Patch(':id/status')
  @Roles(Role.MANAGER, Role.WORKER)
  updateStatus(
    @Param('id') id: string, 
    @Body() updateOrderStatusDto: UpdateOrderStatusDto, // DTO estricto, solo acepta 'status'
    @Req() req: any
  ) {
    const userId = req.user.sub; // Quién ejecuta la acción
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status, userId);
  }

  @Get()
  @Roles(Role.MANAGER, Role.WORKER)
  findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }
  
}