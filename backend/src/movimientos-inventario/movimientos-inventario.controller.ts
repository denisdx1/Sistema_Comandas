import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { MovimientosInventarioService } from './movimientos-inventario.service';
import { CreateMovimientoDto, MovimientoFilterDto } from './dto/movimiento-inventario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('movimientos-inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovimientosInventarioController {
  constructor(private readonly movimientosService: MovimientosInventarioService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createMovimientoDto: CreateMovimientoDto, @Request() req) {
    console.log('Usuario autenticado:', req.user);
    
    // Verificar que req.user exista y tenga un userId
    if (!req.user || !req.user.userId) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    
    // Usar userId del objeto user del request
    return this.movimientosService.create(createMovimientoDto, req.user.userId);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() filters: MovimientoFilterDto) {
    return this.movimientosService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.movimientosService.findOne(+id);
  }
} 