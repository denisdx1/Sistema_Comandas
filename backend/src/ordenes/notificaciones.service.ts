import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificacionesService {
  private server: Server;
  private readonly logger = new Logger(NotificacionesService.name);

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Servidor Socket.IO configurado');
  }

  notificarNuevaOrden(orden: any) {
    this.logger.log(`Intentando notificar nueva orden: ${orden.id}`);
    if (this.server) {
      this.server.to('/ordenes').emit('nuevaOrden', orden);
      this.logger.log('Notificación de nueva orden enviada');
    } else {
      this.logger.error('Servidor Socket.IO no está configurado');
    }
  }

  notificarActualizacionEstado(orden: any) {
    this.logger.log(`Intentando notificar actualización de estado: ${orden.id}`);
    if (this.server) {
      this.server.to('/ordenes').emit('actualizacionEstado', orden);
      this.logger.log('Notificación de actualización de estado enviada');
    } else {
      this.logger.error('Servidor Socket.IO no está configurado');
    }
  }
} 