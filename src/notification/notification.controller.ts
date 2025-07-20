// src/notification/notification.controller.ts
import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ResultEventDto } from './dto/result-event.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Channel } from 'amqplib';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('result_published')
  // @UsePipes(new ValidationPipe({ transform: true }))
  async handleResultPublished(
    @Payload() data: ResultEventDto,
    @Ctx() context: RmqContext,
  ) {
    console.log('Received event: result_published, data: ', data);
    const { studentId, resultData } = data;
    console.log('Student ID / Roll Number:', studentId);
    console.log('Exam Name:', resultData.examName);
    console.log('Score:', resultData.score);
    console.log('Grade:', resultData.grade);
    console.log('Max Score:', resultData.maxScore);
    console.log('Status:', resultData.status);
    console.log('Date:', resultData.date);
    try {
      await this.notificationService.sendResultEmail(data);

      // Acknowledge the message after successful processing
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      console.log(
        'Successfully processed result notification for student:',
        data.studentId,
      );
    } catch (error) {
      console.error('Error processing result notification:', error);

      // Reject the message and requeue it for retry
      const channel: Channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return { status: 'ok', service: 'notification-service' };
  }
}
