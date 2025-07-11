import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAsignacionDto {
  @IsInt()
  @Type(() => Number)
  bartenderId: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  mozoId?: number;

  @IsInt()
  @Type(() => Number)
  cajaId: number;
}

export class UpdateAsignacionDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  bartenderId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  mozoId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cajaId?: number;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

export class AsignacionFilterDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  bartenderId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  mozoId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cajaId?: number;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
} 