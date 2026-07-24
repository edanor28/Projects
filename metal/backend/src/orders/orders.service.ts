import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus }  from '@prisma/client';

@Injectable()
export class OrdersService {
  // INYECCIÓN DE DEPENDENCIAS: Traemos nuestro conector seguro a PostgreSQL
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, clientId: string) {
    //  PROTECCIÓN DE CONCURRENCIA (ACID Transaction)
    // Usamos $transaction. Si falla CUALQUIER operación aquí dentro (ej. falta stock), 
    // TODO se revierte automáticamente. No habrá cargos a medias ni inventario corrupto.
    return this.prisma.$transaction(async (tx) => {
      let totalCents = 0;
      const orderItemsData = [];

      // 1. Verificación de integridad por cada artículo solicitado
      for (const item of createOrderDto.items) {
        // Consultamos el producto directamente en la base de datos
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Violación de integridad: El producto ${item.productId} no existe.`);
        }

        // 2. REGLA DE NEGOCIO Y ANTI-RACE CONDITION: ¿Hay stock suficiente en este milisegundo?
        if (product.stockQuantity < item.quantity) {
          throw new ConflictException(
            `Stock insuficiente para el material: ${product.name}. Solicitado: ${item.quantity}, Disponible: ${product.stockQuantity}`
          );
        }

        // 3. Deducción de inventario EN CALIENTE
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: product.stockQuantity - item.quantity },
        });

        // 4. ZERO TRUST: Calculamos el total nosotros, JAMÁS confiamos en el total del frontend
        totalCents += product.priceCents * item.quantity;
        
        // Preparamos la instantánea (snapshot) de la compra
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          priceCents: product.priceCents, // Guardamos a qué precio se vendió hoy
        });
      }

      // 5. Creación definitiva de la cabecera del pedido (Order)
      const order = await tx.order.create({
        data: {
          userId: clientId,
          totalCents,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true }, // Devolvemos la relación para que el frontend lo renderice
      });

      // 6. CAJA NEGRA: Auditoría inmutable de creación de pedido
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Order',
          entityId: order.id,
          userId: clientId,
          details: { totalCents, items: orderItemsData },
        },
      });

      return order;
    });
  }

  // ---------------------------------------------------------------------
  // MÉTODOS DE LECTURA (Consultas Seguras con tipado UUID String)
  // ---------------------------------------------------------------------

  async findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined, // FILTRO $O(1) / O(log N): Directo en PostgreSQL
      include: { 
        items: { include: { product: true } },
        user: { select: { firstName: true, lastName: true, email: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
    return order;
  }

  async findMyOrders(clientId: string) {
    return this.prisma.order.findMany({
      where: { userId: clientId }, // Filtro estricto por identidad
      include: { 
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: string, status: any, userId: string) {
    // 1. Verificamos que el pedido exista
    const order = await this.findOne(id);

    // Si no hay cambio real, evitamos viajes innecesarios a la BBDD (O(1) abort)
    if (order.status === status) return order;

    // 2. Transacción de actualización y registro forense
    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
      });

      // 3. CAJA NEGRA: Registramos quién aprobó, rechazó o entregó este pedido
      await tx.auditLog.create({
        data: {
          action: `ORDER_${status}`, // Ej: ORDER_APPROVED, ORDER_REJECTED
          entity: 'Order',
          entityId: id,
          userId: userId,
          details: { 
            transition: `${order.status} -> ${status}`,
            totalCents: order.totalCents
          },
        },
      });

      // Nota de Negocio: Si el estado es REJECTED, aquí deberíamos retornar 
      // el stock al inventario. Por ahora lo mantenemos simple para el MVP.

      return updatedOrder;
    });
  }
}