import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    try {
      // Verificar si la categoría existe
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: createProductoDto.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${createProductoDto.categoriaId} no encontrada`);
      }

      // Si no se especifica stock, usamos el valor predeterminado 0
      const stockValue = createProductoDto.stock !== undefined ? createProductoDto.stock : 0;

      return await this.prisma.producto.create({
        data: {
          ...createProductoDto,
          stock: stockValue
        },
        include: {
          categoria: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un producto con ese nombre');
      }
      throw error;
    }
  }

  async findAll(rol?: string) {
    if (rol === 'BARTENDER') {
      // Buscar la categoría "Tragos"
      const categoriaTragos = await this.prisma.categoria.findFirst({
        where: {
          nombre: {
            equals: 'Tragos',
            mode: 'insensitive'
          }
        }
      });

      if (!categoriaTragos) {
        return [];
      }

      return await this.prisma.producto.findMany({
        where: {
          categoriaId: categoriaTragos.id
        },
        include: {
          categoria: true,
        },
      });
    }

    return await this.prisma.producto.findMany({
      include: {
        categoria: true,
      },
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
      },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    try {
      // Verificar si la categoría existe
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: updateProductoDto.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${updateProductoDto.categoriaId} no encontrada`);
      }

      return await this.prisma.producto.update({
        where: { id },
        data: updateProductoDto,
        include: {
          categoria: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un producto con ese nombre');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      throw error;
    }
  }

  async updateStock(id: number, stock: number) {
    try {
      return await this.prisma.producto.update({
        where: { id },
        data: { stock },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.producto.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar el producto porque está asociado a órdenes');
      }
      throw error;
    }
  }
} 