// src/notification/notification.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { firstValueFrom } from 'rxjs';
import { ResultEventDto } from './dto/result-event.dto';
import { TokenService } from '../auth/token.service';
import { CustomLogger } from 'src/logger/custom-logger.service';

interface ResultData {
  examName: string;
  score: number;
  grade: string;
  maxScore: number;
  percentage: number;
  status: string;
  date: Date | string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private httpService: HttpService,
    private tokenService: TokenService,
    private customLogger: CustomLogger,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter configuration error:', error);
      } else {
        this.logger.log('Email transporter is ready');
      }
    });
  }

  async sendResultEmail(payload: ResultEventDto): Promise<void> {
    const { studentId, resultData } = payload;
    let studentInfo: { email: string; name?: string } | null = null;

    try {
      // Get student email and details
      studentInfo = await this.getStudentInfo(studentId);

      if (!studentInfo.email) {
        throw new Error(`No email found for student ID: ${studentId}`);
      }

      // Generate email content
      const emailContent = this.generateEmailContent(studentInfo, resultData);

      const mailOptions = {
        from: `"Exam Board" <${process.env.SMTP_USER}>`,
        to: studentInfo.email,
        subject: 'Your Exam Result is Published',
        html: emailContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Result email sent successfully to ${studentInfo.email} for student ${studentId}`,
      );

      let msg="";
      if(studentInfo.email === 'parthkulkarni1602@gmail.com'){
        msg = ' to fallback email';
      }
      this.customLogger.log({
        level: 'info',
        message: 'Result email sent successfully'+msg,
        studentId: studentId,
        email: studentInfo.email,
        status: 'success',
        examName: resultData.examName,
        score: resultData.score,
        grade: resultData.grade,
        percentage: resultData.percentage,
        resultDate: resultData.date,
      });

    } catch (error) {
      this.logger.error(
        `Failed to send result email for student ${studentId}:`,
        error.message,
      );
      this.customLogger.error({
        level: 'error',
        message: 'Failed to send result email',
        studentId: studentId,
        email: studentInfo?.email || 'unknown',
        status: 'failure',
        examName: resultData?.examName,
        score: resultData?.score,
        grade: resultData?.grade,
        scoreOutOf: resultData?.maxScore,
        resultDate: resultData?.date,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async getStudentInfo(
    studentId: string,
  ): Promise<{ email: string; name?: string }> {
    try {
      const token = this.tokenService.getToken();
      const userServiceUrl =
        process.env.USER_SERVICE_URL || 'http://localhost:3001';
      const response = await firstValueFrom(
        this.httpService.get(
          `${userServiceUrl}/users/internal/student/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-service-token': process.env.SERVICE_AUTH_TOKEN || 'abcde',
            },
            timeout: 10000,
          },
        ),
      );

      return {
        email: response.data.data.email,
        name:
          response.data.data.name || response.data.user.firstName || 'Student',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch student info for ID ${studentId}:`,
        error.message,
      );

      // If this is a critical failure, throw error
      // For testing purposes, use a fallback
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Using fallback email for student ${studentId}`);

        this.customLogger.warn({
            level: 'warn',
            message: 'Using fallback email due to student info fetch failure',
            studentId,
            email: process.env.FALLBACK_EMAIL || 'parthkulkarni1602@gmail.com',
            status: 'fallback-used',
            errorMessage: error.message,
            timestamp: new Date(),
          });

        return {
          email: process.env.FALLBACK_EMAIL || 'parthkulkarni1602@gmail.com',
          name: 'Test Student',
        };
      }

      throw error;
    }
  }

  private generateEmailContent(
    studentInfo: { email: string; name?: string },
    resultData: any,
  ): string {
    const studentName = studentInfo.name || 'Student';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .result-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Exam Result Notification</h2>
          </div>
          <div class="content">
            <h3>Dear ${studentName},</h3>
            <p>We are pleased to inform you that your exam result has been published.</p>
            
            <div class="result-box">
              <h4>Result Details:</h4>
              ${this.formatResultData(resultData)}
            </div>
            
            <p>If you have any questions about your result, please contact the examination board.</p><br>
            <p>This email is for immediate information only and cannot be treated as original statement of marks. Please verify the information from the original statement of marks issued by Examination Board separately.</p><br>
            
            <p>Best regards,<br>
            Examination Board</p>
          </div>
          <div class="footer">
            <p>This is an automated email and replies to this are not monitored. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private formatResultData(resultData: ResultData): string {
    if (!resultData) return '<p>No result data available</p>';

    try {
      // Format the result data in a user-friendly way
      let formattedResult = '';

      if (resultData.examName) {
        formattedResult += `<p><strong>Exam:</strong> ${resultData.examName}</p>`;
      }

      if (resultData.score !== undefined) {
        formattedResult += `<p><strong>Score:</strong> ${resultData.score}</p>`;
      }

      if (resultData.grade) {
        formattedResult += `<p><strong>Grade:</strong> ${resultData.grade}</p>`;
      }

      if (resultData.maxScore) {
        formattedResult += `<p><strong>Maximum Score:</strong> ${resultData.maxScore}</p>`;
      }

      if (resultData.percentage) {
        formattedResult += `<p><strong>Percentage:</strong> ${resultData.percentage}%</p>`;
      }

      if (resultData.status) {
        formattedResult += `<p><strong>Status:</strong> ${resultData.status}</p>`;
      }

      if (resultData.date) {
        formattedResult += `<p><strong>Result Date:</strong> ${new Date(resultData.date).toLocaleDateString()}</p>`;
      }

      // If no specific fields are found, display the raw data in a formatted way
      if (!formattedResult) {
        formattedResult = `<pre>${JSON.stringify(resultData, null, 2)}</pre>`;
      }

      return formattedResult;
    } catch (error) {
      this.logger.error('Error formatting result data:', error);
      return `<pre>${JSON.stringify(resultData, null, 2)}</pre>`;
    }
  }
}
