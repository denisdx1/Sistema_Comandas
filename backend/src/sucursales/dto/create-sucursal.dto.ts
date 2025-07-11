import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateSucursalDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
  
  @IsBoolean()
  @IsOptional()
  activa?: boolean;
} 