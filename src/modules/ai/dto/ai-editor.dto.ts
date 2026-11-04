import { IsString, IsNotEmpty } from 'class-validator';

export class AiEditorRequestDto {
  @IsString()
  @IsNotEmpty()
  raw_description: string;
}

export class AiEditorResponseDto {
  @IsString()
  @IsNotEmpty()
  technical_description: string;

  @IsString()
  @IsNotEmpty()
  client_description: string;
}