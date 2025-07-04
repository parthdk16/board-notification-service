// src/notification/dto/result-event.dto.ts
import { IsString, IsObject, IsNumber, IsOptional } from 'class-validator';

export class ResultEventDto {
  @IsString()
  studentId: string;

  @IsObject()
  resultData: Record<string, any>;
}

class ResultDataDto {
  @IsString()
  examName: string;
  @IsNumber()
  score: number;
  @IsString()
  grade: string;
  @IsNumber()
  maxScore: number;
  @IsString()
  status: string;
  @IsString()
  date: string;
  // You can add more fields as necessary
}
