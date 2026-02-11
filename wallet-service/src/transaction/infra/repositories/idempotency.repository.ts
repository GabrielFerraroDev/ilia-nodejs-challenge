import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IIdempotencyRepository } from '../../domain/interfaces/repositories/idempotency-repository.interface';
import { IdempotencyRecord } from '../../domain/entities/idempotency-record.entity';

@Injectable()
export class IdempotencyRepository extends IIdempotencyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByKey(key: string, userId: string): Promise<IdempotencyRecord | null> {
    const record = await this.prisma.idempotencyRecord.findFirst({
      where: { key, userId, expiresAt: { gt: new Date() } },
    });
    return record ?? null;
  }

  async save(data: {
    key: string;
    userId: string;
    responseBody: string;
    statusCode: number;
    expiresAt: Date;
  }): Promise<IdempotencyRecord> {
    return this.prisma.idempotencyRecord.create({ data });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.idempotencyRecord.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
