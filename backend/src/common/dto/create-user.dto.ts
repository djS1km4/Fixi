import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  documentNumber?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString({ each: true })
  @ArrayMinSize(1)
  specialties?: string[];

  @IsOptional()
  @IsString({ each: true })
  @ArrayMinSize(1)
  workAreas?: string[];

  @IsOptional()
  @IsString()
  rutNumber?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsString({ each: true })
  workAreas?: string[];
}