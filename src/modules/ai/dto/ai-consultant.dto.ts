import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsOptional,
  IsInt,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// 1.2.1.1 HOURS — estimated hours by role
export class HoursDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsInt({ each: true })
  design?: [number, number] | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsInt({ each: true })
  frontend?: [number, number] | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsInt({ each: true })
  backend?: [number, number] | null;
}

// 1.2.1 GRADE OPTIONS — couple of grades with hours
export class GradeOptionDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  grades: string[];

  @IsBoolean()
  is_recommended: boolean;

  @ValidateNested()
  @Type(() => HoursDto)
  hours: HoursDto;
}

// 1.2 PRICING OPTIONS — stack + list of grade pairs
export class PricingOptionDto {
  @IsOptional()
  @IsString()
  stack: string | null;

  @IsBoolean()
  is_recommended: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeOptionDto)
  grade_options: GradeOptionDto[];
}

// 1.1.1.1 SPECIFICATION HEADER — stack, grade, price placeholder
export class SpecificationHeaderDto {
  @IsString()
  @IsNotEmpty()
  stack: string;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsString()
  @IsNotEmpty()
  total_price_placeholder: string; // "{{TOTAL_PRICE}}"
}

// 1.1.1.2 TECHNICAL SPEC BY ROLE — block for a single role
export class TechnicalSpecByRoleDto {
  @IsString()
  @IsNotEmpty()
  role_name: string;

  @IsString()
  @IsNotEmpty()
  price_placeholder: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];
}

// 1.1.1.3 SPECIFICATION FOOTER — customer comments + materials
export class SpecificationFooterDto {
  @IsOptional()
  @IsString()
  customer_comments: string | null;

  @IsArray()
  @IsString({ each: true })
  required_materials_list: string[];
}

// 1.1.1 SPECIFICATION — final Technical Task (nested in order_data.specification)
export class SpecificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @ValidateNested()
  @Type(() => SpecificationHeaderDto)
  header: SpecificationHeaderDto;

  @IsObject()
  business_context: Record<string, any>;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TechnicalSpecByRoleDto)
  technical_spec_by_roles: TechnicalSpecByRoleDto[];

  @ValidateNested()
  @Type(() => SpecificationFooterDto)
  footer: SpecificationFooterDto;
}

// 1.1 ORDER DATA — final Technical Task preparation
export class OrderDataDto {
  @IsOptional()
  @IsString()
  title: string | null;

  @IsOptional()
  @IsString()
  specification: string | null;

  @IsArray()
  @IsString({ each: true })
  stack: string[];

  @IsOptional()
  @IsString()
  gradeRequired: string | null;

  @IsArray()
  @IsString({ each: true })
  role: string[];

  @IsOptional()
  @IsString()
  customer_comments: string | null;

  @IsArray()
  @IsString({ each: true })
  required_materials_list: string[];
}

// 1. AI JSON FIELDS — Core AI-message answer
export class AiJsonFieldsDto {
  @IsString()
  @IsNotEmpty()
  chat_message: string;

  @IsArray()
  @IsString({ each: true })
  suggested_buttons: string[];

  @IsBoolean()
  is_initial_phase: boolean;

  @IsBoolean()
  is_final_spec: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingOptionDto)
  pricing_options: PricingOptionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderDataDto)
  order_data: OrderDataDto | null;
}

// CLIENT MESSAGE
export class ClientMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
