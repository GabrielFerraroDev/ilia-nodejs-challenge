import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { IRefreshTokenRepository } from '../../domain/interfaces/repositories/refresh-token-repository.interface';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.refreshTokenRepo.findByToken(tokenHash);
    if (record && !record.revokedAt) {
      await this.refreshTokenRepo.revoke(tokenHash);
    }
  }
}
