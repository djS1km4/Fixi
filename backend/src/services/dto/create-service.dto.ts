import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ServiceCategory } from '../../common/enums/service-category.enum';
import { ArrayMinSize } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number; // in minutes

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  deviceTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  issuesHandled?: string[];

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  requirements?: string[];

  @IsOptional()
  @IsEnum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  toolsRequired?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  processDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  workAreas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  serviceTags?: string[];
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issuesHandled?: string[];

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsEnum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsRequired?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  processDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workAreas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceTags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}