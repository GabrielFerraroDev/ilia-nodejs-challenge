import { Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from '../../domain/interfaces/repositories/refresh-token-repository.interface';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(token: string) {
    const record = await this.refreshTokenRepo.findByToken(token);
    if (record && !record.revokedAt) {
      await this.refreshTokenRepo.revoke(token);
    }
  }
}
