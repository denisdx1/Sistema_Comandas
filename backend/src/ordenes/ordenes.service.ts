import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrdenDto, UpdateOrdenDto, CobrarOrdenDto } from './dto/orden.dto';
import { NotificacionesService } from './notificaciones.service';
import { OrdenesGateway } from './ordenes.gateway';
import { AsignacionesService } from '../asignaciones/asignaciones.service';
import { EstadoOrden } from '@prisma/client';
import { CombosService } from '../combos/combos.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class OrdenesService {
  constructor(
    private prisma: PrismaService,
    private notificacionesService: NotificacionesService,
    private ordenesGateway: OrdenesGateway,
    private asignacionesService: AsignacionesService
  ) {}

  async create(createOrdenDto: CreateOrdenDto, usuarioId: number) {
    // Validar que todos los ítems tengan un productoId, comboId o promocionId válido
    for (const item of createOrdenDto.items) {
      if (!item.productoId && !item.comboId && !item.promocionId && !item.promocionPersonalizada) {
        throw new BadRequestException('Cada ítem debe tener un productoId, comboId o promocionId');
      }
      
      if (item.productoId && !item.promocionPersonalizada) {
        // Verificar que el producto exista y tenga stock suficiente
        const producto = await this.prisma.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
        }

        if (producto.stock < item.cantidad) {
          throw new BadRequestException(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`);
        }
        
        // Verificar complementos si existen
        if (item.complementos && item.complementos.length > 0) {
          for (const complemento of item.complementos) {
            const compProd = await this.prisma.producto.findUnique({
              where: { id: complemento.productoId },
              include: {
                categoria: true
              }
            });
            
            if (!compProd) {
              throw new NotFoundException(`Complemento con ID ${complemento.productoId} no encontrado`);
            }
            
            if (compProd.stock < complemento.cantidad) {
              throw new BadRequestException(
                `Stock insuficiente para el complemento ${compProd.nombre}. ` + 
                `Disponible: ${compProd.stock}, Solicitado: ${complemento.cantidad}`
              );
            }
          }
        }
      } else if (item.comboId) {
        // Verificar que el combo exista y sus productos tengan stock suficiente
        const combo = await this.prisma.combo.findUnique({
          where: { id: item.comboId },
          include: {
            productos: {
              include: {
                producto: true,
              },
            },
          },
        });

        if (!combo) {
          throw new NotFoundException(`Combo con ID ${item.comboId} no encontrado`);
        }

        // Verificar stock de cada producto del combo
        for (const comboProducto of combo.productos) {
          const stockRequerido = comboProducto.cantidad * item.cantidad;
          if (comboProducto.producto.stock < stockRequerido) {
            throw new BadRequestException(
              `Stock insuficiente para ${comboProducto.producto.nombre} en el combo ${combo.nombre}. ` +
              `Disponible: ${comboProducto.producto.stock}, Requerido: ${stockRequerido}`
            );
          }
        }
      } else if (item.promocionId) {
        // Verificar que la promoción exista y esté activa
        const promocion = await this.prisma.promocionTragos.findUnique({
          where: { id: item.promocionId },
          include: {
            productos: {
              include: {
                producto: true
              }
            }
          }
        });

        if (!promocion) {
          throw new NotFoundException(`Promoción con ID ${item.promocionId} no encontrada`);
        }

        if (!promocion.activo) {
          throw new BadRequestException(`La promoción ${promocion.nombre} no está activa`);
        }

        // Verificar que haya suficientes productos disponibles para la promoción
        if (promocion.productos.length < promocion.cantidadTragos) {
          throw new BadRequestException(`La promoción ${promocion.nombre} no tiene suficientes tragos disponibles`);
        }

        // Verificar stock de cada producto en la promoción
        for (const promocionProducto of promocion.productos) {
          const stockRequerido = item.cantidad; // Cada promoción usa 1 unidad de cada producto
          if (promocionProducto.producto.stock < stockRequerido) {
            throw new BadRequestException(
              `Stock insuficiente para ${promocionProducto.producto.nombre} en la promoción ${promocion.nombre}. ` +
              `Disponible: ${promocionProducto.producto.stock}, Requerido: ${stockRequerido}`
            );
          }
        }
      } else if (item.promocionPersonalizada) {
        // No necesitamos validar nada más para promociones personalizadas en esta etapa
        // El código que intentaba crear un item de orden aquí estaba incorrecto
        // porque la orden aún no existe
      }
    }

    try {
      // Crear la orden
      const orden = await this.prisma.orden.create({
        data: {
          estado: 'PENDIENTE',
          mozoId: usuarioId,
          notas: createOrdenDto.notas,
         
        },
      });

      // Crear los ítems y ajustar el stock
      for (const item of createOrdenDto.items) {
        if (item.productoId) {
          // Crear ítem de producto regular
          await this.prisma.ordenItem.create({
            data: {
              ordenId: orden.id,
              productoId: item.productoId,
              cantidad: item.cantidad,
            },
          });

          // Actualizar stock del producto
          

          // Registrar el movimiento de inventario para el producto
         

          // Actualizar stock
          
          
          // Procesar complementos si existen
          if (item.complementos && item.complementos.length > 0) {
            for (const complemento of item.complementos) {
              // Obtener información del producto complemento para su nombre
              const compProducto = await this.prisma.producto.findUnique({
                where: { id: complemento.productoId },
              });
              
              // Determinar el tipo de complemento
              const tipoComplemento = complemento.tipoComplemento || 'BEBIDA_PARA_LICOR';
              
              // Crear ítem de complemento con precio 0
              await this.prisma.ordenItem.create({
                data: {
                  ordenId: orden.id,
                  productoId: complemento.productoId,
                  cantidad: complemento.cantidad,
                  precio: 0, // Los complementos no tienen costo
                  esComplemento: true, // Marcar explícitamente como complemento
                  tipoComplemento: tipoComplemento, // Usar el nuevo campo
                  productoAsociadoId: item.productoId, // Asociar con el producto principal
                  nombre: `Complemento para producto #${item.productoId}: ${compProducto?.nombre || 'Sin nombre'}`,
                },
              });
              
              // Obtener el complemento
              const complementoProducto = await this.prisma.producto.findUnique({
                where: { id: complemento.productoId },
              });
              
              // Registrar el movimiento de inventario para el complemento
              
              
              // Actualizar stock del complemento
              
            }
          }
        } else if (item.comboId) {
          // Crear ítem de combo sin usar comboId directamente
          await this.prisma.$executeRaw`
            INSERT INTO "OrdenItem" ("ordenId", "comboId", "cantidad")
            VALUES (${orden.id}, ${item.comboId}, ${item.cantidad})
          `;

          // Obtener el combo con sus productos
          const combo = await this.prisma.combo.findUnique({
            where: { id: item.comboId },
            include: {
              productos: {
                include: {
                  producto: true,
                },
              },
            },
          });

          if (combo) {
            // Actualizar stock de cada producto del combo
            for (const comboProducto of combo.productos) {
              const cantidadTotal = comboProducto.cantidad * item.cantidad;
              const producto = comboProducto.producto;
              
              // Ya no registramos movimientos de inventario al crear la orden
              // Los movimientos se registrarán al cobrar la orden
              
              // Tampoco actualizamos el stock al crear la orden
              // El stock se actualizará al cobrar la orden
            }
          }
        } else if (item.promocionId) {
          // Crear ítem de promoción
          await this.prisma.ordenItem.create({
            data: {
              ordenId: orden.id,
              promocionId: item.promocionId,
              cantidad: item.cantidad,
            },
          });

          // Obtener la promoción con sus productos
          const promocion = await this.prisma.promocionTragos.findUnique({
            where: { id: item.promocionId },
            include: {
              productos: {
                include: {
                  producto: true
                }
              }
            }
          });

          if (promocion) {
            // Actualizar stock de cada producto de la promoción
            for (const promocionProducto of promocion.productos) {
              const producto = promocionProducto.producto;
              
              // Ya no registramos movimientos de inventario al crear la orden
              // Los movimientos se registrarán al cobrar la orden
              
              // Tampoco actualizamos el stock al crear la orden
              // El stock se actualizará al cobrar la orden
            }
          }
        } else if (item.promocionPersonalizada) {
          // Crear ítem para promoción personalizada
          await this.prisma.ordenItem.create({
            data: {
              ordenId: orden.id,
              cantidad: item.cantidad,
              nombre: item.nombre || 'Promoción personalizada',
              precio: item.precio || 0,
              esPromocionPersonalizada: true
            },
          });
          
          // No restamos stock automáticamente en promociones personalizadas
          // ya que no sabemos qué productos específicos se están usando
          // Esto debe manejarse manualmente o con un proceso adicional
        }
      }

      // Retornar la orden con sus ítems
      const ordenCompleta = await this.prisma.orden.findUnique({
        where: { id: orden.id },
        include: {
          items: {
            include: {
              producto: {
                include: {
                  categoria: true,
                },
              },
              combo: true,
              promocion: true
            }
          },
          mozo: true,
        },
      });

      // Emitir evento de nueva orden por WebSocket
      this.ordenesGateway.emitNuevaOrden(ordenCompleta);
      
      // SOLUCIÓN DIRECTA: Notificar explícitamente a los bartenders
      try {
        // Verificar que ordenCompleta no sea null
        if (ordenCompleta) {
          // Verificar si hay items de tragos en la orden
          const tieneTragos = ordenCompleta.items.some(item => 
            (item.producto?.categoria?.nombre?.toLowerCase() === 'tragos') || 
            item.promocion !== null // Considerar promociones como tragos
          );
          
          if (tieneTragos) {
            
            // Filtrar solo los items de tragos y promociones
            const itemsTragos = ordenCompleta.items.filter(item => 
              (item.producto?.categoria?.nombre?.toLowerCase() === 'tragos') ||
              item.promocion !== null
            );
            
            // Preparar una versión filtrada de la orden solo con tragos
            const ordenTragosFiltrada = {
              ...ordenCompleta,
              items: itemsTragos,
              _filtrado: true
            };
            
            // Emitir directamente a todos los clientes el evento especial
            this.ordenesGateway.server.emit('nueva_orden_tragos', ordenTragosFiltrada);
            
            // Para seguridad adicional, también emitir otro evento general
            this.ordenesGateway.server.emit('bartender_alerta', {
              mensaje: `Nueva orden #${orden.id} con ${itemsTragos.length} tragos requiere atención`,
              ordenId: orden.id,
              items: itemsTragos.length,
              timestamp: new Date().toISOString()
            });
          } else {
          }
        } else {
        }
      } catch (error) {
        console.error('Error al enviar notificación a bartenders:', error);
      }
      
      // También usar el servicio de notificaciones como respaldo
      this.notificacionesService.notificarNuevaOrden(ordenCompleta);

      return ordenCompleta;
    } catch (error) {
      // Manejar errores
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  async findAll(rol?: string, includeEntregado: boolean = false, usuarioId?: number) {
    console.log('=== INICIO FIND ALL ORDENES ===');
    console.log('Parámetros recibidos:');
    console.log('- Rol:', rol);
    console.log('- Tipo de rol:', typeof rol);
    console.log('- Incluir entregados:', includeEntregado);
    console.log('- ID de usuario:', usuarioId);

    // Si el rol es BARTENDER (en cualquier caso), normalizarlo para consistencia
    if (rol && rol.toUpperCase() === 'BARTENDER') {
      rol = 'BARTENDER';
      console.log('Rol normalizado a BARTENDER');
    }

    // Si el rol es CAJERO, normalizarlo
    if (rol && rol.toUpperCase() === 'CAJERO') {
      rol = 'CAJERO';
      console.log('Rol normalizado a CAJERO');
    }
    
    // Si el rol es MOZO, normalizarlo
    if (rol && rol.toUpperCase() === 'MOZO') {
      rol = 'MOZO';
      console.log('Rol normalizado a MOZO');
    }

    // Si es CAJERO, filtrar por órdenes asociadas a su caja
    let filtrarPorCajero = false;
    let cajaIdDelCajero: number | null = null;
    let mozoIdsAsignadosACajero: number[] = [];
    
    if (rol === 'CAJERO' && usuarioId) {
      filtrarPorCajero = true;
      
      // Buscar asignación activa para el cajero
      try {
        // Buscar la caja abierta por este cajero
        const cajaAbierta = await this.prisma.caja.findFirst({
          where: {
            usuarioAperturaId: usuarioId,
            estado: 'ABIERTA'
          }
        });
        
        if (cajaAbierta) {
          cajaIdDelCajero = cajaAbierta.id;
          console.log(`Cajero ${usuarioId} tiene asignada la caja ${cajaIdDelCajero}`);
          
          // Buscar todos los mozos asignados a esta caja
          const asignacionesCaja = await this.asignacionesService.getAsignacionesActivasCaja(cajaIdDelCajero);
          
          if (asignacionesCaja && asignacionesCaja.length > 0) {
            // Extraer los IDs de los mozos asignados a esta caja
            mozoIdsAsignadosACajero = asignacionesCaja
              .filter(asignacion => asignacion.mozoId !== null)
              .map(asignacion => asignacion.mozoId!)
              .filter((id, index, self) => self.indexOf(id) === index); // Eliminar duplicados
            
            console.log(`Mozos asignados a la caja ${cajaIdDelCajero}:`, mozoIdsAsignadosACajero);
          } else {
            console.log(`No se encontraron asignaciones activas para la caja ${cajaIdDelCajero}`);
          }
        } else {
          console.log(`Cajero ${usuarioId} no tiene caja abierta asignada`);
        }
      } catch (error) {
        console.error('Error al buscar asignación para cajero:', error);
      }
    }

    // Si el rol no está definido o es nulo, intentamos obtener todas las órdenes
    if (!rol) {
      console.log('Rol no definido, mostrando todas las órdenes');
    }

    // Si el rol es una cadena vacía, la tratamos como undefined
    if (rol === '') {
      console.log('Rol es cadena vacía, tratando como undefined');
      rol = undefined;
    }

    // Convertir rol a mayúsculas si existe
    const rolUpperCase = rol ? rol.toUpperCase() : undefined;
    console.log('Rol en mayúsculas:', rolUpperCase);

    // Si es BARTENDER, necesitamos obtener sus asignaciones activas
    let mozoIdsAsignados: number[] = [];
    let cajaIdsAsignados: number[] = [];
    let cajeroIdsAsignados: number[] = [];
    let cajaIdAsignado: number | null = null;
    let tieneAsignacionesActivas = false;
    
    if (rolUpperCase === 'BARTENDER' && usuarioId) {
      try {
        console.log('Buscando asignaciones activas para el bartender:', usuarioId);
        const asignacionBartender = await this.asignacionesService.getAsignacionActivaBartender(usuarioId);
        
        if (asignacionBartender) {
          tieneAsignacionesActivas = true;
          console.log('Asignación encontrada:', asignacionBartender);
          if (asignacionBartender.mozoId) {
            mozoIdsAsignados.push(asignacionBartender.mozoId);
            console.log('Mozo asignado:', asignacionBartender.mozoId);
          }
          
          cajaIdAsignado = asignacionBartender.cajaId;
          if (cajaIdAsignado) {
            cajaIdsAsignados.push(cajaIdAsignado);
            console.log('Caja asignada:', cajaIdAsignado);
          }
          
          // También obtener todas las asignaciones activas para este bartender (para múltiples mozos)
          const todasLasAsignaciones = await this.asignacionesService.findAll({
            bartenderId: usuarioId,
            activa: true
          });
          
          if (todasLasAsignaciones && todasLasAsignaciones.length > 0) {
            // Obtener IDs únicos de mozos asignados
            const mozoIdsFromAssignments: number[] = [];
            const cajaIdsFromAssignments: number[] = [];
            
            todasLasAsignaciones.forEach(a => {
              // Agregar mozos asignados
              if (a.mozoId !== null && a.mozoId !== undefined) {
                if (!mozoIdsFromAssignments.includes(a.mozoId)) {
                  mozoIdsFromAssignments.push(a.mozoId);
                }
              }
              
              // Agregar cajas asignadas
              if (a.cajaId !== null && a.cajaId !== undefined) {
                if (!cajaIdsFromAssignments.includes(a.cajaId)) {
                  cajaIdsFromAssignments.push(a.cajaId);
                }
              }
            });
            
            mozoIdsAsignados = mozoIdsFromAssignments;
            cajaIdsAsignados = cajaIdsFromAssignments;
            
            console.log('Mozos asignados (total):', mozoIdsAsignados);
            console.log('Cajas asignadas (total):', cajaIdsAsignados);
            
            // Obtener los cajeros asignados a estas cajas
            if (cajaIdsAsignados.length > 0) {
              console.log('Buscando cajeros asociados a las cajas asignadas');
              const cajasAbiertas = await this.prisma.caja.findMany({
                where: {
                  id: { in: cajaIdsAsignados },
                  estado: 'ABIERTA'
                }
              });
              
              // Extraer los IDs de los cajeros (usuarios que abrieron las cajas)
              cajeroIdsAsignados = cajasAbiertas
                .filter(caja => caja.usuarioAperturaId !== null)
                .map(caja => caja.usuarioAperturaId)
                .filter((id): id is number => id !== null);
              
              console.log(`Encontradas ${cajasAbiertas.length} cajas abiertas asignadas`);
              console.log('Cajeros asignados a estas cajas:', cajeroIdsAsignados);
            }
          }
        } else {
          console.log('No se encontraron asignaciones activas para el bartender');
          
          // Si no hay asignaciones activas para el bartender, no debería ver ninguna orden
          if (rolUpperCase === 'BARTENDER') {
            console.log('El bartender no tiene asignaciones activas. Retornando lista vacía.');
            return [];
          }
        }
      } catch (error) {
        console.error('Error al buscar asignaciones del bartender:', error);
      }
    }

    console.log('Obteniendo todas las órdenes de la base de datos...');
    const ordenes = await this.prisma.orden.findMany({
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
            combo: true,
          },
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        movimientosCaja: {
          include: {
            caja: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total de órdenes obtenidas de la DB: ${ordenes.length}`);
    
    // Verificar que el campo esComplemento esté presente en cada item de cada orden
    ordenes.forEach(orden => {
      if (orden.items && orden.items.length > 0) {
        orden.items.forEach(item => {
          // Asegurarse de que el campo esComplemento esté disponible para el frontend
          console.log(`Orden ${orden.id} - Item ${item.id} - esComplemento:`, item.esComplemento);
        });
      }
    });

    // Filtrar órdenes entregadas si es necesario
    let ordenesActivasTotal = ordenes;
    if (!includeEntregado) {
      ordenesActivasTotal = ordenes.filter(orden => orden.estado !== 'ENTREGADO');
      console.log(`Filtradas ${ordenes.length - ordenesActivasTotal.length} órdenes entregadas`);
    }
    
    // Si es MOZO, filtrar para mostrar solo sus propias órdenes
    if (rolUpperCase === 'MOZO' && usuarioId) {
      console.log(`Filtrando órdenes para mostrar solo las del mozo ${usuarioId}`);
      ordenesActivasTotal = ordenesActivasTotal.filter(orden => orden.mozoId === usuarioId);
      console.log(`Total de órdenes propias del mozo: ${ordenesActivasTotal.length}`);
      
      // Devolver directamente las órdenes del mozo
      return ordenesActivasTotal;
    }

    // Si es cajero con caja asignada, filtrar solo las órdenes de su caja y mozos asignados
    if (filtrarPorCajero && cajaIdDelCajero) {
      console.log(`Filtrando órdenes para el cajero con caja ID: ${cajaIdDelCajero}`);
      
      // LÓGICA MEJORADA: Ahora filtramos por:
      // 1. Órdenes con movimientos en la caja del cajero
      // 2. Órdenes creadas por los mozos asignados a esa caja
      // 3. Órdenes creadas por el propio cajero
      ordenesActivasTotal = ordenesActivasTotal.filter(orden => {
        // 1. Si la orden tiene movimientos en la caja del cajero, la incluimos
        if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
          if (orden.movimientosCaja.some(mov => mov.cajaId === cajaIdDelCajero)) {
            return true;
          }
        }
        
        // 2. Si la orden fue creada por un mozo asignado a esta caja, la incluimos
        if (orden.mozoId && mozoIdsAsignadosACajero.includes(orden.mozoId)) {
          return true;
        }
        
        // 3. Si la orden fue creada por el propio cajero, la incluimos
        if (orden.mozoId === usuarioId) {
          return true;
        }
        
        // Si no cumple ninguna condición, no la incluimos
        return false;
      });
      
      console.log(`Total de órdenes filtradas para el cajero: ${ordenesActivasTotal.length}`);
    }

    console.log(`Total de órdenes activas (sin filtrar por rol): ${ordenesActivasTotal.length}`);

    // Si no es BARTENDER, devolver todas las órdenes (excepto entregadas si aplica)
    if (rolUpperCase !== 'BARTENDER') {
      console.log('Devolviendo órdenes sin filtrar por rol');
      return ordenesActivasTotal;
    }

    // PROCESAMIENTO ESPECÍFICO PARA BARTENDER
    console.log('=== INICIANDO FILTRADO ESPECIAL PARA BARTENDER ===');

    // PASO 1: Filtrar órdenes por mozo asignado al bartender O por caja asignada O por cajero asignado
    let ordenesFiltradas: typeof ordenesActivasTotal = [];
    
    // Primero filtramos por mozos asignados
    if (mozoIdsAsignados.length > 0) {
      console.log(`Filtrando órdenes para BARTENDER por mozos asignados: ${mozoIdsAsignados.join(', ')}`);
      const ordenesDeMozosAsignados = ordenesActivasTotal.filter(orden => 
        orden.mozoId && mozoIdsAsignados.includes(orden.mozoId)
      );
      console.log(`Después de filtrar por mozos asignados quedan ${ordenesDeMozosAsignados.length} órdenes`);
      
      // Añadir estas órdenes al resultado
      ordenesFiltradas = [...ordenesDeMozosAsignados];
    }
    
    // Luego filtramos por cajas asignadas (para incluir órdenes de cajeros asignados)
    if (cajaIdsAsignados.length > 0) {
      console.log(`Filtrando órdenes para BARTENDER por cajas asignadas: ${cajaIdsAsignados.join(', ')}`);
      
      // Obtener órdenes relacionadas con las cajas asignadas (a través de movimientos)
      const ordenesDeCajasAsignadas = ordenesActivasTotal.filter(orden => {
        if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
          return orden.movimientosCaja.some(mov => 
            mov.cajaId && cajaIdsAsignados.includes(mov.cajaId)
          );
        }
        return false;
      });
      
      console.log(`Órdenes con movimientos en cajas asignadas: ${ordenesDeCajasAsignadas.length}`);
      
      // Combinar las órdenes sin duplicados (usando Set para asegurar IDs únicos)
      const ordenesIds = new Set(ordenesFiltradas.map(o => o.id));
      
      // Añadir sólo las órdenes de cajas que no estén ya incluidas
      ordenesDeCajasAsignadas.forEach(orden => {
        if (!ordenesIds.has(orden.id)) {
          ordenesFiltradas.push(orden);
          ordenesIds.add(orden.id);
        }
      });
      
      console.log(`Después de añadir órdenes de cajas asignadas: ${ordenesFiltradas.length}`);
    }
    
    // Filtrar también por cajeros asignados (usuarios que abrieron las cajas)
    if (cajeroIdsAsignados.length > 0) {
      console.log(`Filtrando órdenes para BARTENDER por cajeros asignados: ${cajeroIdsAsignados.join(', ')}`);
      
      // Incluir órdenes creadas por estos cajeros
      const ordenesDeCajerosAsignados = ordenesActivasTotal.filter(orden => 
        // Un cajero puede crear órdenes directamente (actuando como mozo)
        orden.mozoId && cajeroIdsAsignados.includes(orden.mozoId)
      );
      
      console.log(`Órdenes creadas por cajeros asignados: ${ordenesDeCajerosAsignados.length}`);
      
      // Combinar sin duplicados
      const ordenesIds = new Set(ordenesFiltradas.map(o => o.id));
      
      // Añadir sólo las órdenes nuevas
      ordenesDeCajerosAsignados.forEach(orden => {
        if (!ordenesIds.has(orden.id)) {
          ordenesFiltradas.push(orden);
          ordenesIds.add(orden.id);
        }
      });
      
      console.log(`Después de añadir órdenes de cajeros asignados: ${ordenesFiltradas.length}`);
    }
    
    // Si no hay órdenes después del filtrado y el bartender tiene asignaciones, retornar lista vacía
    if (ordenesFiltradas.length === 0 && tieneAsignacionesActivas) {
      console.log('No hay órdenes para los mozos o cajeros asignados a este bartender');
      return [];
    } else if (!tieneAsignacionesActivas) {
      // El bartender no tiene asignaciones activas, no debe ver órdenes
      console.log('Bartender sin asignaciones activas, retornando lista vacía');
      return [];
    }
    
    // Actualizar ordenesActivasTotal para el siguiente paso del filtrado
    ordenesActivasTotal = ordenesFiltradas;
    
    // PASO 2: Buscar la categoría "Tragos"
    console.log('Buscando categoría Tragos...');
    const categoriaTragos = await this.prisma.categoria.findFirst({
      where: {
        nombre: {
          equals: 'Tragos',
          mode: 'insensitive'
        }
      }
    });

    if (!categoriaTragos) {
      console.log('ADVERTENCIA: No se encontró la categoría Tragos. Buscando por nombre en categorías...');
      
      // Filtrar órdenes que contengan productos con categoría "Tragos" (búsqueda insensitiva)
      const ordenesBartenderPorNombre = ordenesActivasTotal
        .map(orden => {
          // Filtrar items por nombre de categoría que contenga "tragos"
          const itemsFiltrados = orden.items.filter(item => 
            item.producto?.categoria && 
            item.producto?.categoria.nombre && 
            item.producto?.categoria.nombre.toLowerCase().includes('tragos')
          );
          
          if (itemsFiltrados.length > 0) {
            return {
              ...orden,
              items: itemsFiltrados,
              _filtroBartender: true
            };
          }
          return null;
        })
        .filter(orden => orden !== null) as any[];
      
      console.log(`Órdenes filtradas por nombre de categoría: ${ordenesBartenderPorNombre.length}`);
      if (ordenesBartenderPorNombre.length > 0) {
        console.log('IDs de órdenes filtradas:', ordenesBartenderPorNombre.map(o => o.id).join(', '));
      } else {
        console.log('No se encontraron órdenes con productos de categoría similar a "Tragos"');
      }
      
      console.log('=== FIN FIND ALL ORDENES (BARTENDER SIN CATEGORÍA) ===');
      return ordenesBartenderPorNombre;
    }

    console.log('Categoría Tragos encontrada:', categoriaTragos);

    // Filtrar todas las órdenes activas para el bartender
    console.log('Filtrando órdenes para mostrar solo los items de la categoría Tragos...');
    const ordenesBartender = ordenesActivasTotal
      .map(orden => {
        // Filtrar por ID de categoría
        const itemsFiltrados = orden.items.filter(item => 
          item.producto?.categoriaId === categoriaTragos.id ||
          (item.producto?.categoria?.nombre && 
           item.producto?.categoria?.nombre.toLowerCase() === 'tragos')
        );
        
        if (itemsFiltrados.length > 0) {
          return {
            ...orden,
            items: itemsFiltrados,
            _filtroBartender: true
          };
        }
        return null;
      })
      .filter(orden => orden !== null) as any[];

    console.log(`Órdenes filtradas para BARTENDER: ${ordenesBartender.length}`);
    if (ordenesBartender.length > 0) {
      console.log('IDs de órdenes filtradas:', ordenesBartender.map(o => o.id).join(', '));
    } else {
      console.log('No se encontraron órdenes con productos de categoría Tragos');
    }
    
    console.log('=== FIN FIND ALL ORDENES (BARTENDER) ===');
    return ordenesBartender;
  }

  async findOne(id: number) {
    const orden = await this.prisma.orden.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
            combo: true,
          },
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }
    
    // Asegurarse de que todos los campos de los items estén incluidos en la respuesta
    if (orden.items) {
      console.log('Items de la orden encontrados:', orden.items.length);
      // Verificar que el campo esComplemento esté presente en cada item
      orden.items.forEach(item => {
        // Asegurarse de que el campo esComplemento esté disponible para el frontend
        console.log(`Item ${item.id} - esComplemento:`, item.esComplemento);
      });
    }

    // Obtener la asignación activa del mozo
    const asignacionMozo = await this.asignacionesService.getAsignacionActivaMozo(orden.mozoId);

    // Añadir información de asignación a la respuesta
    return {
      ...orden,
      asignacion: asignacionMozo || null
    };
  }

  async update(id: number, updateOrdenDto: UpdateOrdenDto) {
    try {
      const orden = await this.prisma.orden.update({
        where: { id },
        data: {
          estado: updateOrdenDto.estado,
        },
        include: {
          items: {
            include: {
              producto: {
                include: {
                  categoria: true,
                },
              },
              combo: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      // Notificar actualización de estado
      this.notificacionesService.notificarActualizacionEstado(orden);
      
      // Emitir evento de actualización usando WebSocket
      this.ordenesGateway.emitActualizacionOrden(orden);

      return orden;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }
      throw error;
    }
  }

  async findByMozo(mozoId: number) {
    return await this.prisma.orden.findMany({
      where: { mozoId },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
            combo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByEstado(estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO', rol?: string, usuarioId?: number) {
    console.log('Buscando órdenes por estado:', { estado, rol });

    // Normalizar rol a mayúsculas si existe
    if (rol) {
      rol = rol.toUpperCase();
      console.log('Rol normalizado:', rol);
    }

    // Si es MOZO, solo mostrar sus propias órdenes
    if (rol === 'MOZO' && usuarioId) {
      console.log(`Filtrando órdenes del estado ${estado} solo para el mozo ${usuarioId}`);
      
      const ordenesDelMozo = await this.prisma.orden.findMany({
        where: { 
          estado,
          mozoId: usuarioId 
        },
        include: {
          items: {
            include: {
              producto: {
                include: {
                  categoria: true,
                },
              },
              combo: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          movimientosCaja: {
            include: {
              caja: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`Se encontraron ${ordenesDelMozo.length} órdenes del mozo con estado ${estado}`);
      return ordenesDelMozo;
    }

    // Si es BARTENDER, necesitamos obtener sus asignaciones activas
    let mozoIdsAsignados: number[] = [];
    let cajaIdsAsignados: number[] = [];
    let cajeroIdsAsignados: number[] = [];
    let tieneAsignacionesActivas = false;
    
    if (rol === 'BARTENDER' && usuarioId) {
      try {
        console.log('Buscando asignaciones activas para el bartender:', usuarioId);
        const asignacionBartender = await this.asignacionesService.getAsignacionActivaBartender(usuarioId);
        
        if (asignacionBartender) {
          tieneAsignacionesActivas = true;
          console.log('Asignación encontrada:', asignacionBartender);
          if (asignacionBartender.mozoId) {
            mozoIdsAsignados.push(asignacionBartender.mozoId);
          }
          
          // Añadir la caja asignada
          if (asignacionBartender.cajaId) {
            cajaIdsAsignados.push(asignacionBartender.cajaId);
          }
          
          // También obtener todas las asignaciones activas para este bartender (para múltiples mozos)
          const todasLasAsignaciones = await this.asignacionesService.findAll({
            bartenderId: usuarioId,
            activa: true
          });
          
          if (todasLasAsignaciones && todasLasAsignaciones.length > 0) {
            // Obtener IDs únicos de mozos asignados
            const mozoIdsFromAssignments: number[] = [];
            const cajaIdsFromAssignments: number[] = [];
            
            todasLasAsignaciones.forEach(a => {
              // Agregar mozos asignados
              if (a.mozoId !== null && a.mozoId !== undefined) {
                if (!mozoIdsFromAssignments.includes(a.mozoId)) {
                  mozoIdsFromAssignments.push(a.mozoId);
                }
              }
              
              // Agregar cajas asignadas
              if (a.cajaId !== null && a.cajaId !== undefined) {
                if (!cajaIdsFromAssignments.includes(a.cajaId)) {
                  cajaIdsFromAssignments.push(a.cajaId);
                }
              }
            });
            
            mozoIdsAsignados = mozoIdsFromAssignments;
            cajaIdsAsignados = cajaIdsFromAssignments;
            
            console.log('Mozos asignados (total):', mozoIdsAsignados);
            console.log('Cajas asignadas (total):', cajaIdsAsignados);
            
            // Obtener los cajeros asignados a estas cajas
            if (cajaIdsAsignados.length > 0) {
              console.log('Buscando cajeros asociados a las cajas asignadas');
              const cajasAbiertas = await this.prisma.caja.findMany({
                where: {
                  id: { in: cajaIdsAsignados },
                  estado: 'ABIERTA'
                }
              });
              
              // Extraer los IDs de los cajeros (usuarios que abrieron las cajas)
              cajeroIdsAsignados = cajasAbiertas
                .filter(caja => caja.usuarioAperturaId !== null)
                .map(caja => caja.usuarioAperturaId)
                .filter((id): id is number => id !== null);
              
              console.log(`Encontradas ${cajasAbiertas.length} cajas abiertas asignadas`);
              console.log('Cajeros asignados a estas cajas:', cajeroIdsAsignados);
            }
          }
        } else {
          console.log('No se encontraron asignaciones activas para el bartender');
          
          // Si no hay asignaciones activas para el bartender, no debería ver ninguna orden
          if (rol === 'BARTENDER') {
            console.log('El bartender no tiene asignaciones activas. Retornando lista vacía.');
            return [];
          }
        }
      } catch (error) {
        console.error('Error al buscar asignaciones del bartender:', error);
      }
    }

    const ordenes = await this.prisma.orden.findMany({
      where: { estado },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
            combo: true,
          },
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        movimientosCaja: {
          include: {
            caja: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (rol === 'BARTENDER') {
      console.log('Filtrando órdenes por estado para BARTENDER');

      // PASO 1: Combinar filtrado por mozos y cajas asignadas
      let ordenesFiltradas: typeof ordenes = [];
      
      // Filtrar por mozos asignados
      if (mozoIdsAsignados.length > 0) {
        console.log('Filtrando órdenes por mozos asignados:', mozoIdsAsignados);
        const ordenesDeMozosAsignados = ordenes.filter(orden => 
          orden.mozoId && mozoIdsAsignados.includes(orden.mozoId)
        );
        console.log('Órdenes filtradas por asignaciones de mozo:', ordenesDeMozosAsignados.length);
        
        // Añadir al resultado
        ordenesFiltradas = [...ordenesDeMozosAsignados];
      }
      
      // Filtrar por cajas asignadas
      if (cajaIdsAsignados.length > 0) {
        console.log('Filtrando órdenes por cajas asignadas:', cajaIdsAsignados);
        
        // Obtener órdenes relacionadas con las cajas asignadas
        const ordenesDeCajasAsignadas = ordenes.filter(orden => {
          if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
            return orden.movimientosCaja.some(mov => 
              mov.cajaId && cajaIdsAsignados.includes(mov.cajaId)
            );
          }
          return false;
        });
        
        console.log('Órdenes filtradas por cajas asignadas:', ordenesDeCajasAsignadas.length);
        
        // Combinar sin duplicados
        const ordenesIds = new Set(ordenesFiltradas.map(o => o.id));
        
        ordenesDeCajasAsignadas.forEach(orden => {
          if (!ordenesIds.has(orden.id)) {
            ordenesFiltradas.push(orden);
            ordenesIds.add(orden.id);
          }
        });
      }
      
      // Filtrar también por cajeros asignados
      if (cajeroIdsAsignados.length > 0) {
        console.log('Filtrando órdenes por cajeros asignados:', cajeroIdsAsignados);
        
        // Incluir órdenes creadas por estos cajeros
        const ordenesDeCajerosAsignados = ordenes.filter(orden => 
          // Un cajero puede crear órdenes directamente (actuando como mozo)
          orden.mozoId && cajeroIdsAsignados.includes(orden.mozoId)
        );
        
        console.log('Órdenes creadas por cajeros asignados:', ordenesDeCajerosAsignados.length);
        
        // Combinar sin duplicados
        const ordenesIds = new Set(ordenesFiltradas.map(o => o.id));
        
        // Añadir sólo las órdenes nuevas
        ordenesDeCajerosAsignados.forEach(orden => {
          if (!ordenesIds.has(orden.id)) {
            ordenesFiltradas.push(orden);
            ordenesIds.add(orden.id);
          }
        });
      }
      
      // Si no hay órdenes después del filtrado, retornar lista vacía
      if (ordenesFiltradas.length === 0) {
        if (tieneAsignacionesActivas) {
          console.log('No hay órdenes por estado para los mozos o cajeros asignados a este bartender');
        } else {
          console.log('Bartender sin asignaciones activas, retornando lista vacía');
        }
        return [];
      }
      
      // PASO 2: Buscar la categoría "Tragos"
      const categoriaTragos = await this.prisma.categoria.findFirst({
        where: {
          nombre: {
            equals: 'Tragos',
            mode: 'insensitive'
          }
        }
      });

      if (!categoriaTragos) {
        console.log('No se encontró la categoría Tragos');
        return [];
      }

      console.log('Categoría Tragos encontrada:', categoriaTragos);

      // Filtrar las órdenes para mostrar solo los items de la categoría Tragos
      const ordenesFiltradas2 = ordenesFiltradas.map(orden => ({
        ...orden,
        items: orden.items.filter(item => item.producto?.categoriaId === categoriaTragos.id)
      })).filter(orden => orden.items.length > 0);

      console.log('Órdenes filtradas por estado para BARTENDER:', ordenesFiltradas2.length);
      return ordenesFiltradas2;
    } else if (rol === 'CAJERO' && usuarioId) {
      // Implementar lógica de filtrado para CAJERO por estado
      // (similar a la implementada en findAll)
      console.log('Filtrando órdenes por estado para CAJERO');
      
      // Buscar la caja asignada al cajero
      const cajaAbierta = await this.prisma.caja.findFirst({
        where: {
          usuarioAperturaId: usuarioId,
          estado: 'ABIERTA'
        }
      });
      
      if (!cajaAbierta) {
        console.log('Cajero sin caja abierta asignada, mostrando todas las órdenes');
        return ordenes;
      }
      
      const cajaId = cajaAbierta.id;
      console.log(`Cajero ${usuarioId} tiene asignada la caja ${cajaId}`);
      
      // Buscar mozos asignados a esta caja
      const asignacionesCaja = await this.asignacionesService.getAsignacionesActivasCaja(cajaId);
      
      // Extraer IDs de mozos asignados
      const mozoIdsAsignadosACajero = asignacionesCaja
        .filter(asignacion => asignacion.mozoId !== null)
        .map(asignacion => asignacion.mozoId!)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      console.log(`Mozos asignados a la caja ${cajaId}:`, mozoIdsAsignadosACajero);
      
      // Filtrar órdenes
      const ordenesFiltradas = ordenes.filter(orden => {
        // Incluir órdenes con movimientos en esta caja
        if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
          if (orden.movimientosCaja.some(mov => mov.cajaId === cajaId)) {
            return true;
          }
        }
        
        // Incluir órdenes de mozos asignados
        if (orden.mozoId && mozoIdsAsignadosACajero.includes(orden.mozoId)) {
          return true;
        }
        
        // Incluir órdenes creadas por el propio cajero
        if (orden.mozoId === usuarioId) {
          return true;
        }
        
        return false;
      });
      
      console.log(`Órdenes filtradas por estado para CAJERO: ${ordenesFiltradas.length}`);
      // Verificar que el campo esComplemento esté presente en cada item de cada orden
    ordenesFiltradas.forEach(orden => {
      if (orden.items && orden.items.length > 0) {
        orden.items.forEach(item => {
          // Asegurarse de que el campo esComplemento esté disponible para el frontend
          console.log(`Orden ${orden.id} - Item ${item.id} - esComplemento:`, item.esComplemento);
        });
      }
    });
    
    return ordenesFiltradas;
  }

  // Verificar que el campo esComplemento esté presente en cada item de cada orden
  ordenes.forEach(orden => {
    if (orden.items && orden.items.length > 0) {
      orden.items.forEach(item => {
        // Asegurarse de que el campo esComplemento esté disponible para el frontend
        console.log(`Orden ${orden.id} - Item ${item.id} - esComplemento:`, item.esComplemento);
      });
    }
  });
  
  return ordenes;
  }

  async updateEstado(id: number, estado: EstadoOrden, user: any) {
    console.log('Actualizando estado en servicio:', { id, estado, user });
    console.log('Usuario que realiza la actualización:', user);

    // Intentar obtener el rol del usuario
    let userRole = 'DESCONOCIDO';
    if (user.rol) {
      if (typeof user.rol === 'string') {
        userRole = user.rol;
      } else if (user.rol.nombre) {
        userRole = user.rol.nombre;
      }
    }
    console.log(`Rol del usuario que actualiza: ${userRole}`);

    const orden = await this.prisma.orden.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
            combo: true,
          },
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      }
    });

    if (!orden) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Verificar si el usuario tiene permisos para cambiar el estado a ENTREGADO
    if ((estado as any) === 'ENTREGADO') {
      // Solo ADMIN, CAJERO y ahora también BARTENDER pueden marcar órdenes como entregadas
      if (userRole !== 'ADMIN' && userRole !== 'CAJERO' && userRole !== 'BARTENDER') {
        throw new ForbiddenException('Solo administradores, cajeros y bartenders pueden marcar órdenes como entregadas');
      }

      // Ya no verificamos si la orden ha sido cobrada
      // Confiamos en que la interfaz de usuario solo habilitará este botón cuando sea apropiado
    }
    
    // Verificar permisos para cambiar a COBRADA o CANCELADA
    if ((estado as any) === 'COBRADA') {
      if (userRole !== 'ADMIN' && userRole !== 'CAJERO') {
        throw new ForbiddenException('Solo administradores y cajeros pueden marcar órdenes como cobradas');
      }
    }
    
    if ((estado as any) === 'CANCELADA') {
      if (userRole !== 'ADMIN' && userRole !== 'GERENTE' && userRole !== 'CAJERO') {
        throw new ForbiddenException('Solo administradores, gerentes y cajeros pueden cancelar órdenes');
      }
    }

    const updatedOrden = await this.prisma.orden.update({
      where: { id },
      data: { estado },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
            combo: true,
          },
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      }
    });

    // Emitir evento de actualización usando WebSocket
    console.log(`Emitiendo evento de actualización para orden #${id}`);
    this.ordenesGateway.emitActualizacionOrden(updatedOrden);

    // Usar también el servicio de notificaciones como respaldo
    this.notificacionesService.notificarActualizacionEstado(updatedOrden);

    console.log(`Actualización de estado completada para orden #${id} a ${estado}`);
    return updatedOrden;
  }

  async remove(id: number) {
    return this.prisma.orden.delete({
      where: { id },
    });
  }

  async cobrarOrden(id: number, cajaId: number, usuarioId: number, metodoPago: string = 'EFECTIVO') {
    console.log('Iniciando cobro de orden:', { id, cajaId, usuarioId, metodoPago });
    try {
      // Verificar que la caja existe y está abierta
      const caja = await this.prisma.caja.findUnique({
        where: { id: cajaId }
      });

      if (!caja) {
        throw new NotFoundException(`Caja con ID ${cajaId} no encontrada`);
      }

      if (caja.estado !== 'ABIERTA') {
        throw new BadRequestException('No se puede cobrar una orden con una caja cerrada');
      }
      
      // Verificar que el usuario es cajero de esta caja (si no es ADMIN)
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { rol: true }
      });
      
      if (usuario?.rol.nombre === 'CAJERO' && caja.usuarioAperturaId !== usuarioId) {
        throw new ForbiddenException('No puedes cobrar órdenes en una caja que no te pertenece');
      }

      // Verificar que la orden existe
      const orden = await this.prisma.orden.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              producto: true,
              combo: true,
              promocion: true
            }
          }
        }
      });

      if (!orden) {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }

      // Verificar que la orden no ha sido cobrada ya (que no haya movimientos de caja asociados a esta orden)
      const movimientosCaja = await this.prisma.movimientoCaja.findFirst({
        where: { ordenId: id }
      });

      if (movimientosCaja) {
        throw new BadRequestException(`La orden con ID ${id} ya ha sido cobrada`);
      }

      // Calcular el total de la orden
      const total = orden.items.reduce(
        (sum, item) => {
          let itemPrecio = 0;
          if (item.precio !== undefined && item.precio !== null) {
            itemPrecio = Number(item.precio);
          } else if (item.combo && item.combo.precio) {
            itemPrecio = Number(item.combo.precio);
          } else if (item.producto && item.producto.precio) {
            itemPrecio = Number(item.producto.precio);
          }
          return sum + (itemPrecio * item.cantidad);
        },
        0
      );

      // Obtener la orden actualizada sin cambiar el estado (manteniendo el estado actual)
      // La orden solo se cobrará, pero no cambiará su estado automáticamente
      console.log('Manteniendo el estado actual de la orden:', orden.estado);
      const ordenActualizada = await this.prisma.orden.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              producto: true,
              combo: true,
              promocion: true
            }
          },
          mozo: true
        }
      });

      console.log('Creando movimiento de caja con método de pago:', metodoPago);
      // Crear el movimiento de caja sin usar SQL raw
      const movimientoCaja = await this.prisma.movimientoCaja.create({
        data: {
          tipo: 'VENTA',
          monto: total,
          concepto: `Cobro de orden #${id}`,
          metodoPago: metodoPago as any,  // Convertir a Enum
          cajaId: cajaId,
          ordenId: id,
          usuarioId: usuarioId,
          fechaHora: new Date()
        }
      });

      

      // Actualizar el estado de la orden a COBRADA
      await this.prisma.orden.update({
        where: { id },
        data: { estado: 'COBRADA' as any }
      });

      console.log('Actualizando inventario');
      // Actualizar el inventario
      for (const item of orden.items) {
        console.log(`Procesando item: producto ${item.productoId}, combo ${item.comboId}, promocion ${item.promocionId}, cantidad ${item.cantidad}`);
        
        // Si es un producto individual
        if (item.productoId) {
          console.log(`Procesando producto individual: ${item.productoId}`);
          // Registrar movimiento de inventario para cada producto
          await this.prisma.movimientoInventario.create({
            data: {
              tipo: 'VENTA',
              cantidad: item.cantidad,
              motivo: `Venta - Orden #${id}`,
              productoId: item.productoId,
              usuarioId: usuarioId,
              stockAnterior: item.producto?.stock || 0,
              stockNuevo: (item.producto?.stock || 0) - item.cantidad,
              // Si necesitas guardar el precio en el movimiento, usa item.precio o 0
              //precioUnitario: item.precio !== undefined ? Number(item.precio) : (item.producto?.precio || 0)
            }
          });

          // Actualizar el stock del producto
          await this.prisma.producto.update({
            where: { id: item.productoId },
            data: { stock: { decrement: item.cantidad } }
          });
        }
        
        // Si es un combo
        else if (item.comboId) {
          console.log(`Procesando combo: ${item.comboId}`);
          // Obtener los productos del combo
          const combo = await this.prisma.combo.findUnique({
            where: { id: item.comboId },
            include: {
              productos: {
                include: {
                  producto: true
                }
              }
            }
          });
          
          if (combo) {
            // Para cada producto en el combo
            for (const comboProducto of combo.productos) {
              const cantidadTotal = comboProducto.cantidad * item.cantidad;
              const producto = comboProducto.producto;
              
              console.log(`Procesando producto ${producto.id} del combo, cantidad: ${cantidadTotal}`);
              
              // Registrar movimiento de inventario
              await this.prisma.movimientoInventario.create({
                data: {
                  tipo: 'VENTA',
                  cantidad: cantidadTotal,
                  motivo: `Venta - Combo ${combo.nombre} - Orden #${id}`,
                  productoId: producto.id,
                  usuarioId: usuarioId,
                  stockAnterior: producto.stock,
                  stockNuevo: producto.stock - cantidadTotal,
                }
              });
              
              // Actualizar el stock del producto
              await this.prisma.producto.update({
                where: { id: producto.id },
                data: { stock: { decrement: cantidadTotal } }
              });
            }
          }
        }
        
        // Si es una promoción
        else if (item.promocionId) {
          console.log(`Procesando promoción: ${item.promocionId}`);
          // Obtener los productos de la promoción
          const promocion = await this.prisma.promocionTragos.findUnique({
            where: { id: item.promocionId },
            include: {
              productos: {
                include: {
                  producto: true
                }
              }
            }
          });
          
          if (promocion) {
            // Para cada producto en la promoción
            for (const promocionProducto of promocion.productos) {
              const producto = promocionProducto.producto;
              // En promociones, normalmente se usa 1 unidad de cada producto por promoción
              const cantidadTotal = item.cantidad; 
              
              console.log(`Procesando producto ${producto.id} de la promoción, cantidad: ${cantidadTotal}`);
              
              // Registrar movimiento de inventario
              await this.prisma.movimientoInventario.create({
                data: {
                  tipo: 'VENTA',
                  cantidad: cantidadTotal,
                  motivo: `Venta - Promoción ${promocion.nombre} - Orden #${id}`,
                  productoId: producto.id,
                  usuarioId: usuarioId,
                  stockAnterior: producto.stock,
                  stockNuevo: producto.stock - cantidadTotal,
                }
              });
              
              // Actualizar el stock del producto
              await this.prisma.producto.update({
                where: { id: producto.id },
                data: { stock: { decrement: cantidadTotal } }
              });
            }
          }
        }
      }

      console.log('Cobro finalizado con éxito');
      
      // Emitir evento de orden cobrada por WebSocket
      if (ordenActualizada) {
        this.ordenesGateway.emitOrdenCobrada({
          id: id,
          estado: ordenActualizada.estado
        });
      }
      
      return {
        orden: ordenActualizada,
        movimientoCaja,
        total
      };
    } catch (error) {
      console.error('Error al cobrar orden:', error);
      throw error;
    }
  }

  // Método helper para filtrar órdenes para bartender (no se usa con el nuevo enfoque)
  private async filtrarOrdenParaBartender(orden: any) {
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
      return null; // No hay categoría Tragos, no mostrar nada
    }

    // Filtrar solo los items de la categoría Tragos
    const itemsFiltrados = orden.items.filter(item =>
      item.producto?.categoria && 
      item.producto?.categoria.nombre && 
      item.producto?.categoria.nombre.toLowerCase() === 'tragos'
    );

    // Si no hay items de tragos, no mostrar la orden
    if (itemsFiltrados.length === 0) {
      return null;
    }

    // Retornar la orden con solo los items de tragos
    const ordenFiltrada = {
      ...orden,
      items: itemsFiltrados,
      _filtroBartender: true // Marcamos la orden para identificar que ya fue filtrada
    };

    console.log('Orden filtrada para bartender:', ordenFiltrada);
    return ordenFiltrada;
  }

  async verificarOrdenCobrada(id: number): Promise<boolean> {
    // Verificar si hay algún movimiento de caja asociado a esta orden
    const movimientoCaja = await this.prisma.movimientoCaja.findFirst({
      where: { ordenId: id }
    });
    
    // Si hay al menos un movimiento de caja, la orden ya ha sido cobrada
    return movimientoCaja !== null;
  }

  // Método para cancelar una orden
  async cancelarOrden(ordenId: number, motivo: string, revertirPago: boolean, usuario: any): Promise<any> {
    console.log(`=== INICIANDO CANCELACIÓN DE ORDEN #${ordenId} ===`);
    console.log('Datos recibidos:', { ordenId, motivo, revertirPago, usuario });

    // Verificar que la orden existe
    const orden = await this.prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        items: {
          include: { 
            producto: true,
            combo: true
          }
        },
        movimientosCaja: true // Incluir movimientos de caja asociados
      }
    });

    if (!orden) {
      throw new NotFoundException(`Orden con ID ${ordenId} no encontrada`);
    }

    console.log('Orden encontrada:', {
      id: orden.id,
      estado: orden.estado,
      items: orden.items.length,
      tienePago: orden.movimientosCaja && orden.movimientosCaja.length > 0
    });

    // Verificar que la orden no esté ya cancelada
    if (orden.estado === 'CANCELADA') {
      throw new BadRequestException('La orden ya está cancelada');
    }

    try {
      // Usar una transacción para garantizar la integridad de la operación
      return await this.prisma.$transaction(async (prisma) => {
        console.log(`Iniciando transacción para cancelar orden #${ordenId}`);
        let montoDevolucion = 0;
        let metodoPagoUsado = 'EFECTIVO' as any; // Corregido para type safety
        
        // Si se requiere revertir el pago (orden cobrada)
        if (revertirPago && orden.estado === 'COBRADA') {
          console.log('La orden está cobrada, se procederá a revertir el pago');
          
          // 1. Buscar una caja abierta
          const cajaAbierta = await prisma.caja.findFirst({
            where: { estado: 'ABIERTA' },
          });

          if (!cajaAbierta) {
            console.error('No hay caja abierta para procesar la devolución');
            throw new BadRequestException('No hay una caja abierta para procesar la devolución');
          }

          console.log('Caja abierta encontrada:', cajaAbierta.id);
          
          // 2. Calcular el monto total de la devolución
          // Buscar en los movimientos de caja para determinar el monto exacto y método de pago
          if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
            const movimientoVenta = orden.movimientosCaja.find(m => m.tipo === 'VENTA');
            if (movimientoVenta) {
              montoDevolucion = parseFloat(movimientoVenta.monto.toString());
              metodoPagoUsado = movimientoVenta.metodoPago;
              console.log('Encontrado movimiento de venta previo:', { 
                monto: montoDevolucion, 
                metodoPago: metodoPagoUsado 
              });
            }
          }
          
          // Si no se encontró monto en movimientos, calcular desde los items
          if (montoDevolucion <= 0) {
            montoDevolucion = orden.items.reduce((sum, item) => {
              // Intentar obtener precio unitario
              let precioUnitario = 0;
              
              // Primero intentar obtener precio desde el combo
              if (item.combo && item.combo.precio) {
                precioUnitario = parseFloat(item.combo.precio.toString());
              }
              // Si no es combo, intentar obtener precio desde el producto
              else if (item.producto && item.producto.precio) {
                precioUnitario = parseFloat(item.producto.precio.toString());
              }
              
              return sum + (precioUnitario * item.cantidad);
            }, 0);
            
            console.log('Monto calculado desde items:', montoDevolucion);
          }

          // 3. Registrar un movimiento de caja como devolución
          console.log('Creando movimiento de devolución en caja:', { 
            monto: montoDevolucion, 
            metodoPago: metodoPagoUsado 
          });
          
          const movimientoDevolucion = await prisma.movimientoCaja.create({
            data: {
              tipo: 'DEVOLUCION',
              monto: montoDevolucion,
              concepto: `Devolución por cancelación de orden #${orden.id}: ${motivo}`,
              metodoPago: metodoPagoUsado,
              cajaId: cajaAbierta.id,
              ordenId: orden.id,
              usuarioId: usuario.userId || usuario.id, // Soportar ambos formatos
              fechaHora: new Date()
            }
          });
          
          console.log('Movimiento de devolución creado:', movimientoDevolucion.id);

          // 4. Restaurar el stock de los productos
          console.log(`Restaurando stock de ${orden.items.length} productos`);
          
          for (const item of orden.items) {
            if (!item.producto) {
              console.log(`Item ${item.id} no tiene producto asociado, omitiendo`);
              continue;
            }

            console.log(`Procesando item ${item.id}, producto ${item.productoId}, cantidad ${item.cantidad}`);
            
            // Obtener stock actual antes de incrementarlo
            const productoActual = await prisma.producto.findUnique({
              where: { id: item.productoId || 0 }
            });
            
            if (!productoActual) {
              console.log(`Producto ${item.productoId} no encontrado, omitiendo`);
              continue;
            }
            
            const stockAnterior = productoActual.stock;
            const stockNuevo = stockAnterior + item.cantidad;
            
            console.log(`Producto ${item.productoId}: Stock actual ${stockAnterior} -> Nuevo stock ${stockNuevo}`);

            // Incrementar stock del producto
            const productoActualizado = await prisma.producto.update({
              where: { id: item.productoId || 0 },
              data: { 
                stock: stockNuevo
              }
            });

            console.log(`Stock del producto ${item.productoId} actualizado: ${productoActualizado.stock}`);

            // Registrar movimiento de inventario
            const movimientoInventario = await prisma.movimientoInventario.create({
              data: {
                tipo: 'ENTRADA',
                cantidad: item.cantidad,
                motivo: `Devolución por cancelación de orden #${orden.id}: ${motivo}`,
                productoId: item.productoId || 0,
                usuarioId: usuario.userId || usuario.id,
                stockAnterior: stockAnterior,
                stockNuevo: stockNuevo,
                fechaHora: new Date()
              }
            });
            
            console.log(`Movimiento de inventario creado: ${movimientoInventario.id}`);
          }
        } else {
          console.log(`Orden en estado ${orden.estado}, no se requiere revertir el pago`);
        }

        // 5. Actualizar estado de la orden a CANCELADA
        console.log('Actualizando estado de la orden a CANCELADA');
        
        const ordenActualizada = await prisma.orden.update({
          where: { id: ordenId },
          data: { estado: 'CANCELADA' },
          include: {
            items: {
              include: { 
                producto: {
                  include: {
                    categoria: true,
                  }
                },
                combo: true
              }
            },
            mozo: true,
            movimientosCaja: true
          }
        });

        console.log('Orden actualizada a CANCELADA:', ordenActualizada.id);

        // 6. Emitir evento de actualización de la orden
        this.ordenesGateway.emitActualizacionOrden(ordenActualizada);
        console.log('Evento de actualización emitido por WebSocket');

        console.log(`=== CANCELACIÓN DE ORDEN #${ordenId} COMPLETADA ===`);
        
        return { 
          message: `Orden #${ordenId} cancelada correctamente`, 
          revertido: revertirPago,
          orden: ordenActualizada 
        };
      });
    } catch (error) {
      console.error('Error al cancelar la orden:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al cancelar la orden: ${error.message}`);
    }
  }

  async devolverOrden(id: number, cajaId: number, motivo: string, reingresarStock: boolean, usuarioId: number) {
    // Buscar la orden
    const orden = await this.prisma.orden.findUnique({
      where: { id },
      include: {
        items: {
          include: { 
            producto: true,
            combo: true
          }
        },
        movimientosCaja: true,
        mozo: true
      }
    });

    if (!orden) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Verificar que la orden esté cobrada
    if (orden.estado !== 'COBRADA') {
      throw new BadRequestException('Solo se pueden devolver órdenes que han sido cobradas');
    }

    // Verificar que la caja exista y esté abierta
    const caja = await this.prisma.caja.findUnique({
      where: { id: cajaId }
    });

    if (!caja) {
      throw new NotFoundException(`Caja con ID ${cajaId} no encontrada`);
    }

    if (caja.estado !== 'ABIERTA') {
      throw new BadRequestException('La caja debe estar abierta para procesar una devolución');
    }

    try {
      // Usar una transacción para garantizar la integridad
      return await this.prisma.$transaction(async (prisma) => {
        console.log(`Iniciando transacción para devolución de orden #${id}`);
        
        // Encontrar el movimiento de caja original para obtener el monto y método de pago
        const movimientoOriginal = orden.movimientosCaja.find(m => m.tipo === 'VENTA');
        
        if (!movimientoOriginal) {
          throw new BadRequestException('No se encontró el movimiento de venta original');
        }
        
        const montoDevolucion = parseFloat(movimientoOriginal.monto.toString());
        const metodoPagoOriginal = movimientoOriginal.metodoPago;
        
        console.log(`Procesando devolución por ${montoDevolucion} (${metodoPagoOriginal})`);
        
        // Registrar el movimiento de devolución en caja
        const movimientoDevolucion = await prisma.movimientoCaja.create({
          data: {
            tipo: 'DEVOLUCION',
            monto: montoDevolucion,
            concepto: `Devolución de orden #${id}: ${motivo}`,
            metodoPago: metodoPagoOriginal,
            cajaId,
            ordenId: id,
            usuarioId,
            fechaHora: new Date()
          }
        });
        
        console.log(`Movimiento de devolución creado: ID ${movimientoDevolucion.id}`);
        
        // Si se solicita reingresar el stock
        if (reingresarStock) {
          console.log(`Reingresando stock de ${orden.items.length} productos`);
          
          for (const item of orden.items) {
            // Obtener stock actual
            const producto = await prisma.producto.findUnique({
              where: { id: item.productoId || 0 }
            });
            
            if (!producto) continue;
            
            const stockAnterior = producto.stock;
            const stockNuevo = stockAnterior + item.cantidad;
            
            // Actualizar el stock
            await prisma.producto.update({
              where: { id: item.productoId || 0 },
              data: { stock: stockNuevo }
            });
            
            // Registrar el movimiento de inventario
            await prisma.movimientoInventario.create({
              data: {
                tipo: 'ENTRADA',
                cantidad: item.cantidad,
                motivo: `Devolución de orden #${id}: ${motivo}`,
                productoId: item.productoId || 0,
                usuarioId,
                stockAnterior,
                stockNuevo,
                fechaHora: new Date()
              }
            });
            
            console.log(`Stock actualizado para producto ${item.productoId}: ${stockAnterior} -> ${stockNuevo}`);
          }
        } else {
          console.log('No se reingresará stock por solicitud del usuario');
        }
        
        // Actualizar el estado de la orden a CANCELADA
        const ordenActualizada = await prisma.orden.update({
          where: { id },
          data: { 
            estado: 'CANCELADA'
          },
          include: {
            items: {
              include: {
                producto: {
                  include: {
                    categoria: true
                  }
                },
                combo: true
              }
            },
            mozo: true,
            movimientosCaja: true
          }
        });
        
        console.log(`Orden #${id} actualizada a estado CANCELADA`);
        
        // Notificar por WebSocket
        this.ordenesGateway.emitActualizacionOrden(ordenActualizada);
        
        return {
          message: `Devolución de orden #${id} procesada correctamente`,
          orden: ordenActualizada,
          devolucion: movimientoDevolucion
        };
      });
    } catch (error) {
      console.error(`Error al procesar devolución de orden #${id}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Error al procesar la devolución: ${error.message}`);
    }
  }
}