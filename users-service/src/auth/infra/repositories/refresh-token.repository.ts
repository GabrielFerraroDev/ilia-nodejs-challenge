import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IRefreshTokenRepository,
  RefreshTokenRecord,
} from '../../domain/interfaces/repositories/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenRepository extends IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken.create({ data }) as unknown as RefreshTokenRecord;
  }

  async findByToken(token: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } }) as unknown as RefreshTokenRecord | null;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
