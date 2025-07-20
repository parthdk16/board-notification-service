import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification/notification.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [HttpModule, AuthModule, LoggerModule],
  controllers: [AppController, NotificationController],
  providers: [AppService, NotificationService],
})
export class AppModule {}
