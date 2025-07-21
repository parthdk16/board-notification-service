import { Module } from '@nestjs/common';
import { CustomLogger } from './custom-logger.service';
import { LogsController } from './logger.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_LOG_URI || 'mongodb://localhost:27017/board_exam_users'),
  ],
  controllers: [LogsController],
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
