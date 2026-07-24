import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getLatestLogs(limit: number = 100) {
    return this.prisma.auditLog.findMany({
      take: limit, // Prevención de agotamiento de memoria (DDoS interno)
      orderBy: { createdAt: 'desc' },
      include: {
        // Relación segura: Solo traemos los datos de identidad necesarios
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}