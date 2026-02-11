import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { AppError } from '../../../common/errors/app-error';

@Injectable()
export class FindTransactionByIdUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(id: string, userId: string): Promise<Transaction> {
    const tx = await this.transactionRepo.findById(id);
    if (!tx) throw new AppError('Transaction not found', 404);
    if (tx.userId !== userId) throw new AppError('Transaction not found', 404);
    return tx;
  }
}
