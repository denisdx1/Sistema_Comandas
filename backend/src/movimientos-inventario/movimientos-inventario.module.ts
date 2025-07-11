import { Module } from '@nestjs/common';
import { MovimientosInventarioController } from './movimientos-inventario.controller';
import { MovimientosInventarioService } from './movimientos-inventario.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MovimientosInventarioController],
  providers: [MovimientosInventarioService],
  exports: [MovimientosInventarioService]
})
export class MovimientosInventarioModule {} 