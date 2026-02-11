import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { IRefreshTokenRepository } from '../../domain/interfaces/repositories/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.refreshTokenRepo.findByToken(tokenHash);

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.jwtService.sign({ userId: record.userId });
    return { accessToken };
  }
}
