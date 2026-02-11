import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { TransactionType } from '../../domain/entities/transaction.entity';

@Injectable()
export class ListTransactionsUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(filters: {
    userId: string;
    type?: TransactionType;
    limit?: number;
    offset?: number;
  }) {
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    const [transactions, total] = await Promise.all([
      this.transactionRepo.findByUserId({ ...filters, limit, offset }),
      this.transactionRepo.count({ userId: filters.userId, type: filters.type }),
    ]);

    return { transactions, total, limit, offset };
  }
}
