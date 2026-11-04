import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class AiMatchingResponseDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  @IsNotEmpty()
  reasoning: string;
}