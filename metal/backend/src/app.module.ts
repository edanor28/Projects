import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // 1. Cargamos las variables de entorno de forma global y estricta
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
    // 2. Conectamos la Base de Datos
    PrismaModule,
    // 3. Conectamos el motor de Autenticación
    AuthModule,
    InventoryModule,
    UsersModule,
    AuditModule,
    OrdersModule,
  ],
})
export class AppModule {}