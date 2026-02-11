import { LedgerEntry } from '../../entities/ledger-entry.entity';

export abstract class ILedgerRepository {
  abstract getLatestEntry(userId: string): Promise<LedgerEntry | null>;

  abstract getEntriesByUserId(userId: string, limit?: number, offset?: number): Promise<LedgerEntry[]>;
}
