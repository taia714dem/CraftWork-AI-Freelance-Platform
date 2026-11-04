import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsArray, 
  IsBoolean, 
  ValidateNested,
  IsInt,
  IsIn,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';

export class AiGradeResponseDto {
  @IsString()
  @IsIn(['Junior', 'Junior+', 'Middle', 'Middle+', 'Senior'])
  calculated_grade: string;

  @IsInt()
  @Min(0)
  @Max(100)
  confidence_score: number;

  @IsString()
  @IsNotEmpty()
  reasoning: string;
}