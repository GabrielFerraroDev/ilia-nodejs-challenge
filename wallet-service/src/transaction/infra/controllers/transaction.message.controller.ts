import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case';
import { FindTransactionByIdUseCase } from '../../application/use-cases/find-transaction-by-id.use-case';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { TransactionType } from '../../domain/entities/transaction.entity';

@Controller()
export class TransactionMessageController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly findTransactionById: FindTransactionByIdUseCase,
    private readonly getBalance: GetBalanceUseCase,
  ) {}

  @MessagePattern('wallet.create_transaction')
  async handleCreateTransaction(@Payload() data: {
    userId: string;
    type: string;
    amount: number;
    description?: string;
    idempotencyKey?: string;
  }) {
    return this.createTransaction.execute({
      ...data,
      type: data.type as TransactionType,
    });
  }

  @MessagePattern('wallet.get_balance')
  async handleGetBalance(@Payload() data: { userId: string }) {
    return this.getBalance.execute(data.userId);
  }

  @MessagePattern('wallet.list_transactions')
  async handleListTransactions(@Payload() data: {
    userId: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.listTransactions.execute({
      ...data,
      type: data.type as TransactionType | undefined,
    });
  }

  @MessagePattern('wallet.get_transaction')
  async handleGetTransaction(@Payload() data: { id: string; userId: string }) {
    return this.findTransactionById.execute(data.id, data.userId);
  }
}
