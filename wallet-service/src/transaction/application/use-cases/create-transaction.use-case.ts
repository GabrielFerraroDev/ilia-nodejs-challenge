import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { IIdempotencyRepository } from '../../domain/interfaces/repositories/idempotency-repository.interface';
import { Transaction, TransactionType } from '../../domain/entities/transaction.entity';
import { AppError } from '../../../common/errors/app-error';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly idempotencyRepo: IIdempotencyRepository,
  ) {}

  async execute(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    idempotencyKey?: string;
  }): Promise<Transaction> {
    if (data.amount <= 0) {
      throw new AppError('Amount must be greater than zero');
    }

    if (data.idempotencyKey) {
      const existing = await this.transactionRepo.findByIdempotencyKey(data.idempotencyKey);
      if (existing) return existing;
    }

    const { transaction } = await this.transactionRepo.createWithLedger(data);

    if (data.idempotencyKey) {
      await this.idempotencyRepo.save({
        key: data.idempotencyKey,
        userId: data.userId,
        responseBody: JSON.stringify(transaction),
        statusCode: 201,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    return transaction;
  }
}
