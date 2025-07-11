import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    // Obtener estadísticas generales
    const [
      totalOrdenes,
      ordenesActivas,
      totalProductos,
      totalUsuarios,
      ventasHoy,
      ordenesPorEstado
    ] = await Promise.all([
      // Total de órdenes
      this.prisma.orden.count(),

      // Órdenes activas (no entregadas)
      this.prisma.orden.count({
        where: {
          estado: {
            not: 'ENTREGADO'
          }
        }
      }),

      // Total de productos
      this.prisma.producto.count(),

      // Total de usuarios
      this.prisma.usuario.count(),

      // Ventas de hoy
      this.prisma.orden.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          estado: 'ENTREGADO'
        },
        include: {
          items: {
            include: {
              producto: true
            }
          }
        }
      }),

      // Órdenes por estado
      this.prisma.orden.groupBy({
        by: ['estado'],
        _count: {
          estado: true
        }
      })
    ]);

    // Calcular total de ventas del día
    const ventasDelDia = ventasHoy.reduce((total, orden) => {
      const totalOrden = orden.items.reduce((sum, item) => {
        return sum + (Number(item.producto?.precio) * item.cantidad);
      }, 0);
      return total + totalOrden;
    }, 0);

    // Calcular estadísticas por estado
    const estadisticas = ordenesPorEstado.reduce((acc, item) => {
      acc[item.estado] = item._count.estado;
      return acc;
    }, {} as Record<string, number>);

    return {
      ventasDelDia: ventasDelDia.toFixed(2),
      ordenesActivas,
      totalProductos,
      totalUsuarios,
      totalOrdenes,
      ordenesPendientes: estadisticas.PENDIENTE || 0,
      ordenesEnPreparacion: estadisticas.EN_PREPARACION || 0,
      ordenesListas: estadisticas.LISTO || 0,
      ordenesEntregadas: estadisticas.ENTREGADO || 0,
      ventasHoy: ventasHoy.length
    };
  }

  async getRecentOrders() {
    const ordenes = await this.prisma.orden.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          include: {
            producto: true
          }
        },
        mozo: {
          select: {
            nombre: true
          }
        }
      }
    });

    return ordenes.map(orden => {
      const total = orden.items.reduce((sum, item) => {
        return sum + (Number(item.producto?.precio) * item.cantidad);
      }, 0);

      return {
        id: orden.id,
        mozo: orden.mozo?.nombre || 'Sin asignar',
        items: orden.items.length,
        total: total.toFixed(2),
        estado: orden.estado,
        createdAt: orden.createdAt
      };
    });
  }

  async getRecentActivity() {
    // Obtener actividad reciente (solo órdenes por ahora)
    const ordenesRecientes = await this.prisma.orden.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        mozo: {
          select: {
            nombre: true
          }
        }
      }
    });

    // Crear actividades basadas en órdenes
    const actividades = ordenesRecientes.map(orden => ({
      tipo: 'orden',
      titulo: 'Nueva orden creada',
      descripcion: `${orden.mozo?.nombre || 'Usuario'} - Orden #${orden.id}`,
      fecha: orden.createdAt.toISOString(),
      estado: orden.estado
    }));

    return actividades;
  }
}
