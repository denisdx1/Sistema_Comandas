import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProductosModule } from './productos/productos.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MovimientosInventarioModule } from './movimientos-inventario/movimientos-inventario.module';
import { CajasModule } from './cajas/cajas.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';
import { CombosModule } from './combos/combos.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
   
    AuthModule,
    RolesModule,
    CategoriasModule,
    ProductosModule,
    OrdenesModule,
    DashboardModule,
    MovimientosInventarioModule,
    CajasModule,
    SucursalesModule,
    AsignacionesModule,
    CombosModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}