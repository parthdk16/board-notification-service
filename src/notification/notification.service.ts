// src/notification/notification.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(private httpService: HttpService) {}

  async sendResultEmail(payload: any) {
    const { studentId, resultData } = payload;

    // (Optional) Get email from user service
    const email = await this.getStudentEmail(studentId);

    // Send email
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Exam Board" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Exam Result is Published',
      html: `<h3>Dear Student,</h3>
             <p>Your result is:</p>
             <pre>${JSON.stringify(resultData, null, 2)}</pre>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Result email sent to ${email}`);
  }

  async getStudentEmail(studentId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://localhost:3000/user/${studentId}`), // adjust URL
      );
      return response.data.email;
    } catch (err) {
      console.error('Failed to fetch student email', err.message);
      return 'default@example.com'; // fallback for testing
    }
  }
}
