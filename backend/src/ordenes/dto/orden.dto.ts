import { IsArray, IsNotEmpty, ValidateNested, IsNumber, IsPositive, Min, IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ComplementoDto {
  @IsNumber()
  @IsPositive()
  productoId: number;

  @IsNumber()
  @IsPositive()
  cantidad: number;
  
  @IsString()
  @IsOptional()
  tipoComplemento?: 'NO_ES_COMPLEMENTO' | 'BEBIDA_PARA_LICOR' | 'OTRO_COMPLEMENTO';
}

export class OrdenItemDto {
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @IsOptional()
  productoId?: number;

  @IsNumber()
  @IsOptional()
  comboId?: number;

  @IsNumber()
  @IsOptional()
  promocionId?: number;

  @IsBoolean()
  @IsOptional()
  promocionPersonalizada?: boolean;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  precio?: number;

  @IsString()
  @IsOptional()
  notas?: string;
  
  @IsBoolean()
  @IsOptional()
  esComplemento?: boolean;
  
  @IsString()
  @IsOptional()
  @IsEnum(['NO_ES_COMPLEMENTO', 'BEBIDA_PARA_LICOR', 'OTRO_COMPLEMENTO'], {
    message: 'Tipo de complemento inválido. Opciones válidas: NO_ES_COMPLEMENTO, BEBIDA_PARA_LICOR, OTRO_COMPLEMENTO'
  })
  tipoComplemento?: string;
  
  @IsNumber()
  @IsOptional()
  productoAsociadoId?: number;
  
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ComplementoDto)
  complementos?: ComplementoDto[];
}

export class CreateOrdenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenItemDto)
  items: OrdenItemDto[];

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  mesa?: string;
}

export class UpdateOrdenDto {
  @IsString()
  @IsNotEmpty()
  estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
}

export class CobrarOrdenDto {
  @IsInt()
  @IsNotEmpty()
  cajaId: number;

  @IsString()
  @IsOptional()
  @IsEnum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'], {
    message: 'Método de pago inválido. Opciones válidas: EFECTIVO, TARJETA, TRANSFERENCIA, OTRO'
  })
  metodoPago?: string = 'EFECTIVO';
}

export class DevolucionOrdenDto {
  @IsInt()
  @IsNotEmpty()
  cajaId: number;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsBoolean()
  @IsOptional()
  reingresarStock: boolean = true;
}