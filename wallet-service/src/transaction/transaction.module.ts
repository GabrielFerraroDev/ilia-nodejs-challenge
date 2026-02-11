import { Module } from '@nestjs/common';
import { TransactionController } from './infra/controllers/transaction.controller';
import { TransactionMessageController } from './infra/controllers/transaction.message.controller';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { FindTransactionByIdUseCase } from './application/use-cases/find-transaction-by-id.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { ITransactionRepository } from './domain/interfaces/repositories/transaction-repository.interface';
import { ILedgerRepository } from './domain/interfaces/repositories/ledger-repository.interface';
import { IIdempotencyRepository } from './domain/interfaces/repositories/idempotency-repository.interface';
import { TransactionRepository } from './infra/repositories/transaction.repository';
import { LedgerRepository } from './infra/repositories/ledger.repository';
import { IdempotencyRepository } from './infra/repositories/idempotency.repository';

@Module({
  controllers: [TransactionController, TransactionMessageController],
  providers: [
    CreateTransactionUseCase,
    FindTransactionByIdUseCase,
    ListTransactionsUseCase,
    GetBalanceUseCase,
    { provide: ITransactionRepository, useClass: TransactionRepository },
    { provide: ILedgerRepository, useClass: LedgerRepository },
    { provide: IIdempotencyRepository, useClass: IdempotencyRepository },
  ],
  exports: [
    CreateTransactionUseCase,
    FindTransactionByIdUseCase,
    ListTransactionsUseCase,
    GetBalanceUseCase,
  ],
})
export class TransactionModule {}
