import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leemos los roles exigidos por el decorador en la ruta actual
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Roles, asumimos que está protegida 
    // solo por Autenticación, pero abierta a cualquier rol.
    if (!requiredRoles) {
      return true;
    }

    // 2. Recuperamos el usuario inyectado por el JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // 3. Auditoría Zero Trust: Si llegamos aquí y no hay usuario, rompemos el flujo.
    if (!user) {
      throw new ForbiddenException('Contexto de seguridad comprometido.');
    }

    // 4. Validación de Roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      // ⚠️ Usamos 403 Forbidden, no 401. El usuario está logueado, pero NO tiene permisos.
      throw new ForbiddenException('No tienes los privilegios necesarios para esta acción.');
    }

    return true;
  }
}