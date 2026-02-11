import { ListTransactionsUseCase } from './list-transactions.use-case';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { TransactionType } from '../../domain/entities/transaction.entity';

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let transactionRepo: jest.Mocked<ITransactionRepository>;

  const mockTransactions = [
    {
      id: 'tx-1',
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
      amount: 100,
      description: 'Deposit',
      idempotencyKey: null,
      createdAt: new Date(),
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      type: TransactionType.WITHDRAWAL,
      amount: 50,
      description: 'Withdrawal',
      idempotencyKey: null,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      createWithLedger: jest.fn(),
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByUserId: jest.fn(),
      count: jest.fn(),
    } as any;

    useCase = new ListTransactionsUseCase(transactionRepo);
  });

  it('should return paginated transactions with total count', async () => {
    transactionRepo.findByUserId.mockResolvedValue(mockTransactions);
    transactionRepo.count.mockResolvedValue(2);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({
      transactions: mockTransactions,
      total: 2,
      limit: 20,
      offset: 0,
    });
  });

  it('should use default limit=20 and offset=0', async () => {
    transactionRepo.findByUserId.mockResolvedValue([]);
    transactionRepo.count.mockResolvedValue(0);

    await useCase.execute({ userId: 'user-1' });

    expect(transactionRepo.findByUserId).toHaveBeenCalledWith({
      userId: 'user-1',
      limit: 20,
      offset: 0,
    });
  });

  it('should pass custom limit and offset', async () => {
    transactionRepo.findByUserId.mockResolvedValue([]);
    transactionRepo.count.mockResolvedValue(0);

    await useCase.execute({ userId: 'user-1', limit: 5, offset: 10 });

    expect(transactionRepo.findByUserId).toHaveBeenCalledWith({
      userId: 'user-1',
      limit: 5,
      offset: 10,
    });
  });

  it('should filter by transaction type', async () => {
    transactionRepo.findByUserId.mockResolvedValue([mockTransactions[0]]);
    transactionRepo.count.mockResolvedValue(1);

    const result = await useCase.execute({
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
    });

    expect(result.total).toBe(1);
    expect(transactionRepo.findByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ type: TransactionType.DEPOSIT }),
    );
    expect(transactionRepo.count).toHaveBeenCalledWith({
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
    });
  });
});
