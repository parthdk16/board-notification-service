// src/auth/token.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService implements OnModuleInit {
  private token: string;

  constructor(private readonly jwtService: JwtService) {}

  onModuleInit() {
    this.token = this.jwtService.sign(
      { service: 'notification-service', role: 'internal' },
      { expiresIn: '5m' },
    );
  }

  getToken(): string {
    return this.token;
  }
}
