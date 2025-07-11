import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CombosService } from './combos.service';
import { CreateComboDto, UpdateComboDto } from './dto/combo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DisponibilidadCombo } from './combos.service';
@Controller('combos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Post()
  @Roles('ADMIN', 'CAJERO')
  create(@Body() createComboDto: CreateComboDto) {
    return this.combosService.create(createComboDto);
  }

  @Get()
  findAll(@Req() req: any) {
    // Si es admin o cajero, mostrar todos los combos incluso inactivos
    if (['ADMIN', 'CAJERO'].includes(req.user.rol.nombre)) {
      return this.combosService.findAllAdmin();
    }
    // Para otros roles, solo mostrar combos activos
    return this.combosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.combosService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'CAJERO')
  update(@Param('id') id: string, @Body() updateComboDto: UpdateComboDto) {
    return this.combosService.update(+id, updateComboDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.combosService.remove(+id);
  }

  @Get(':id/disponibilidad')
  verificarDisponibilidad(@Param('id') id: string): Promise<DisponibilidadCombo> {
    return this.combosService.verificarDisponibilidad(+id);
  }
} 