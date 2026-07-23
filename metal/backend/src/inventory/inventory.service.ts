import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(createInventoryDto: CreateInventoryDto, userId: string) {
    const product = await this.prisma.product.create({
      data: createInventoryDto,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        userId,
        details: {
          new: product,
        },
      },
    });

    return product;
  }

  async findAll() {
    // Retorna todos los productos. En un futuro Sprint añadiremos paginación
    // para evitar cuellos de botella de memoria si hay millones de registros.
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return product;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto, userId: string) {
    const oldProduct = await this.findOne(id);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateInventoryDto,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Product',
        entityId: id,
        userId,
        details: {
          old: {
            stock: oldProduct.stockQuantity,
            price: oldProduct.priceCents,
          },
          new: {
            stock: updatedProduct.stockQuantity,
            price: updatedProduct.priceCents,
          },
        },
      },
    });

    return updatedProduct;
  }

  async remove(id: string, userId: string) {
    const oldProduct = await this.findOne(id);

    const deletedProduct = await this.prisma.product.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Product',
        entityId: id,
        userId,
        details: {
          deleted: oldProduct,
        },
      },
    });

    return deletedProduct;
  }
}
