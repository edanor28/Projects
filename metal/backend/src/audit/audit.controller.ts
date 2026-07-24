import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('audit')
// 1. ESCUDO GLOBAL DEL CONTROLADOR: Autenticación y Autorización
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.MANAGER) // 2. RESTRICCIÓN DE ROL: Solo Gerencia
  getLogs(@Query('limit') limit?: string) {
    // 3. SANEAMIENTO DE INPUT: Nunca confiamos en el cliente
    // Si un atacante envía "?limit=999999999" o "?limit=drop+table", lo neutralizamos
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const safeLimit = isNaN(parsedLimit) || parsedLimit > 500 ? 100 : parsedLimit;
    
    return this.auditService.getLatestLogs(safeLimit);
  }
}