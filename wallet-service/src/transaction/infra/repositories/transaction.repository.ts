import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType as PrismaTransactionType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { Transaction, TransactionType } from '../../domain/entities/transaction.entity';
import { LedgerEntry } from '../../domain/entities/ledger-entry.entity';
import { AppError } from '../../../common/errors/app-error';

@Injectable()
export class TransactionRepository extends ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    idempotencyKey?: string;
  }): Promise<Transaction> {
    const tx = await this.prisma.transaction.create({
      data: {
        userId: data.userId,
        type: data.type as PrismaTransactionType,
        amount: data.amount,
        description: data.description,
        idempotencyKey: data.idempotencyKey,
      },
    });
    return this.toDomain(tx);
  }

  async createWithLedger(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    idempotencyKey?: string;
  }): Promise<{ transaction: Transaction; ledgerEntry: LedgerEntry }> {
    return this.prisma.$transaction(async (tx) => {
      const lockResult = await tx.$queryRaw<{ running_balance: Prisma.Decimal }[]>`
        SELECT COALESCE(
          (SELECT running_balance FROM ledger_entries WHERE user_id = ${data.userId} ORDER BY id DESC LIMIT 1 FOR UPDATE),
          0
        ) as running_balance
      `;

      const currentBalance = Number(lockResult[0]?.running_balance ?? 0);

      if (data.type === TransactionType.WITHDRAWAL && currentBalance < data.amount) {
        throw new AppError('Insufficient balance', 422);
      }

      const newBalance = data.type === TransactionType.DEPOSIT
        ? currentBalance + data.amount
        : currentBalance - data.amount;

      const transaction = await tx.transaction.create({
        data: {
          userId: data.userId,
          type: data.type as PrismaTransactionType,
          amount: data.amount,
          description: data.description,
          idempotencyKey: data.idempotencyKey,
        },
      });

      const ledger = await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          userId: data.userId,
          type: data.type as PrismaTransactionType,
          amount: data.amount,
          runningBalance: newBalance,
        },
      });

      return {
        transaction: this.toDomain(transaction),
        ledgerEntry: this.toLedgerDomain(ledger),
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    return tx ? this.toDomain(tx) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Transaction | null> {
    const tx = await this.prisma.transaction.findUnique({ where: { idempotencyKey: key } });
    return tx ? this.toDomain(tx) : null;
  }

  async findByUserId(filters: {
    userId: string;
    type?: TransactionType;
    limit: number;
    offset: number;
  }): Promise<Transaction[]> {
    const txs = await this.prisma.transaction.findMany({
      where: {
        userId: filters.userId,
        ...(filters.type && { type: filters.type as PrismaTransactionType }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    });
    return txs.map((t) => this.toDomain(t));
  }

  async count(filters: { userId: string; type?: TransactionType }): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        userId: filters.userId,
        ...(filters.type && { type: filters.type as PrismaTransactionType }),
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(raw: any): Transaction {
    return {
      id: raw.id,
      userId: raw.userId,
      type: raw.type as TransactionType,
      amount: Number(raw.amount),
      description: raw.description,
      idempotencyKey: raw.idempotencyKey,
      createdAt: raw.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toLedgerDomain(raw: any): LedgerEntry {
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
