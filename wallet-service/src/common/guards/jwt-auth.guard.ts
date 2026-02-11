import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = jwt.verify(token, secret) as { userId: string };
      request.userId = payload.userId;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
