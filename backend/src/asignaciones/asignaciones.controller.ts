import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AsignacionesService } from './asignaciones.service';
import { CreateAsignacionDto, UpdateAsignacionDto, AsignacionFilterDto } from './dto/asignacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('asignaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsignacionesController {
  constructor(private readonly asignacionesService: AsignacionesService) {}

  @Post()
  @Roles('ADMIN', 'BARTENDER', 'CAJERO')
  create(@Body() createAsignacionDto: CreateAsignacionDto) {
    return this.asignacionesService.create(createAsignacionDto);
  }

  @Get()
  @Roles('ADMIN', 'BARTENDER', 'CAJERO', 'MOZO')
  findAll(@Query() filters: AsignacionFilterDto) {
    return this.asignacionesService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'BARTENDER', 'CAJERO', 'MOZO')
  findOne(@Param('id') id: string) {
    return this.asignacionesService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'BARTENDER', 'CAJERO')
  update(@Param('id') id: string, @Body() updateAsignacionDto: UpdateAsignacionDto) {
    return this.asignacionesService.update(+id, updateAsignacionDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'BARTENDER')
  remove(@Param('id') id: string) {
    return this.asignacionesService.remove(+id);
  }

  @Get('bartender/:id')
  @Roles('ADMIN', 'BARTENDER', 'CAJERO', 'MOZO')
  getAsignacionActivaBartender(@Param('id') id: string) {
    return this.asignacionesService.getAsignacionActivaBartender(+id);
  }

  @Get('mozo/:id')
  @Roles('ADMIN', 'BARTENDER', 'CAJERO', 'MOZO')
  getAsignacionActivaMozo(@Param('id') id: string) {
    return this.asignacionesService.getAsignacionActivaMozo(+id);
  }

  @Get('caja/:id')
  @Roles('ADMIN', 'BARTENDER', 'CAJERO', 'MOZO')
  getAsignacionesActivasCaja(@Param('id') id: string) {
    return this.asignacionesService.getAsignacionesActivasCaja(+id);
  }
} 