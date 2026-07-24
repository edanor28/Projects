import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module'; // 1. Importamos el módulo

@Module({
  imports: [AuthModule], // 2. Lo inyectamos en las dependencias
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
