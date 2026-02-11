import { Injectable } from '@nestjs/common';
import { ILedgerRepository } from '../../domain/interfaces/repositories/ledger-repository.interface';

@Injectable()
export class GetBalanceUseCase {
  constructor(private readonly ledgerRepo: ILedgerRepository) {}

  async execute(userId: string) {
    const entry = await this.ledgerRepo.getLatestEntry(userId);
    return { userId, balance: entry ? entry.runningBalance : 0 };
  }
}
