import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRolDto, UpdateRolDto } from './dto/rol.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRolDto: CreateRolDto) {
    try {
      return await this.prisma.rol.create({
        data: createRolDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.rol.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return rol;
  }

  async update(id: number, updateRolDto: UpdateRolDto) {
    try {
      return await this.prisma.rol.update({
        where: { id },
        data: updateRolDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.rol.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar el rol porque tiene usuarios asociados');
      }
      throw error;
    }
  }
} 