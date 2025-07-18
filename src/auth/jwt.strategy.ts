import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-super-secret-jwt-key-here',
    });
  }

  // validate(payload: JwtPayload) {
  //   return { userId: payload.sub, email: payload.email, role: payload.role };
  // }

  validate(payload: JwtPayload) {
    if (payload.sub && payload.email) {
      // User token
      return { userId: payload.sub, email: payload.email, role: payload.role };
    } else if (payload.service) {
      // Service token
      return { service: payload.service, role: payload.role };
    } else {
      throw new UnauthorizedException('Invalid token payload');
    }
  }
}
