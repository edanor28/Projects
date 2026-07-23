
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida las credenciales contra la BBDD.
   * Complejidad: O(1) o O(log n) en la búsqueda DB gracias al índice @unique de Prisma.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Sanitización implícita y Búsqueda
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Prevención de Enumeración de Usuarios (OWASP): 
    // Lanzamos el MISMO mensaje genérico si el correo no existe o si la clave es incorrecta.
    // Así un atacante no puede usar scripts para descubrir qué correos están registrados.
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validación de Soft Deletes (Seguridad de acceso)
    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada. Contacte al administrador.');
    }

    // 2. Verificación criptográfica intensiva en CPU/RAM
    const isPasswordValid = await argon2.verify(user.passwordHash, pass);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Saneamiento de Memoria (Paranoia de datos sensibles)
    // Extraemos el hash para que NUNCA viaje a otras capas de la aplicación por error.
    const { passwordHash, ...safeUser } = user;
    
    return safeUser;
  }

  /**
   * Genera el Token JWT estructurado.
   */
  async login(user: any) {
    // El payload solo debe contener datos no sensibles necesarios para identificar la sesión y el RBAC
    const payload = { 
      sub: user.id, // Subject (ID del usuario)
      email: user.email, 
      role: user.role 
    };
    
    return {
      // El Token final firmado con la clave secreta del servidor
      access_token: this.jwtService.sign(payload),
    };
  }
}