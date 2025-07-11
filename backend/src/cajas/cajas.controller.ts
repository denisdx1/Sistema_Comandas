import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, BadRequestException, Patch } from '@nestjs/common';
import { CajasService } from './cajas.service';
import { CierreCajaDto, CreateMovimientoCajaDto } from './dto/caja.dto';
import { AperturaCajaDto } from './dto/apertura-caja.dto';
import { CajaFilterDto } from './dto/caja-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cajas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CajasController {
  constructor(private readonly cajasService: CajasService) {}

  @Post('abrir')
  @Roles('ADMIN', 'CAJERO')
  abrirCaja(@Body() aperturaCajaDto: AperturaCajaDto, @Request() req) {
    if (!req.user || !req.user.userId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    
    return this.cajasService.abrirCaja(aperturaCajaDto, req.user.userId);
  }

  @Patch(':id/cerrar')
  @Roles('ADMIN', 'CAJERO')
  async cerrarCaja(@Param('id') id: string, @Body() cierreCajaDto: CierreCajaDto, @Request() req) {
    if (!req.user || !req.user.userId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    
    // Verificar si el cajero tiene acceso a esta caja
    if (req.user.rol === 'CAJERO') {
      const tieneAcceso = await this.cajasService.verificarAccesoCaja(+id, req.user.userId, req.user.rol);
      if (!tieneAcceso) {
        throw new BadRequestException('No tienes permisos para cerrar esta caja');
      }
    }
    
    return this.cajasService.cerrarCaja(+id, cierreCajaDto, req.user.userId);
  }

  @Get('actual')
  @Roles('ADMIN', 'CAJERO')
  getCajaActual(@Query('sucursalId') sucursalId?: string, @Request() req?) {
    // Si es cajero, solo mostrar su caja actual
    if (req.user && req.user.rol === 'CAJERO') {
      // Buscar la caja actual del cajero
      return this.cajasService.findAll({ estado: 'ABIERTA' as any }, req.user.userId, req.user.rol)
        .then(cajas => cajas.length > 0 ? cajas[0] : null);
    }
    
    return this.cajasService.getCajaActual(sucursalId ? +sucursalId : undefined);
  }

  @Post(':id/movimientos')
  @Roles('ADMIN', 'CAJERO')
  async registrarMovimiento(
    @Param('id') id: string,
    @Body() createMovimientoDto: CreateMovimientoCajaDto,
    @Request() req
  ) {
    if (!req.user || !req.user.userId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    
    // Verificar si el cajero tiene acceso a esta caja
    if (req.user.rol === 'CAJERO') {
      const tieneAcceso = await this.cajasService.verificarAccesoCaja(+id, req.user.userId, req.user.rol);
      if (!tieneAcceso) {
        throw new BadRequestException('No tienes permisos para registrar movimientos en esta caja');
      }
    }
    
    return this.cajasService.registrarMovimiento(+id, createMovimientoDto, req.user.userId);
  }

  @Get()
  @Roles('ADMIN', 'CAJERO')
  findAll(@Query() filters: CajaFilterDto, @Request() req) {
    // Pasar información del usuario para filtrar si es CAJERO
    if (req.user && req.user.rol === 'CAJERO') {
      return this.cajasService.findAll(filters, req.user.userId, req.user.rol);
    }
    
    return this.cajasService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'CAJERO')
  findOne(@Param('id') id: string, @Request() req) {
    // Pasar información del usuario para verificar acceso si es CAJERO
    if (req.user && req.user.rol === 'CAJERO') {
      return this.cajasService.findOne(+id, req.user.userId, req.user.rol);
    }
    
    return this.cajasService.findOne(+id);
  }

  @Get(':id/movimientos')
  @Roles('ADMIN', 'CAJERO')
  getMovimientosByCajaId(@Param('id') id: string, @Request() req) {
    // Pasar información del usuario para verificar acceso si es CAJERO
    if (req.user && req.user.rol === 'CAJERO') {
      return this.cajasService.getMovimientosByCajaId(+id, req.user.userId, req.user.rol);
    }
    
    return this.cajasService.getMovimientosByCajaId(+id);
  }
} 