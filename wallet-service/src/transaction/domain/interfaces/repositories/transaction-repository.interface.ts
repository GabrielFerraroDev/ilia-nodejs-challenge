import { Transaction, TransactionType } from '../../entities/transaction.entity';
import { LedgerEntry } from '../../entities/ledger-entry.entity';

export abstract class ITransactionRepository {
  abstract create(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    idempotencyKey?: string;
  }): Promise<Transaction>;

  abstract createWithLedger(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    idempotencyKey?: string;
  }): Promise<{ transaction: Transaction; ledgerEntry: LedgerEntry }>;

  abstract findById(id: string): Promise<Transaction | null>;

  abstract findByIdempotencyKey(key: string): Promise<Transaction | null>;

  abstract findByUserId(filters: {
    userId: string;
    type?: TransactionType;
    limit: number;
    offset: number;
  }): Promise<Transaction[]>;

  abstract count(filters: { userId: string; type?: TransactionType }): Promise<number>;
}
