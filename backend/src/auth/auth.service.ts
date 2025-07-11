import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateUserDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, currentUserRoleId: number) {
    // Obtener el rol del usuario actual
    const userRole = await this.prisma.rol.findUnique({
      where: { id: currentUserRoleId },
    });

    // Verificar si el usuario actual es admin
    if (userRole?.nombre !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden crear usuarios');
    }

    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El email ya está registrado');
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Crear el usuario
    const user = await this.prisma.usuario.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
      include: {
        rol: true
      }
    });

    // Generar token
    const token = this.jwtService.sign({ 
      userId: user.id,
      email: user.email,
      rolId: user.rolId,
      rol: user.rol.nombre
    });

    console.log('Token generado:', token); // Para depuración
    console.log('Datos de usuario incluidos en token:', {
      userId: user.id,
      email: user.email,
      rolId: user.rolId,
      rol: user.rol.nombre
    });

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rolId: user.rolId,
        rol: user.rol.nombre
      }
    };
  }

  async login(loginDto: LoginDto) {
    // Buscar usuario por email
    const user = await this.prisma.usuario.findUnique({
      where: { email: loginDto.email },
      include: {
        rol: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token
    const token = this.jwtService.sign({ 
      userId: user.id,
      email: user.email,
      rolId: user.rolId,
      rol: user.rol.nombre
    });

    console.log('Token generado:', token); // Para depuración
    console.log('Datos de usuario incluidos en token:', {
      userId: user.id,
      email: user.email,
      rolId: user.rolId,
      rol: user.rol.nombre
    });

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rolId: user.rolId,
        rol: user.rol.nombre
      }
    };
  }

  //Obtener usuarios
  async findAll() {
    return this.prisma.usuario.findMany({
      include: {
        rol: true
      },
    });
  }

  async getMe(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    };
  }

  async checkPermissions(user: any) {
    // Buscar el usuario completo con su rol
    const userWithRole = await this.prisma.usuario.findUnique({
      where: { id: user.userId },
      include: {
        rol: true
      }
    });

    if (!userWithRole) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar si el usuario es ADMIN o CAJERO
    const isAdmin = userWithRole.rol.nombre === 'ADMIN';
    const isCajero = userWithRole.rol.nombre === 'CAJERO';
    const isBartender = userWithRole.rol.nombre === 'BARTENDER';
    
    return {
      canManageCaja: isAdmin || isCajero,
      canCollectOrders: isAdmin || isCajero,
      canDeliverOrders: isAdmin || isCajero || isBartender,
      role: userWithRole.rol.nombre,
      permissions: {
        admin: isAdmin,
        cajero: isCajero,
        mozo: userWithRole.rol.nombre === 'MOZO',
        bartender: isBartender
      }
    };
  }

  // Añadimos los nuevos métodos para actualizar y eliminar usuarios
  async update(id: number, updateUserDto: UpdateUserDto, currentUserRoleId: number) {
    // Verificar si el usuario actual es admin
    const userRole = await this.prisma.rol.findUnique({
      where: { id: currentUserRoleId },
    });

    if (userRole?.nombre !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden actualizar usuarios');
    }

    // Verificar si el usuario a actualizar existe
    const userToUpdate = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });

    if (!userToUpdate) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se proporcionó una nueva contraseña, encriptarla
    let hashedPassword;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Actualizar el usuario
    const updatedUser = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...updateUserDto,
        ...(hashedPassword && { password: hashedPassword }),
      },
      include: { rol: true }
    });

    // Usar una desestructuración segura para incluir solo los campos que sabemos que existen
    return {
      id: updatedUser.id,
      nombre: updatedUser.nombre,
      email: updatedUser.email,
      rolId: updatedUser.rolId,
      rol: updatedUser.rol,
      // Incluir telefono solo si existe en el modelo
      ...(('telefono' in updatedUser) && { telefono: updatedUser.telefono })
    };
  }

  async remove(id: number, currentUserRoleId: number) {
    // Verificar si el usuario actual es admin
    const userRole = await this.prisma.rol.findUnique({
      where: { id: currentUserRoleId },
    });

    if (userRole?.nombre !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden eliminar usuarios');
    }

    // Verificar si el usuario a eliminar existe
    const userToDelete = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!userToDelete) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Eliminar el usuario
    await this.prisma.usuario.delete({
      where: { id }
    });

    return { message: `Usuario con ID ${id} eliminado correctamente` };
  }
} 