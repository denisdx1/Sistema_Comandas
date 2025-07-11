import { IsEmail, IsString, IsInt, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  rolId: number;
  
  @IsString()
  @IsOptional()
  telefono?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsInt()
  @IsOptional()
  rolId?: number;
  
  @IsString()
  @IsOptional()
  telefono?: string;
} 