import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSucursalDto: CreateSucursalDto) {
    try {
      return await this.prisma.sucursal.create({
        data: createSucursalDto
      });
    } catch (error) {
      throw new BadRequestException('Error al crear la sucursal: ' + error.message);
    }
  }

  async findAll() {
    try {
      return await this.prisma.sucursal.findMany({
        include: {
          _count: {
            select: {
              cajas: true
            }
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });
    } catch (error) {
      throw new BadRequestException('Error al obtener las sucursales: ' + error.message);
    }
  }

  async findOne(id: number) {
    try {
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id },
        include: {
          cajas: {
            orderBy: { fechaApertura: 'desc' },
            take: 10,
            include: {
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true
                }
              },
              usuarioCierre: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        }
      });

      if (!sucursal) {
        throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
      }

      return sucursal;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener la sucursal: ' + error.message);
    }
  }

  async update(id: number, updateSucursalDto: UpdateSucursalDto) {
    try {
      // Verificar si la sucursal existe
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id }
      });

      if (!sucursal) {
        throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
      }

      return await this.prisma.sucursal.update({
        where: { id },
        data: updateSucursalDto
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la sucursal: ' + error.message);
    }
  }

  async remove(id: number) {
    try {
      // Verificar si la sucursal existe
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id },
        include: {
          cajas: true
        }
      });

      if (!sucursal) {
        throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
      }

      // Verificar si tiene cajas asociadas
      if (sucursal.cajas.length > 0) {
        throw new BadRequestException('No se puede eliminar la sucursal porque tiene cajas asociadas');
      }

      return await this.prisma.sucursal.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al eliminar la sucursal: ' + error.message);
    }
  }

  // Dashboard para admin: resumen de todas las sucursales
  async getResumenSucursales() {
    try {
      const sucursales = await this.prisma.sucursal.findMany({
        where: {
          activa: true
        },
        include: {
          cajas: {
            where: {
              estado: 'ABIERTA'
            },
            include: {
              movimientos: true
            }
          }
        }
      });

      // Preparar el resumen para cada sucursal
      return sucursales.map(sucursal => {
        // Calcular totales para cada caja abierta
        let totalIngresos = 0;
        let totalEgresos = 0;
        let saldoActual = 0;

        sucursal.cajas.forEach(caja => {
          const ingresos = caja.movimientos
            .filter(m => ['INGRESO', 'VENTA'].includes(m.tipo.toString()))
            .reduce((sum, m) => sum + Number(m.monto), 0);
          
          const egresos = caja.movimientos
            .filter(m => ['EGRESO', 'DEVOLUCION'].includes(m.tipo.toString()))
            .reduce((sum, m) => sum + Number(m.monto), 0);
          
          const saldo = Number(caja.saldoInicial) + ingresos - egresos;
          
          totalIngresos += ingresos;
          totalEgresos += egresos;
          saldoActual += saldo;
        });

        return {
          id: sucursal.id,
          nombre: sucursal.nombre,
          cajasAbiertas: sucursal.cajas.length,
          totalIngresos,
          totalEgresos,
          saldoActual
        };
      });
    } catch (error) {
      throw new BadRequestException('Error al obtener el resumen de sucursales: ' + error.message);
    }
  }
} 