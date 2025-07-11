import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    console.log('RolesGuard - Usuario recibido:', user);
    console.log('RolesGuard - Roles requeridos:', requiredRoles);
    
    // Si el usuario ya tiene el rol como string o objeto
    let userRoleName: string | null = null;
    
    // Caso 1: el rol está como string directamente
    if (typeof user.rol === 'string') {
      userRoleName = user.rol.toUpperCase();
      console.log('RolesGuard - Rol encontrado como string:', userRoleName);
    } 
    // Caso 2: el rol está como objeto con propiedad nombre
    else if (user.rol && typeof user.rol.nombre === 'string') {
      userRoleName = user.rol.nombre.toUpperCase();
      console.log('RolesGuard - Rol encontrado como objeto:', userRoleName);
    } 
    // Caso 3: necesitamos consultar la base de datos
    else if (user.rolId) {
      try {
        const userRole = await this.prisma.rol.findUnique({
          where: { id: user.rolId },
        });
        
        if (userRole && userRole.nombre) {
          userRoleName = userRole.nombre.toUpperCase();
          console.log('RolesGuard - Rol encontrado en BD:', userRoleName);
        }
      } catch (error) {
        console.error('RolesGuard - Error al buscar rol:', error);
      }
    }
    
    // Convertir los roles requeridos a mayúsculas para comparación
    const requiredRolesUpperCase = requiredRoles.map(role => role.toUpperCase());
    
    const hasPermission = userRoleName !== null && requiredRolesUpperCase.includes(userRoleName);
    console.log('RolesGuard - ¿Tiene permiso?:', hasPermission);
    
    return hasPermission;
  }
} 