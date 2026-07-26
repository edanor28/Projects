import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CLIENT)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const clientId = req.user.sub;
    return this.ordersService.create(createOrderDto, clientId);
  }

  @Get()
  @Roles(Role.MANAGER, Role.WORKER)
  findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }

  @Get('my-orders')
  @Roles(Role.CLIENT)
  findMyOrders(@Req() req: any) {
    return this.ordersService.findMyOrders(req.user.sub);
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.WORKER, Role.CLIENT)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const order = await this.ordersService.findOne(id);
    if (req.user.role === Role.CLIENT && order.userId !== req.user.sub) {
      throw new ForbiddenException('Violación de seguridad: No tienes permisos para visualizar este recurso.');
    }
    return order;
  }

  @Patch(':id/status')
  @Roles(Role.MANAGER, Role.WORKER)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: any
  ) {
    const userId = req.user.sub;
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status, userId);
  }
}