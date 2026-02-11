import { TransactionType } from './transaction.entity';

export interface LedgerEntry {
  id: number;
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  runningBalance: number;
  createdAt: Date;
}
