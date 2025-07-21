// src/logger/logs.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { LogQueryDto } from './dto/log-query.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Get filtered logs' })
  @ApiResponse({ status: 200, description: 'List of logs' })
  async getLogs(@Query() query: LogQueryDto) {
    const filters: any = {};

    if (query.startDate || query.endDate) {
      filters.timestamp = {};
      if (query.startDate) filters.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filters.timestamp.$lte = new Date(query.endDate);
    }

    if (query.level) filters.level = query.level;
    if (query.status) filters['metadata.status'] = query.status;
    if (query.studentId) filters['metadata.studentId'] = query.studentId;

    const logs = await this.connection
      .collection('notification_logs')
      .find(filters)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return logs;
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary of logs by level' })
  @ApiResponse({ status: 200, description: 'Summary of logs grouped by level' })
  async getLogSummary() {
  const summary = await this.connection
      .collection('notification_logs')
      .aggregate([
      {
          $group: {
          _id: '$level',
          count: { $sum: 1 },
          },
      },
      {
          $project: {
          _id: 0,
          level: '$_id',
          count: 1,
          },
      },
      ])
      .toArray();

  return summary;
  }
}
