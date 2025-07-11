import { Module } from '@nestjs/common';
import { AsignacionesService } from './asignaciones.service';
import { AsignacionesController } from './asignaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AsignacionesController],
  providers: [AsignacionesService],
  exports: [AsignacionesService]
})
export class AsignacionesModule {} 