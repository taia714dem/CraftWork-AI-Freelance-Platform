import { IsString, IsArray, IsNumber } from 'class-validator';


export class CreateOrderDto {
  @IsString()
  title: string;

  @IsString()
  specification: string;

  @IsArray()
  @IsString({ each: true })
  role: string []; 

  @IsArray()
  @IsString({ each: true })
  stack: string[]; 

  @IsString()
  gradeRequired: string;

  clientId?: string; 
  
  @IsNumber()
  totalPriceRub: number;
}