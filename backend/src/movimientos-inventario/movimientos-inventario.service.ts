import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientoDto, MovimientoFilterDto } from './dto/movimiento-inventario.dto';

@Injectable()
export class MovimientosInventarioService {
  constructor(private prisma: PrismaService) {}

  async create(createMovimientoDto: CreateMovimientoDto, usuarioId: number) {
    try {
      // Verificar que el usuarioId sea válido
      if (!usuarioId || isNaN(usuarioId)) {
        throw new BadRequestException('ID de usuario no válido');
      }
      
      // Verificar que el usuario exista
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });
      
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
      }

      // 1. Obtener el producto actual para ver su stock
      const producto = await this.prisma.producto.findUnique({
        where: { id: createMovimientoDto.productoId },
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${createMovimientoDto.productoId} no encontrado`);
      }

      // 2. Calcular el nuevo stock según el tipo de movimiento
      let nuevoStock = producto.stock;
      
      switch (createMovimientoDto.tipo) {
        case 'ENTRADA':
          nuevoStock = producto.stock + createMovimientoDto.cantidad;
          break;
        case 'SALIDA':
        case 'VENTA':
          if (producto.stock < createMovimientoDto.cantidad) {
            throw new BadRequestException('Stock insuficiente para realizar una salida');
          }
          nuevoStock = producto.stock - createMovimientoDto.cantidad;
          break;
        case 'AJUSTE':
          nuevoStock = createMovimientoDto.cantidad; // En un ajuste, la cantidad es el nuevo stock
          break;
        default:
          throw new BadRequestException('Tipo de movimiento no válido');
      }

      // 3. Crear el movimiento y actualizar el stock en una transacción
      return await this.prisma.$transaction(async (prisma) => {
        // Registrar el movimiento
        const movimiento = await prisma.movimientoInventario.create({
          data: {
            tipo: createMovimientoDto.tipo as any,
            cantidad: createMovimientoDto.cantidad,
            motivo: createMovimientoDto.motivo,
            producto: {
              connect: { id: createMovimientoDto.productoId }
            },
            usuario: {
              connect: { id: usuario.id }
            },
            stockAnterior: producto.stock,
            stockNuevo: nuevoStock,
          },
          include: {
            producto: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rolId: true,
              }
            }
          }
        });

        // Actualizar el stock del producto
        await prisma.producto.update({
          where: { id: createMovimientoDto.productoId },
          data: { stock: nuevoStock },
        });

        return movimiento;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al registrar el movimiento: ' + error.message);
    }
  }

  async findAll(filters: MovimientoFilterDto) {
    try {
      const where = {};
      
      // Aplicar filtros si se proporcionan
      if (filters.tipo) {
        where['tipo'] = filters.tipo;
      }
      
      if (filters.productoId) {
        where['productoId'] = filters.productoId;
      }
      
      // Filtrar por rango de fechas si se proporcionan
      if (filters.fechaInicio || filters.fechaFin) {
        where['fechaHora'] = {};
        
        if (filters.fechaInicio) {
          where['fechaHora']['gte'] = new Date(filters.fechaInicio);
        }
        
        if (filters.fechaFin) {
          where['fechaHora']['lte'] = new Date(filters.fechaFin);
        }
      }

      return await this.prisma.movimientoInventario.findMany({
        where,
        include: {
          producto: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rolId: true,
              rol: true,
            },
          },
        },
        orderBy: {
          fechaHora: 'desc',
        },
      });
    } catch (error) {
      throw new BadRequestException('Error al obtener los movimientos: ' + error.message);
    }
  }

  async findOne(id: number) {
    const movimiento = await this.prisma.movimientoInventario.findUnique({
      where: { id },
      include: {
        producto: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolId: true,
            rol: true,
          },
        },
      },
    });

    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }

    return movimiento;
  }
} 