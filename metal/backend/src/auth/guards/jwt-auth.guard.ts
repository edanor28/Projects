import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extraemos el objeto Request nativo de Express
    const request = context.switchToHttp().getRequest<Request>();
    
    // 2. Buscamos nuestra cookie blindada
    const token = request.cookies['access_token'];

    if (!token) {
      throw new UnauthorizedException('Acceso denegado: No se encontró un token de sesión.');
    }

    try {
      // 3. Verificamos matemáticamente la firma del JWT usando nuestro secreto
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 4. Inyección de Contexto Segura: Mutamos el request para adjuntar el usuario validado.
      // Así, cualquier controlador posterior tendrá acceso a req.user instantáneamente.
      request['user'] = payload;
      
    } catch (error) {
      // Si el token fue manipulado o expiró (pasaron las 8 horas), bloqueamos.
      throw new UnauthorizedException('Acceso denegado: Token inválido o expirado.');
    }
    
    return true;
  }
}