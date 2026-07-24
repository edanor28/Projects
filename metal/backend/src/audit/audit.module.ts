import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module'; // Importación vital para los Guards

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}