import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
  path: '/socket.io/'
})
export class OrdenesGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;
  
  private logger = new Logger('OrdenesGateway');
  private clientes: Map<string, {socket: Socket, rol?: string, info?: any, conectadoEn?: Date}> = new Map();
  
  constructor(private notificacionesService: NotificacionesService) {}
  
  afterInit(server: Server) {
    this.logger.log('Gateway WebSocket inicializado');
    // Configurar el servidor para el servicio de notificaciones
    this.notificacionesService.setServer(server);
    
    // Configuración adicional del servidor Socket.IO
    server.use((socket, next) => {
      // Limitar eventos por segundo para evitar sobrecarga
      let lastEventTime = Date.now();
      let eventCount = 0;
      
      socket.onAny(() => {
        const now = Date.now();
        if (now - lastEventTime > 1000) {
          // Reiniciar contador cada segundo
          eventCount = 1;
          lastEventTime = now;
        } else {
          eventCount++;
          
          // Si hay más de 10 eventos por segundo, posible bucle
          if (eventCount > 10) {
            this.logger.warn(`Posible bucle detectado para el cliente ${socket.id}: ${eventCount} eventos por segundo`);
          }
        }
      });
      
      next();
    });
    
    this.logger.log('Servidor Socket.IO configurado en NotificacionesService');
  }

  handleConnection(client: Socket) {
    // Extraer información adicional de la conexión
    const headers = client.handshake.headers;
    const rolHeader = headers['x-user-role'] || 'NO_ROLE_HEADER';
    
    // Verificar si ya existe un cliente con el mismo ID
    if (this.clientes.has(client.id)) {
      this.logger.warn(`Cliente con ID duplicado conectado: ${client.id}. Desconectando cliente anterior.`);
      const clienteExistente = this.clientes.get(client.id);
      try {
        clienteExistente?.socket.disconnect(true);
      } catch (error) {
        this.logger.error(`Error al desconectar cliente existente: ${error.message}`);
      }
      // Eliminar el cliente existente
      this.clientes.delete(client.id);
    }

    this.logger.log(`Cliente conectado: ${client.id} | Headers: ${JSON.stringify(headers)}`);
    
    // Limitar el número total de clientes para evitar sobrecargas
    if (this.clientes.size >= 100) {
      this.logger.warn(`Límite de clientes alcanzado (${this.clientes.size}). Rechazando nueva conexión.`);
      client.disconnect(true);
      return;
    }
    
    // Registrar el cliente
    this.clientes.set(client.id, {
      socket: client,
      rol: rolHeader !== 'UNKNOWN' ? rolHeader.toString() : undefined,
      conectadoEn: new Date()
    });
    
    // Enviar confirmación al cliente
    client.emit('conexion', { 
      mensaje: 'Conectado al servidor de comandas', 
      id: client.id,
      rolDetectado: rolHeader,
      totalClientes: this.clientes.size,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.clientes.get(client.id);
    this.logger.log(`Cliente desconectado: ${client.id} | Rol: ${clientInfo?.rol || 'desconocido'}`);
    this.clientes.delete(client.id);
    
    // Log de clientes restantes
    this.logger.log(`Clientes restantes: ${this.clientes.size} | Distribución: ${JSON.stringify(this.contarClientesPorRol())}`);
  }

  // Manejador para registrar roles de cliente
  @SubscribeMessage('registrarRol')
  handleRegistroRol(client: Socket, payload: {rol?: string, token?: string, info?: any}) {
    this.logger.log(`Solicitud de registro de rol para cliente ${client.id}: ${JSON.stringify(payload)}`);
    
    if (!payload || !payload.rol) {
      this.logger.warn(`Cliente ${client.id} intentó registrar rol sin especificarlo`);
      return { error: 'Se requiere especificar un rol' };
    }

    const clienteInfo = this.clientes.get(client.id);
    
    if (clienteInfo) {
      // Normalizar rol a mayúsculas para consistencia
      const rolNormalizado = payload.rol.toUpperCase();
      
      this.logger.log(`Cliente ${client.id} registrado como: ${rolNormalizado} (antes era: ${clienteInfo.rol || 'sin rol'})`);
      
      // Actualizar información del cliente
      clienteInfo.rol = rolNormalizado;
      clienteInfo.info = payload.info || {};
      this.clientes.set(client.id, clienteInfo);

      // Extraer información adicional del token si está disponible
      try {
        if (payload.token) {
          const tokenParts = payload.token.split('.');
          if (tokenParts.length === 3) {
            const tokenData = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            
            if (tokenData.rol) {
              // El token tiene información de rol, usarla como respaldo
              if (typeof tokenData.rol === 'string') {
                // Si rol es string directo
                const tokenRol = tokenData.rol.toUpperCase();
                this.logger.log(`Usando rol del token para ${client.id}: ${tokenRol}`);
                clienteInfo.rol = tokenRol;
              } else if (tokenData.rol.nombre) {
                // Si rol es un objeto con propiedad nombre
                const tokenRol = tokenData.rol.nombre.toUpperCase();
                this.logger.log(`Usando rol.nombre del token para ${client.id}: ${tokenRol}`);
                clienteInfo.rol = tokenRol;
              }
              
              // Actualizar cliente con información del token
              this.clientes.set(client.id, clienteInfo);
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Error al procesar token para cliente ${client.id}: ${error.message}`);
      }
      
      // Enviar evento a todos los clientes sobre la actualización
      this.server.emit('cliente_actualizado', {
        clientId: client.id,
        rol: clienteInfo.rol,
        timestamp: new Date().toISOString()
      });
      
      // Enviar confirmación directa al cliente que se registró
      client.emit('registro_confirmado', {
        status: 'success',
        clientId: client.id,
        rol: clienteInfo.rol,
        timestamp: new Date().toISOString()
      });
    }
    
    // Estadísticas actualizadas
    const clientesPorRol = this.contarClientesPorRol();
    this.logger.log(`Distribución actual de clientes: ${JSON.stringify(clientesPorRol)}`);
    
    return { 
      mensaje: `Registrado como ${payload.rol}`,
      clientesConectados: clientesPorRol,
      timestamp: new Date().toISOString()
    };
  }

  // Verificación de conexión
  @SubscribeMessage('ping')
  handlePing(client: Socket, payload: any) {
    const clienteInfo = this.clientes.get(client.id);
    this.logger.log(`Ping recibido de cliente ${client.id} (rol: ${clienteInfo?.rol || 'desconocido'})`);
    
    // Responder con información detallada
    return { 
      timestamp: new Date().toISOString(),
      clientId: client.id,
      detectedRole: clienteInfo?.rol,
      totalClients: this.clientes.size,
      distribución: this.contarClientesPorRol()
    };
  }

  // Manejador para actualizaciones manuales (respaldo)
  @SubscribeMessage('actualizar_estado_manual')
  handleActualizacionManual(client: Socket, payload: any) {
    this.logger.log(`Recibida actualización manual de cliente ${client.id}: ${JSON.stringify(payload)}`);
    
    const clienteInfo = this.clientes.get(client.id);
    const rolEmisor = clienteInfo?.rol || 'DESCONOCIDO';
    
    // Notificar a todos los clientes sobre la actualización
    this.server.emit('actualizacion_manual', {
      ...payload,
      emisorId: client.id,
      emisorRol: rolEmisor
    });
    
    // Responder al cliente
    return {
      status: 'success',
      message: 'Actualización manual notificada a todos los clientes',
      timestamp: new Date().toISOString()
    };
  }
  
  // Manejador para notificaciones especiales desde bartender
  @SubscribeMessage('bartender_actualizacion')
  handleBartenderActualizacion(client: Socket, payload: any) {
    const clienteInfo = this.clientes.get(client.id);
    
    // Verificar que realmente sea un bartender
    if (clienteInfo?.rol !== 'BARTENDER') {
      this.logger.warn(`Cliente ${client.id} con rol ${clienteInfo?.rol} intentó emitir evento de bartender`);
      return { error: 'Solo los bartenders pueden emitir este evento' };
    }
    
    this.logger.log(`Recibida actualización especial de BARTENDER ${client.id}: ${JSON.stringify(payload)}`);
    
    // Notificar a todos los clientes no-bartender
    let notificados = 0;
    for (const [id, cliente] of this.clientes.entries()) {
      if (id !== client.id && cliente.rol !== 'BARTENDER') {
        try {
          cliente.socket.emit('bartender_notificacion', {
            ...payload,
            emisorId: client.id
          });
          notificados++;
        } catch (error) {
          this.logger.error(`Error al notificar a cliente ${id}: ${error.message}`);
        }
      }
    }
    
    this.logger.log(`Notificación de BARTENDER enviada a ${notificados} clientes`);
    
    // Responder al emisor
    return { 
      status: 'success',
      clientesNotificados: notificados,
      timestamp: new Date().toISOString()
    };
  }
  
  // Manejador para solicitar refresco global
  @SubscribeMessage('solicitar_refresco_global')
  handleSolicitarRefrescoGlobal(client: Socket, payload: any) {
    const clienteInfo = this.clientes.get(client.id);
    this.logger.log(`Solicitud de refresco global de cliente ${client.id} (${clienteInfo?.rol || 'sin rol'}): ${JSON.stringify(payload)}`);
    
    // Notificar a todos los clientes que deben refrescar sus datos
    this.server.emit('refresco_solicitado', {
      ...payload,
      solicitadoPor: clienteInfo?.rol || 'DESCONOCIDO',
      solicitanteId: client.id,
      timestamp: new Date().toISOString()
    });
    
    this.logger.log(`Solicitud de refresco enviada a todos los clientes`);
    
    return {
      status: 'success',
      clientesNotificados: this.clientes.size - 1,
      timestamp: new Date().toISOString()
    };
  }

  // Métodos públicos para emitir eventos desde otros servicios

  // Emitir nueva orden a todos los clientes
  emitNuevaOrden(orden: any) {
    console.log('========== EMITIENDO EVENTO NUEVA ORDEN ==========');
    console.log(`Orden ID: ${orden.id}, Estado: ${orden.estado}`);
    console.log(`Total clientes conectados: ${this.clientes.size}`);
    console.log('Distribución de clientes:', this.contarClientesPorRol());
    
    // Asegurar que todas las propiedades importantes de la orden están incluidas
    const ordenData = {
      id: orden.id,
      estado: orden.estado,
      createdAt: orden.createdAt,
      items: orden.items || [],
      mozo: orden.mozo || null,
      notas: orden.notas || null,
      total: orden.total || 0,
      timestamp: new Date().toISOString()
    };
    
    // Log detallado de la orden
    console.log('Estructura de orden a emitir:', JSON.stringify({
      id: ordenData.id,
      estado: ordenData.estado,
      items: (ordenData.items || []).length,
      mozo: ordenData.mozo?.id || 'sin mozo',
      timestamp: ordenData.timestamp
    }));
    
    // IMPORTANTE: Primero emitir a los bartenders específicamente
    let bartendersNotificados = 0;
    for (const [clientId, cliente] of this.clientes.entries()) {
      if (cliente.rol === 'BARTENDER') {
        try {
          console.log(`⚡ Enviando nueva_orden directamente a BARTENDER ${clientId}`);
          cliente.socket.emit('nueva_orden', {
            ...ordenData,
            _enviadoDirecto: true,
            _timestamp: new Date().toISOString()
          });
          
          // RESTAURADO: Evento específico nueva_orden_tragos para el bartender
          // Filtrar la orden para incluir solo los items de tragos
          const itemsTragos = (ordenData.items || []).filter(item => 
            item.producto?.categoria?.nombre?.toLowerCase() === 'tragos'
          );
          
          if (itemsTragos.length > 0) {
            console.log(`⚡ Enviando nueva_orden_tragos a BARTENDER ${clientId} con ${itemsTragos.length} tragos`);
            cliente.socket.emit('nueva_orden_tragos', {
              ...ordenData,
              items: itemsTragos,
              _filtrado: true,
              _timestamp: new Date().toISOString()
            });
          } else {
            console.log('No hay items de tragos en esta orden para el bartender');
          }
          
          bartendersNotificados++;
        } catch (error) {
          console.error(`Error al enviar evento a BARTENDER ${clientId}:`, error.message);
        }
      }
    }
    console.log(`✅ Evento nueva_orden enviado a ${bartendersNotificados} BARTENDERS`);
    
    // Luego emitir a todos los demás clientes
    this.server.emit('nueva_orden', ordenData);
    console.log('Evento nueva_orden emitido a todos los clientes');
    
    // VERIFICACIÓN ADICIONAL: Forzar ping a todos los BARTENDERS
    for (const [clientId, cliente] of this.clientes.entries()) {
      if (cliente.rol === 'BARTENDER') {
        try {
          console.log(`Enviando ping de verificación a BARTENDER ${clientId}`);
          cliente.socket.emit('ping_respuesta', {
            mensaje: `Nueva orden #${orden.id} disponible`,
            ordenId: orden.id,
            timestamp: new Date().toISOString()
          });
          
          // También enviar refresco específico
          cliente.socket.emit('refresco_solicitado', {
            mensaje: `Nueva orden #${orden.id} requiere tu atención`,
            timestamp: new Date().toISOString(),
            ordenId: orden.id
          });
        } catch (error) {
          console.error(`Error al enviar ping a BARTENDER ${clientId}:`, error.message);
        }
      }
    }
    
    this.logger.log(`Evento nueva_orden emitido para orden #${orden.id}`);
    console.log('====================================================');
  }

  // Emitir actualización de estado de orden
  emitActualizacionOrden(orden: any) {
    console.log('========== EMITIENDO ACTUALIZACIÓN DE ORDEN ==========');
    console.log(`Orden ID: ${orden.id}, Estado: ${orden.estado}`);
    console.log(`Total clientes conectados: ${this.clientes.size}`);
    
    // Formatear la orden con los campos necesarios
    const ordenData = {
      id: orden.id,
      estado: orden.estado,
      createdAt: orden.createdAt,
      items: orden.items,
      mozo: orden.mozo,
      notas: orden.notas || null,
      total: orden.total,
      timestamp: new Date().toISOString()
    };
    
    // IMPORTANTE: Primero emitir a los bartenders específicamente
    let bartendersNotificados = 0;
    for (const [clientId, cliente] of this.clientes.entries()) {
      if (cliente.rol === 'BARTENDER') {
        try {
          console.log(`⚡ Enviando orden_actualizada directamente a BARTENDER ${clientId}`);
          cliente.socket.emit('orden_actualizada', {
            ...ordenData,
            _enviadoDirecto: true,
            _timestamp: new Date().toISOString()
          });
          bartendersNotificados++;
        } catch (error) {
          console.error(`Error al enviar evento a BARTENDER ${clientId}:`, error.message);
        }
      }
    }
    console.log(`✅ Evento orden_actualizada enviado a ${bartendersNotificados} BARTENDERS`);
    
    // Luego emitir a todos los demás clientes
    this.server.emit('orden_actualizada', ordenData);
    console.log('Evento orden_actualizada emitido a todos los clientes');
    
    this.logger.log(`Evento orden_actualizada emitido para orden #${orden.id} - Estado: ${orden.estado}`);
    console.log('====================================================');
  }

  // Emitir orden cobrada a todos los clientes
  emitOrdenCobrada(orden: any) {
    console.log('========== EMITIENDO ORDEN COBRADA ==========');
    console.log(`Orden ID: ${orden.id}, Estado: ${orden.estado}`);
    
    const data = {
      ordenId: orden.id,
      timestamp: new Date().toISOString(),
      estado: orden.estado
    };
    
    // Emitir a todos los clientes
    this.server.emit('orden_cobrada', data);
    console.log('Evento orden_cobrada emitido a todos los clientes');
    
    // También emitir como actualización para mayor seguridad
    this.server.emit('orden_actualizada', {
      id: orden.id,
      estado: orden.estado,
      timestamp: new Date().toISOString(),
      _viaCobro: true
    });
    
    console.log('====================================================');
  }

  // Método para contar clientes por rol
  private contarClientesPorRol(): Record<string, number> {
    const conteo: Record<string, number> = {
      'TOTAL': this.clientes.size,
      'SIN_ROL': 0
    };
    
    // Contar clientes por cada rol
    for (const cliente of this.clientes.values()) {
      if (cliente.rol) {
        conteo[cliente.rol] = (conteo[cliente.rol] || 0) + 1;
      } else {
        conteo['SIN_ROL'] += 1;
      }
    }
    
    return conteo;
  }

  // Método para emitir eventos filtrados por rol
  private emitirEventoFiltradoPorRol(orden: any, nombreEvento: string, rol: string) {
    console.log(`Emitiendo evento ${nombreEvento} filtrado para rol ${rol}`);
    
    // Si es para BARTENDER, aplicar lógica especial
    if (rol === 'BARTENDER') {
      // Verificar si la orden tiene items de tragos
      const tieneTragos = this.ordenTieneTragos(orden);
      console.log(`Orden #${orden.id} tiene tragos: ${tieneTragos}`);
      
      // Siempre procesamos la emisión, incluso si no hay tragos
      // para que el bartender esté al tanto de todas las órdenes
      
      // Aplicar filtro solo si hay tragos
      let ordenFiltrada = orden;
      if (tieneTragos) {
        ordenFiltrada = this.filtrarOrdenParaTragos(orden);
        ordenFiltrada._tieneTragos = true;
      } else {
        // Mantener la información completa pero marcar que no tiene tragos
        ordenFiltrada = { ...orden, _tieneTragos: false };
      }
      
      // Emitir a todos los clientes con el rol especificado
      let clientesRolEncontrados = 0;
      
      for (const [id, cliente] of this.clientes.entries()) {
        if (cliente.rol === rol) {
          try {
            cliente.socket.emit(nombreEvento, {
              ...ordenFiltrada,
              _metadata: {
                timestamp: new Date().toISOString(),
                targetClientId: id,
                eventType: nombreEvento,
                filteredEvent: true
              }
            });
            clientesRolEncontrados++;
            console.log(`✅ Evento ${nombreEvento} enviado a cliente ${id} con rol ${rol}`);
          } catch (error) {
            console.error(`❌ Error al enviar evento específico a ${rol} (${id}): ${error.message}`);
          }
        }
      }
      
      console.log(`Evento ${nombreEvento} emitido a ${clientesRolEncontrados} clientes con rol ${rol}`);
    }
  }

  // Verificar si una orden tiene productos de la categoría tragos
  private ordenTieneTragos(orden: any): boolean {
    if (!orden.items || !Array.isArray(orden.items)) return false;
    
    return orden.items.some(item => 
      item.producto?.categoria?.nombre?.toLowerCase() === 'tragos'
    );
  }

  // Filtrar una orden para incluir solo productos de tragos
  private filtrarOrdenParaTragos(orden: any): any {
    if (!orden.items || !Array.isArray(orden.items)) return orden;
    
    const itemsFiltrados = orden.items.filter(item => 
      item.producto?.categoria?.nombre?.toLowerCase() === 'tragos'
    );
    
    return {
      ...orden,
      items: itemsFiltrados,
      _filtradoParaTragos: true
    };
  }
} 