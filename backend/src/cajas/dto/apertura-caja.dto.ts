import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsPositive, IsDate, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AperturaCajaDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  saldoInicial: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
  
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  sucursalId: number;
  
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  cajeroId?: number;
} 