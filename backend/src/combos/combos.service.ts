import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComboDto, UpdateComboDto } from './dto/combo.dto';
import { Prisma } from '@prisma/client';

// Definir interfaz para la respuesta de disponibilidad
export interface DisponibilidadCombo {
  disponible: boolean;
  faltantes: Array<{
    producto: string;
    stockActual: number;
    stockRequerido: number;
  }>;
}

@Injectable()
export class CombosService {
  constructor(private prisma: PrismaService) {}

  async create(createComboDto: CreateComboDto) {
    try {
      // Verificar que todos los productos existen y tienen stock suficiente
      for (const item of createComboDto.productos) {
        const producto = await this.prisma.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
        }
      }

      // Crear el combo
      const combo = await this.prisma.combo.create({
        data: {
          nombre: createComboDto.nombre,
          descripcion: createComboDto.descripcion,
          precio: createComboDto.precio,
          activo: createComboDto.activo ?? true,
        },
      });

      // Crear las relaciones con los productos
      for (const item of createComboDto.productos) {
        await this.prisma.comboProducto.create({
          data: {
            comboId: combo.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
          },
        });
      }

      // Retornar el combo con sus productos
      return await this.prisma.combo.findUnique({
        where: { id: combo.id },
        include: {
          productos: {
            include: {
              producto: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Ya existe un combo con ese nombre');
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.combo.findMany({
      where: {
        activo: true,
      },
      include: {
        productos: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.combo.findMany({
      include: {
        productos: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const combo = await this.prisma.combo.findUnique({
      where: { id },
      include: {
        productos: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!combo) {
      throw new NotFoundException(`Combo con ID ${id} no encontrado`);
    }

    return combo;
  }

  async update(id: number, updateComboDto: UpdateComboDto) {
    try {
      // Verificar que el combo existe
      const comboExistente = await this.prisma.combo.findUnique({
        where: { id },
        include: { productos: true },
      });

      if (!comboExistente) {
        throw new NotFoundException(`Combo con ID ${id} no encontrado`);
      }

      // Si se actualizan los productos, verificar que existen
      if (updateComboDto.productos) {
        for (const item of updateComboDto.productos) {
          const producto = await this.prisma.producto.findUnique({
            where: { id: item.productoId },
          });

          if (!producto) {
            throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
          }
        }
      }

      // Actualizar datos básicos del combo
      const combo = await this.prisma.combo.update({
        where: { id },
        data: {
          nombre: updateComboDto.nombre,
          descripcion: updateComboDto.descripcion,
          precio: updateComboDto.precio,
          activo: updateComboDto.activo,
        },
      });

      // Si hay productos a actualizar, eliminar los actuales y crear los nuevos
      if (updateComboDto.productos) {
        // Eliminar productos actuales del combo
        await this.prisma.comboProducto.deleteMany({
          where: { comboId: id },
        });

        // Crear nuevas relaciones con productos
        for (const item of updateComboDto.productos) {
          await this.prisma.comboProducto.create({
            data: {
              comboId: combo.id,
              productoId: item.productoId,
              cantidad: item.cantidad,
            },
          });
        }
      }

      // Retornar el combo actualizado con sus productos
      return await this.prisma.combo.findUnique({
        where: { id: combo.id },
        include: {
          productos: {
            include: {
              producto: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Ya existe un combo con ese nombre');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Verificar que el combo existe
      const combo = await this.prisma.combo.findUnique({
        where: { id },
      });

      if (!combo) {
        throw new NotFoundException(`Combo con ID ${id} no encontrado`);
      }

      // Eliminar el combo y sus relaciones (CASCADE)
      return await this.prisma.combo.delete({
        where: { id },
      });
    } catch (error) {
      // Si hay referencias a este combo en órdenes, no permitir eliminación
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('No se puede eliminar el combo porque está siendo utilizado en órdenes');
        }
      }
      throw error;
    }
  }

  // Método para verificar disponibilidad de productos para un combo
  async verificarDisponibilidad(comboId: number): Promise<DisponibilidadCombo> {
    const combo = await this.prisma.combo.findUnique({
      where: { id: comboId },
      include: {
        productos: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!combo) {
      throw new NotFoundException(`Combo con ID ${comboId} no encontrado`);
    }

    const disponibilidad: DisponibilidadCombo = {
      disponible: true,
      faltantes: [],
    };

    // Verificar stock de cada producto
    for (const item of combo.productos) {
      if (item.producto.stock < item.cantidad) {
        disponibilidad.disponible = false;
        disponibilidad.faltantes.push({
          producto: item.producto.nombre,
          stockActual: item.producto.stock,
          stockRequerido: item.cantidad,
        });
      }
    }

    return disponibilidad;
  }
} 