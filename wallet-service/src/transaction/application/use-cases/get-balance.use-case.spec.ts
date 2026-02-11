import { GetBalanceUseCase } from './get-balance.use-case';
import { ILedgerRepository } from '../../domain/interfaces/repositories/ledger-repository.interface';
import { TransactionType } from '../../domain/entities/transaction.entity';

describe('GetBalanceUseCase', () => {
  let useCase: GetBalanceUseCase;
  let ledgerRepo: jest.Mocked<ILedgerRepository>;

  beforeEach(() => {
    ledgerRepo = {
      getLatestEntry: jest.fn(),
      getEntriesByUserId: jest.fn(),
    } as any;

    useCase = new GetBalanceUseCase(ledgerRepo);
  });

  it('should return balance from latest ledger entry', async () => {
    ledgerRepo.getLatestEntry.mockResolvedValue({
      id: 1,
      transactionId: 'tx-1',
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
      amount: 500,
      runningBalance: 350,
      createdAt: new Date(),
    });

    const result = await useCase.execute('user-1');

    expect(result).toEqual({ userId: 'user-1', balance: 350 });
    expect(ledgerRepo.getLatestEntry).toHaveBeenCalledWith('user-1');
  });

  it('should return zero balance when no ledger entries exist', async () => {
    ledgerRepo.getLatestEntry.mockResolvedValue(null);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({ userId: 'user-1', balance: 0 });
  });
});
