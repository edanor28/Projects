import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { AuthModule } from '../auth/auth.module'; // 1. Importamos el módulo

@Module({
  imports: [AuthModule], // 2. Lo inyectamos en las dependencias
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
