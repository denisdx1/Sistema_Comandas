import { IsString, IsNotEmpty, IsNumber, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  VENTA = 'VENTA'
}

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento)
  @IsNotEmpty()
  tipo: TipoMovimiento;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsNotEmpty()
  cantidad: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  productoId: number;
}

export class MovimientoFilterDto {
  @IsOptional()
  @IsEnum(TipoMovimiento)
  tipo?: TipoMovimiento;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productoId?: number;

  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;
} 