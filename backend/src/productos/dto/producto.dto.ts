import { IsString, IsNotEmpty, IsNumber, IsPositive, Min, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  @Min(0)
  precio: number;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  stock: number = 0;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  categoriaId: number;
}

export class UpdateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  @Min(0)
  precio: number;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  stock: number;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  categoriaId: number;
} 