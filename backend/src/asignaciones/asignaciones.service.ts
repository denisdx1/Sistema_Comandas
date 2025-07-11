import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAsignacionDto, UpdateAsignacionDto, AsignacionFilterDto } from './dto/asignacion.dto';

@Injectable()
export class AsignacionesService {
  constructor(private prisma: PrismaService) {}

  async create(createAsignacionDto: CreateAsignacionDto) {
    try {
      // Verificar que el bartender existe y tiene el rol correcto
      const bartender = await this.prisma.usuario.findUnique({
        where: { id: createAsignacionDto.bartenderId },
        include: { rol: true },
      });

      if (!bartender) {
        throw new NotFoundException(`Bartender con ID ${createAsignacionDto.bartenderId} no encontrado`);
      }

      if (bartender.rol.nombre !== 'BARTENDER' && bartender.rol.nombre !== 'ADMIN') {
        throw new BadRequestException('El usuario seleccionado no tiene permisos de bartender');
      }

      // Verificar que la caja existe y está abierta
      const caja = await this.prisma.caja.findUnique({
        where: { id: createAsignacionDto.cajaId },
      });

      if (!caja) {
        throw new NotFoundException(`Caja con ID ${createAsignacionDto.cajaId} no encontrada`);
      }

      if (caja.estado !== 'ABIERTA') {
        throw new BadRequestException('La caja debe estar abierta para realizar asignaciones');
      }

      // Si se especificó un mozo, verificar que existe y tiene el rol correcto
      if (createAsignacionDto.mozoId) {
        const mozo = await this.prisma.usuario.findUnique({
          where: { id: createAsignacionDto.mozoId },
          include: { rol: true },
        });

        if (!mozo) {
          throw new NotFoundException(`Mozo con ID ${createAsignacionDto.mozoId} no encontrado`);
        }

        if (mozo.rol.nombre !== 'MOZO' && mozo.rol.nombre !== 'ADMIN') {
          throw new BadRequestException('El usuario seleccionado no tiene permisos de mozo');
        }
      }

      // Desactivar asignaciones previas del bartender si están activas
      await this.prisma.asignacionTrabajo.updateMany({
        where: {
          bartenderId: createAsignacionDto.bartenderId,
          activa: true,
        },
        data: {
          activa: false,
        },
      });

      // Crear la nueva asignación
      const asignacion = await this.prisma.asignacionTrabajo.create({
        data: {
          bartenderId: createAsignacionDto.bartenderId,
          cajaId: createAsignacionDto.cajaId,
          ...(createAsignacionDto.mozoId && { mozoId: createAsignacionDto.mozoId }),
          activa: true,
        },
        include: {
          bartender: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            include: {
              sucursal: true,
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

      return asignacion;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear asignación: ${error.message}`);
    }
  }

  async findAll(filters: AsignacionFilterDto = {}) {
    try {
      const { bartenderId, mozoId, cajaId, activa } = filters;

      const whereClause: any = {};

      if (bartenderId) {
        whereClause.bartenderId = bartenderId;
      }

      if (mozoId) {
        whereClause.mozoId = mozoId;
      }

      if (cajaId) {
        whereClause.cajaId = cajaId;
      }

      if (activa !== undefined) {
        whereClause.activa = activa;
      }

      return this.prisma.asignacionTrabajo.findMany({
        where: whereClause,
        include: {
          bartender: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            include: {
              sucursal: true,
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new BadRequestException(`Error al obtener asignaciones: ${error.message}`);
    }
  }

  async findOne(id: number) {
    const asignacion = await this.prisma.asignacionTrabajo.findUnique({
      where: { id },
      include: {
        bartender: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        caja: {
          include: {
            sucursal: true,
            usuarioApertura: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  async update(id: number, updateAsignacionDto: UpdateAsignacionDto) {
    try {
      // Verificar que la asignación existe
      const asignacion = await this.prisma.asignacionTrabajo.findUnique({
        where: { id },
      });

      if (!asignacion) {
        throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
      }

      // Verificar bartender si se va a actualizar
      if (updateAsignacionDto.bartenderId) {
        const bartender = await this.prisma.usuario.findUnique({
          where: { id: updateAsignacionDto.bartenderId },
          include: { rol: true },
        });

        if (!bartender) {
          throw new NotFoundException(`Bartender con ID ${updateAsignacionDto.bartenderId} no encontrado`);
        }

        if (bartender.rol.nombre !== 'BARTENDER' && bartender.rol.nombre !== 'ADMIN') {
          throw new BadRequestException('El usuario seleccionado no tiene permisos de bartender');
        }
      }

      // Verificar mozo si se va a actualizar
      if (updateAsignacionDto.mozoId) {
        const mozo = await this.prisma.usuario.findUnique({
          where: { id: updateAsignacionDto.mozoId },
          include: { rol: true },
        });

        if (!mozo) {
          throw new NotFoundException(`Mozo con ID ${updateAsignacionDto.mozoId} no encontrado`);
        }

        if (mozo.rol.nombre !== 'MOZO' && mozo.rol.nombre !== 'ADMIN') {
          throw new BadRequestException('El usuario seleccionado no tiene permisos de mozo');
        }
      }

      // Verificar caja si se va a actualizar
      if (updateAsignacionDto.cajaId) {
        const caja = await this.prisma.caja.findUnique({
          where: { id: updateAsignacionDto.cajaId },
        });

        if (!caja) {
          throw new NotFoundException(`Caja con ID ${updateAsignacionDto.cajaId} no encontrada`);
        }

        if (caja.estado !== 'ABIERTA') {
          throw new BadRequestException('La caja debe estar abierta para realizar asignaciones');
        }
      }

      // Actualizar la asignación
      return this.prisma.asignacionTrabajo.update({
        where: { id },
        data: updateAsignacionDto,
        include: {
          bartender: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            include: {
              sucursal: true,
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al actualizar asignación: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      // Verificar que la asignación existe
      const asignacion = await this.prisma.asignacionTrabajo.findUnique({
        where: { id },
      });

      if (!asignacion) {
        throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
      }

      // Eliminar la asignación
      return this.prisma.asignacionTrabajo.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al eliminar asignación: ${error.message}`);
    }
  }

  async getAsignacionActivaBartender(bartenderId: number) {
    try {
      return this.prisma.asignacionTrabajo.findFirst({
        where: {
          bartenderId,
          activa: true,
        },
        include: {
          bartender: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            include: {
              sucursal: true,
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new BadRequestException(`Error al obtener asignación activa: ${error.message}`);
    }
  }

  async getAsignacionActivaMozo(mozoId: number) {
    try {
      return this.prisma.asignacionTrabajo.findFirst({
        where: {
          mozoId,
          activa: true,
        },
        include: {
          bartender: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            include: {
              sucursal: true,
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new BadRequestException(`Error al obtener asignación activa: ${error.message}`);
    }
  }

  async getAsignacionesActivasCaja(cajaId: number) {
    try {
      return this.prisma.asignacionTrabajo.findMany({
        where: {
          cajaId,
          activa: true,
        },
        include: {
          bartender: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            include: {
              sucursal: true,
              usuarioApertura: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new BadRequestException(`Error al obtener asignaciones activas: ${error.message}`);
    }
  }
} 