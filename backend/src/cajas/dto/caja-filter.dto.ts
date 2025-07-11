import { IsEnum, IsOptional, IsString } from 'class-validator';

enum EstadoCaja {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

export class CajaFilterDto {
  @IsEnum(EstadoCaja)
  @IsOptional()
  estado?: EstadoCaja;

  @IsString()
  @IsOptional()
  fechaDesde?: string;

  @IsString()
  @IsOptional()
  fechaHasta?: string;
  
  @IsString()
  @IsOptional()
  sucursalId?: string;
} 