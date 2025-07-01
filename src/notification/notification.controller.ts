// src/notification/notification.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ResultEventDto } from './dto/result-event.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('result_published')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleResultPublished(@Payload() data: ResultEventDto) {
    console.log('Received event: result_published', data);
    await this.notificationService.sendResultEmail(data);
  }
}
