import { Module } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { OrdenesController } from './ordenes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdenesGateway } from './ordenes.gateway';
import { NotificacionesService } from './notificaciones.service';
import { AsignacionesModule } from '../asignaciones/asignaciones.module';

@Module({
  imports: [PrismaModule, AsignacionesModule],
  controllers: [OrdenesController],
  providers: [OrdenesService, OrdenesGateway, NotificacionesService],
  exports: [OrdenesService]
})
export class OrdenesModule {} 