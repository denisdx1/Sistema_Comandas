import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Req, ParseIntPipe, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { CreateOrdenDto, UpdateOrdenDto, CobrarOrdenDto, DevolucionOrdenDto } from './dto/orden.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EstadoOrden } from '@prisma/client';

@Controller('ordenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Post()
  @Roles('MOZO', 'ADMIN', 'CAJERO')
  create(@Body() createOrdenDto: CreateOrdenDto, @Request() req) {
    console.log('Usuario en el controlador:', req.user); // Para depuración
    return this.ordenesService.create(createOrdenDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('rol') rolParam?: string, @Query('includeEntregado') includeEntregadoParam?: string) {
    // Imprimir información más detallada para depuración
    console.log('Datos de la consulta de órdenes:');
    console.log('- Query params:', req.query);
    console.log('- Rol del parámetro:', rolParam);
    console.log('- Incluir entregado:', includeEntregadoParam);
    console.log('- Usuario en request:', req.user ? 'Presente' : 'No presente');
    console.log('- Datos completos del usuario:', JSON.stringify(req.user, null, 2));
    
    // Convertir includeEntregado a boolean
    const includeEntregado = includeEntregadoParam === 'true';
    
    // Extraer el rol del objeto de usuario (puede estar en diferentes formatos)
    let rolUsuario = null;
    
    if (req.user) {
      // Intentar obtener el rol de varias formas posibles
      if (typeof req.user.rol === 'string') {
        rolUsuario = req.user.rol;
      } else if (req.user.rol && typeof req.user.rol.nombre === 'string') {
        rolUsuario = req.user.rol.nombre;
      }
      
      console.log('- Rol extraído del usuario:', rolUsuario);
    }
    
    // Si rol viene explícitamente como BARTENDER en el parámetro, usarlo
    if (rolParam === 'BARTENDER') {
      console.log('Usando rol BARTENDER explícito del parámetro');
      return this.ordenesService.findAll('BARTENDER', includeEntregado, req.user?.userId);
    }
    
    // Usar el rol del usuario si está disponible
    if (rolUsuario) {
      console.log('Usando rol del usuario:', rolUsuario);
      return this.ordenesService.findAll(rolUsuario, includeEntregado, req.user?.userId);
    }
    
    // Si no hay rol disponible, pero el parámetro indica que queremos filtrar, hacer una excepción
    if (req.query.filtrar_por_rol === 'true' && req.user && req.user.rolId) {
      console.log('Intentando obtener rol por ID:', req.user.rolId);
      // Si no pudimos obtener el nombre del rol pero tenemos el ID, intentemos hacer una excepción
      if (req.user.rolId === 2) { // Asumiendo que 2 es el ID del rol BARTENDER
        console.log('ID del rol coincide con BARTENDER, usando este rol');
        return this.ordenesService.findAll('BARTENDER', includeEntregado, req.user?.userId);
      }
    }
    
    // Si no hay rol disponible, devolver todas las órdenes sin filtrar
    console.log('No se pudo determinar el rol, devolviendo órdenes sin filtrar');
    return this.ordenesService.findAll(undefined, includeEntregado, req.user?.userId);
  }

  @Get('estado/:estado')
  findByEstado(@Param('estado') estado: string, @Request() req) {
    return this.ordenesService.findByEstado(estado as any, req.user.rol.nombre, req.user.userId);
  }

  @Get('mis-ordenes')
  @Roles('MOZO')
  findMisOrdenes(@Request() req) {
    return this.ordenesService.findByMozo(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordenesService.findOne(+id);
  }

  @Patch(':id')
  @Roles('BARTENDER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateOrdenDto: UpdateOrdenDto) {
    return this.ordenesService.update(+id, updateOrdenDto);
  }

  @Patch(':id/estado')
  async updateEstado(
    @Param('id') id: string,
    @Body('estado') estado: EstadoOrden,
    @Req() req: any
  ) {
    console.log('Actualizando estado de orden:', { id, estado, user: req.user });
    
    // Verificar que el usuario no es un MOZO
    if (req.user && req.user.rol) {
      let rolNombre = '';
      
      if (typeof req.user.rol === 'string') {
        rolNombre = req.user.rol;
      } else if (req.user.rol.nombre) {
        rolNombre = req.user.rol.nombre;
      }
      
      if (rolNombre === 'MOZO') {
        throw new ForbiddenException('Los mozos no tienen permiso para cambiar el estado de las órdenes');
      }
    }
    
    const orden = await this.ordenesService.updateEstado(+id, estado, req.user);
    return orden;
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.ordenesService.remove(+id);
  }

  @Post(':id/cobrar')
  @Roles('CAJERO', 'ADMIN')
  async cobrarOrden(
    @Param('id') id: string,
    @Body() cobrarOrdenDto: CobrarOrdenDto,
    @Request() req
  ) {
    console.log('Cobrando orden:', { 
      id, 
      cajaId: cobrarOrdenDto.cajaId, 
      metodoPago: cobrarOrdenDto.metodoPago || 'EFECTIVO',
      userId: req.user.userId 
    });
    return this.ordenesService.cobrarOrden(
      +id, 
      cobrarOrdenDto.cajaId, 
      req.user.userId, 
      cobrarOrdenDto.metodoPago || 'EFECTIVO'
    );
  }

  @Get(':id/verificar-cobro')
  @UseGuards(JwtAuthGuard)
  async verificarCobro(@Param('id', ParseIntPipe) id: number) {
    const cobrada = await this.ordenesService.verificarOrdenCobrada(id);
    return { cobrada };
  }

  @Post('cancelar/:id')
  @Roles('ADMIN', 'GERENTE', 'CAJERO', 'MOZO')
  async cancelarOrden(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { motivo: string, revertirPago: boolean },
    @Req() req,
  ) {
    console.log(`Recibida solicitud para cancelar orden #${id}`, {
      usuario: req.user,
      motivo: data.motivo,
      revertirPago: data.revertirPago
    });
    
    if (!data.motivo || data.motivo.trim() === '') {
      throw new BadRequestException('El motivo de cancelación es obligatorio');
    }
    
    try {
      const resultado = await this.ordenesService.cancelarOrden(id, data.motivo, data.revertirPago, req.user);
      return resultado;
    } catch (error) {
      console.error(`Error al procesar cancelación de orden #${id}:`, error);
      throw error;
    }
  }

  @Post(':id/devolver')
  @Roles('CAJERO', 'ADMIN')
  async devolverOrden(
    @Param('id', ParseIntPipe) id: number,
    @Body() devolucionDto: DevolucionOrdenDto,
    @Request() req
  ) {
    console.log(`Procesando devolución de orden #${id}`, {
      cajaId: devolucionDto.cajaId,
      motivo: devolucionDto.motivo,
      reingresarStock: devolucionDto.reingresarStock,
      usuario: req.user.userId
    });

    return this.ordenesService.devolverOrden(
      id,
      devolucionDto.cajaId,
      devolucionDto.motivo,
      devolucionDto.reingresarStock !== false, // Por defecto true si no se especifica
      req.user.userId
    );
  }
}