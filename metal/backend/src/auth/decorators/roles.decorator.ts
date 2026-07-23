import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Importamos el Enum nativo de nuestra BBDD

export const ROLES_KEY = 'roles';

// Este decorador nos permitirá escribir @Roles(Role.MANAGER, Role.WORKER) encima de las rutas
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);