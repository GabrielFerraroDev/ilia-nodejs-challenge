import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ILedgerRepository } from '../../domain/interfaces/repositories/ledger-repository.interface';
import { LedgerEntry } from '../../domain/entities/ledger-entry.entity';
import { TransactionType } from '../../domain/entities/transaction.entity';

@Injectable()
export class LedgerRepository extends ILedgerRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getLatestEntry(userId: string): Promise<LedgerEntry | null> {
    const entry = await this.prisma.ledgerEntry.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
    });
    return entry ? this.toDomain(entry) : null;
  }

  async getEntriesByUserId(userId: string, limit = 20, offset = 0): Promise<LedgerEntry[]> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: limit,
      skip: offset,
    });
    return entries.map((e) => this.toDomain(e));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(raw: any): LedgerEntry {
    return {
      id: raw.id,
      transactionId: raw.transactionId,
      userId: raw.userId,
      type: raw.type as TransactionType,
      amount: Number(raw.amount),
      runningBalance: Number(raw.runningBalance),
      createdAt: raw.createdAt,
    };
  }
}
