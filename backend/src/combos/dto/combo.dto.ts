import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ComboProductoDto {
  @IsNumber()
  @IsPositive()
  productoId: number;

  @IsNumber()
  @IsPositive()
  cantidad: number;
}

export class CreateComboDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsPositive()
  precio: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboProductoDto)
  productos: ComboProductoDto[];

  @IsBoolean()
  @IsOptional()
  activo?: boolean = true;
}

export class UpdateComboDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  precio?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboProductoDto)
  @IsOptional()
  productos?: ComboProductoDto[];

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
} 