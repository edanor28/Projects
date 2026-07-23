import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ⚠️ Patrón Arquitectónico: Hacemos el módulo global
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}