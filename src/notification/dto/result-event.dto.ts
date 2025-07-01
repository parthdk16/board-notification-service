// src/notification/dto/result-event.dto.ts
import { IsString, IsObject } from 'class-validator';

export class ResultEventDto {
  @IsString()
  studentId: string;

  @IsObject()
  resultData: Record<string, any>;
}
