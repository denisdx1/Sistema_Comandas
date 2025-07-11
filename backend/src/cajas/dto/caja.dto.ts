import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsPositive, IsDate, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

enum EstadoCaja {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

enum TipoMovimientoCaja {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
  VENTA = 'VENTA',
  DEVOLUCION = 'DEVOLUCION'
}

export class AperturaCajaDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  saldoInicial: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
  sucursalId: any;
}

export class CierreCajaDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  saldoFinal: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class CreateMovimientoCajaDto {
  @IsEnum(TipoMovimientoCaja)
  @IsNotEmpty()
  tipo: TipoMovimientoCaja;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  monto: number;

  @IsString()
  @IsNotEmpty()
  concepto: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  ordenId?: number;
}

export class CajaFilterDto {
  @IsOptional()
  @IsEnum(EstadoCaja)
  estado?: EstadoCaja;

  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;
} 