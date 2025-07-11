import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CierreCajaDto, CreateMovimientoCajaDto } from './dto/caja.dto';
import { AperturaCajaDto } from './dto/apertura-caja.dto';
import { CajaFilterDto } from './dto/caja-filter.dto';

@Injectable()
export class CajasService {
  constructor(private prisma: PrismaService) {}

  async abrirCaja(aperturaCajaDto: AperturaCajaDto, usuarioId: number) {
    try {
      // Ya no verificamos si existe una caja abierta en la sucursal
      // Eliminamos la restricción para permitir múltiples cajas por sucursal

      // Verificar que la sucursal existe
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id: aperturaCajaDto.sucursalId }
      });

      if (!sucursal) {
        throw new NotFoundException(`Sucursal con ID ${aperturaCajaDto.sucursalId} no encontrada`);
      }

      // Verificar que la sucursal esté activa
      if (!sucursal.activa) {
        throw new BadRequestException('Esta sucursal está inactiva');
      }

      // Si se especificó un cajero, verificar que exista y tenga el rol adecuado
      let usuarioAperturaId = usuarioId;
      
      if (aperturaCajaDto.cajeroId) {
        const cajero = await this.prisma.usuario.findUnique({
          where: { id: aperturaCajaDto.cajeroId },
          include: { rol: true }
        });
        
        if (!cajero) {
          throw new NotFoundException(`Cajero con ID ${aperturaCajaDto.cajeroId} no encontrado`);
        }
        
        if (cajero.rol.nombre !== 'CAJERO' && cajero.rol.nombre !== 'ADMIN') {
          throw new BadRequestException('El usuario seleccionado no tiene permisos de cajero');
        }
        
        usuarioAperturaId = cajero.id;
      }

      // Crear la caja
      const caja = await this.prisma.caja.create({
        data: {
          estado: 'ABIERTA',
          saldoInicial: aperturaCajaDto.saldoInicial,
          observaciones: aperturaCajaDto.observaciones,
          usuarioAperturaId: usuarioAperturaId,
          sucursalId: aperturaCajaDto.sucursalId
        } as any
      });

      return caja;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al abrir la caja: ' + error.message);
    }
  }

  async cerrarCaja(id: number, cierreCajaDto: CierreCajaDto, usuarioId: number) {
    try {
      // Verificar si la caja existe
      const caja = await this.prisma.caja.findUnique({
        where: { id },
        include: {
          movimientos: true
        } as any
      });

      if (!caja) {
        throw new NotFoundException(`Caja con ID ${id} no encontrada`);
      }

      // Verificar si la caja está abierta
      if (caja.estado !== 'ABIERTA') {
        throw new BadRequestException('La caja ya está cerrada');
      }

      // Verificar si el usuario existe
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
      }

      // Calcular el saldo teórico según los movimientos
      const totalIngresos = (caja as any).movimientos
        .filter(m => ['INGRESO', 'VENTA'].includes(m.tipo.toString()))
        .reduce((sum, m) => sum + Number(m.monto), 0);
      
      const totalEgresos = (caja as any).movimientos
        .filter(m => ['EGRESO', 'DEVOLUCION'].includes(m.tipo.toString()))
        .reduce((sum, m) => sum + Number(m.monto), 0);
      
      const saldoTeorico = Number(caja.saldoInicial) + totalIngresos - totalEgresos;

      // Actualizar la caja con el cierre
      const cajaCerrada = await this.prisma.caja.update({
        where: { id },
        data: {
          estado: 'CERRADA',
          saldoFinal: cierreCajaDto.saldoFinal,
          fechaCierre: new Date(),
          observaciones: caja.observaciones 
            ? `${caja.observaciones} | CIERRE: ${cierreCajaDto.observaciones || ''} | Saldo teórico: ${saldoTeorico}`
            : `CIERRE: ${cierreCajaDto.observaciones || ''} | Saldo teórico: ${saldoTeorico}`,
          usuarioCierre: {
            connect: { id: usuarioId }
          }
        },
        include: {
          usuarioApertura: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rolId: true
            }
          },
          usuarioCierre: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rolId: true
            }
          },
          movimientos: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                  rolId: true
                }
              },
              orden: true
            }
          },
          sucursal: true
        } as any
      });

      return {
        ...cajaCerrada,
        saldoTeorico,
        diferencia: Number(cajaCerrada.saldoFinal) - saldoTeorico
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al cerrar la caja: ' + error.message);
    }
  }

  async getCajaActual(sucursalId?: number) {
    try {
      // Buscar la caja abierta en la sucursal específica o en cualquier sucursal
      const whereClause: any = {
        estado: 'ABIERTA',
      };
      
      if (sucursalId) {
        whereClause.sucursalId = sucursalId;
      }

      const cajaAbierta = await this.prisma.caja.findFirst({
        where: whereClause,
        include: {
          sucursal: true,
          usuarioApertura: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rolId: true
            }
          },
          movimientos: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                  rolId: true
                }
              },
              orden: true
            },
            orderBy: {
              fechaHora: 'desc'
            }
          }
        } as any
      });

      if (!cajaAbierta) {
        throw new NotFoundException('No hay ninguna caja abierta' + (sucursalId ? ' en esta sucursal' : ''));
      }

      // Calcular saldos
      const totalIngresos = (cajaAbierta as any).movimientos
        .filter(m => ['INGRESO', 'VENTA'].includes(m.tipo.toString()))
        .reduce((sum, m) => sum + Number(m.monto), 0);
      
      const totalEgresos = (cajaAbierta as any).movimientos
        .filter(m => ['EGRESO', 'DEVOLUCION'].includes(m.tipo.toString()))
        .reduce((sum, m) => sum + Number(m.monto), 0);
      
      const saldoActual = Number(cajaAbierta.saldoInicial) + totalIngresos - totalEgresos;

      return {
        ...cajaAbierta,
        saldoActual,
        totalIngresos,
        totalEgresos
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener la caja actual: ' + error.message);
    }
  }

  async registrarMovimiento(cajaId: number, createMovimientoDto: CreateMovimientoCajaDto, usuarioId: number) {
    try {
      // Verificar si la caja existe y está abierta
      const caja = await this.prisma.caja.findUnique({
        where: { id: cajaId }
      });

      if (!caja) {
        throw new NotFoundException(`Caja con ID ${cajaId} no encontrada`);
      }

      if (caja.estado !== 'ABIERTA') {
        throw new BadRequestException('No se pueden registrar movimientos en una caja cerrada');
      }

      // Verificar si el usuario existe
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
      }

      // Si es una venta, verificar que exista la orden
      if (createMovimientoDto.tipo === 'VENTA' && !createMovimientoDto.ordenId) {
        throw new BadRequestException('Para registrar una venta, debe proporcionar un ID de orden');
      }

      if (createMovimientoDto.ordenId) {
        const orden = await this.prisma.orden.findUnique({
          where: { id: createMovimientoDto.ordenId }
        });

        if (!orden) {
          throw new NotFoundException(`Orden con ID ${createMovimientoDto.ordenId} no encontrada`);
        }
      }

      // Crear el movimiento
      const movimiento = await this.prisma.movimientoCaja.create({
        data: {
          tipo: createMovimientoDto.tipo as any,
          monto: createMovimientoDto.monto,
          concepto: createMovimientoDto.concepto,
          caja: {
            connect: { id: cajaId }
          },
          usuario: {
            connect: { id: usuarioId }
          },
          ...(createMovimientoDto.ordenId && {
            orden: {
              connect: { id: createMovimientoDto.ordenId }
            }
          })
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rolId: true
            }
          },
          orden: true,
          caja: true
        }
      });

      return movimiento;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al registrar el movimiento: ' + error.message);
    }
  }

  async findAll(filters: CajaFilterDto, usuarioId?: number, rolNombre?: string) {
    try {
      const { estado, fechaDesde, fechaHasta, sucursalId } = filters as any;

      let whereClause: any = {};
      
      if (estado) {
        whereClause.estado = estado;
      }
      
      if (fechaDesde) {
        whereClause.fechaApertura = { gte: new Date(fechaDesde) };
      }
      
      if (fechaHasta) {
        if (!whereClause.fechaApertura) {
          whereClause.fechaApertura = {};
        }
        whereClause.fechaApertura.lte = new Date(fechaHasta);
      }
      
      if (sucursalId) {
        whereClause.sucursalId = parseInt(sucursalId);
      }

      // Filtrar por usuario si es CAJERO
      if (rolNombre === 'CAJERO' && usuarioId) {
        whereClause.usuarioAperturaId = usuarioId;
      }

      const cajas = await this.prisma.caja.findMany({
        where: whereClause,
        include: {
          sucursal: true,
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
          },
          movimientos: true
        } as any
      });

      // Calcular saldos para cada caja
      return cajas.map(caja => {
        const cajasWithMovimientos = caja as any;
        const totalIngresos = cajasWithMovimientos.movimientos
          .filter(m => ['INGRESO', 'VENTA'].includes(m.tipo.toString()))
          .reduce((sum, m) => sum + Number(m.monto), 0);
        
        const totalEgresos = cajasWithMovimientos.movimientos
          .filter(m => ['EGRESO', 'DEVOLUCION'].includes(m.tipo.toString()))
          .reduce((sum, m) => sum + Number(m.monto), 0);
        
        const saldoActual = Number(caja.saldoInicial) + totalIngresos - totalEgresos;

        return {
          ...caja,
          saldoActual,
          totalIngresos,
          totalEgresos,
          totalMovimientos: cajasWithMovimientos.movimientos.length
        };
      });
    } catch (error) {
      throw new BadRequestException('Error al obtener las cajas: ' + error.message);
    }
  }

  async findOne(id: number, usuarioId?: number, rolNombre?: string) {
    const caja = await this.prisma.caja.findUnique({
      where: { id },
      include: {
        sucursal: true,
        usuarioApertura: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolId: true
          }
        },
        usuarioCierre: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolId: true
          }
        },
        movimientos: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rolId: true
              }
            },
            orden: true
          },
          orderBy: {
            fechaHora: 'desc'
          }
        }
      } as any
    });

    if (!caja) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }

    // Verificar si el usuario tiene acceso a esta caja
    if (rolNombre === 'CAJERO' && usuarioId) {
      if (caja.usuarioAperturaId !== usuarioId) {
        throw new ForbiddenException(`No tienes permisos para acceder a esta caja`);
      }
    }

    // Calcular saldos
    const cajaWithMovimientos = caja as any;
    const totalIngresos = cajaWithMovimientos.movimientos
      .filter(m => ['INGRESO', 'VENTA'].includes(m.tipo.toString()))
      .reduce((sum, m) => sum + Number(m.monto), 0);
    
    const totalEgresos = cajaWithMovimientos.movimientos
      .filter(m => ['EGRESO', 'DEVOLUCION'].includes(m.tipo.toString()))
      .reduce((sum, m) => sum + Number(m.monto), 0);
    
    const saldoActual = Number(caja.saldoInicial) + totalIngresos - totalEgresos;

    return {
      ...caja,
      saldoActual,
      totalIngresos,
      totalEgresos,
      // Si la caja está cerrada, calcular diferencia
      ...(caja.estado === 'CERRADA' && {
        diferencia: Number(caja.saldoFinal) - saldoActual
      })
    };
  }

  async getMovimientosByCajaId(cajaId: number, usuarioId?: number, rolNombre?: string) {
    const caja = await this.prisma.caja.findUnique({
      where: { id: cajaId },
      include: {
        movimientos: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rolId: true
              }
            },
            orden: true
          },
          orderBy: {
            fechaHora: 'desc'
          }
        }
      } as any
    });

    if (!caja) {
      throw new NotFoundException(`Caja con ID ${cajaId} no encontrada`);
    }

    // Verificar si el usuario tiene acceso a esta caja
    if (rolNombre === 'CAJERO' && usuarioId) {
      if (caja.usuarioAperturaId !== usuarioId) {
        throw new ForbiddenException(`No tienes permisos para acceder a los movimientos de esta caja`);
      }
    }

    return (caja as any).movimientos;
  }

  // Método para verificar si un usuario tiene acceso a una caja específica
  async verificarAccesoCaja(cajaId: number, usuarioId: number, rolNombre: string): Promise<boolean> {
    // Si es administrador, siempre tiene acceso
    if (rolNombre === 'ADMIN') {
      return true;
    }

    // Si es cajero, verificar que la caja le pertenezca
    if (rolNombre === 'CAJERO') {
      const caja = await this.prisma.caja.findUnique({
        where: { id: cajaId }
      });

      if (!caja) {
        throw new NotFoundException(`Caja con ID ${cajaId} no encontrada`);
      }

      return caja.usuarioAperturaId === usuarioId;
    }

    return false;
  }
} 