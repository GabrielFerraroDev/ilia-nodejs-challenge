import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { IRefreshTokenRepository } from '../../domain/interfaces/repositories/refresh-token-repository.interface';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({ userId: user.id });

    const refreshToken = crypto.randomUUID();
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({
      token: refreshTokenHash,
      userId: user.id,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
