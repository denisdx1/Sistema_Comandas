import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    try {
      return await this.prisma.categoria.create({
        data: createCategoriaDto,
        include: {
          productos: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.categoria.findMany({
      include: {
        _count: {
          select: {
            productos: true
          }
        }
      },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        productos: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto) {
    try {
      return await this.prisma.categoria.update({
        where: { id },
        data: updateCategoriaDto,
        include: {
          productos: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.categoria.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar la categoría porque tiene productos asociados');
      }
      throw error;
    }
  }
} 