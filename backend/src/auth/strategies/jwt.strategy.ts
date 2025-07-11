import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'tu_clave_secreta',
    });
  }

  async validate(payload: any) {
    try {
      console.log('JWT Payload recibido:', payload);
      
      // Si el payload ya incluye la información del rol, podemos devolverla directamente
      if (payload.rol) {
        console.log('Usando rol del payload:', payload.rol);
        return {
          userId: payload.userId,
          email: payload.email,
          rolId: payload.rolId,
          rol: payload.rol
        };
      }
      
      // Si no, buscamos el usuario en la base de datos
      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.userId },
        include: {
          rol: true
        }
      });

      if (!user) {
        console.log('Usuario no encontrado en la validación JWT');
        throw new UnauthorizedException('Usuario no encontrado');
      }

      console.log('Usuario encontrado:', user.email, 'Rol:', user.rol?.nombre);
      
      // Devolver datos del usuario incluyendo el rol
      return {
        userId: user.id,
        email: user.email,
        rolId: user.rolId,
        rol: user.rol?.nombre
      };
    } catch (error) {
      console.error('Error al validar JWT:', error);
      throw new UnauthorizedException('Error al validar token');
    }
  }
} 