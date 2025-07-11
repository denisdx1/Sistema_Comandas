import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}

export class UpdateRolDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
} 