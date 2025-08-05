import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-mongodb';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.MongoDB({
          level: 'info',
          db:
            process.env.MONGO_LOG_URI ||
            'mongodb://127.0.0.1:27017/board_exam_users',
          options: { useUnifiedTopology: true },
          collection: 'notification_logs',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    });
  }

  log(message: any) {
    this.logger.info(message);
  }

  error(message: any, trace?: string) {
    this.logger.error({ message, trace });
  }

  warn(message: any) {
    this.logger.warn(message);
  }

  debug?(message: any) {
    this.logger.debug?.(message);
  }

  verbose?(message: any) {
    this.logger.verbose?.(message);
  }
}
