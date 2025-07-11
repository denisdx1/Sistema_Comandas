import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sucursales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createSucursalDto: CreateSucursalDto) {
    return this.sucursalesService.create(createSucursalDto);
  }

  @Get()
  @Roles('ADMIN', 'CAJERO')
  findAll() {
    return this.sucursalesService.findAll();
  }

  @Get('resumen')
  @Roles('ADMIN')
  getResumenSucursales() {
    return this.sucursalesService.getResumenSucursales();
  }

  @Get(':id')
  @Roles('ADMIN', 'CAJERO')
  findOne(@Param('id') id: string) {
    return this.sucursalesService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateSucursalDto: UpdateSucursalDto) {
    return this.sucursalesService.update(+id, updateSucursalDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.sucursalesService.remove(+id);
  }
} 