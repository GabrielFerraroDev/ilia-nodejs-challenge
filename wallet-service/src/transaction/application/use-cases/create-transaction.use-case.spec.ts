import { CreateTransactionUseCase } from './create-transaction.use-case';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { IIdempotencyRepository } from '../../domain/interfaces/repositories/idempotency-repository.interface';
import { TransactionType } from '../../domain/entities/transaction.entity';
import { AppError } from '../../../common/errors/app-error';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let idempotencyRepo: jest.Mocked<IIdempotencyRepository>;

  const mockTransaction = {
    id: 'tx-1',
    userId: 'user-1',
    type: TransactionType.DEPOSIT,
    amount: 100,
    description: 'Test deposit',
    idempotencyKey: null,
    createdAt: new Date(),
  };

  const mockLedgerEntry = {
    id: 1,
    transactionId: 'tx-1',
    userId: 'user-1',
    type: TransactionType.DEPOSIT,
    amount: 100,
    runningBalance: 100,
    createdAt: new Date(),
  };

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      createWithLedger: jest.fn(),
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByUserId: jest.fn(),
      count: jest.fn(),
    } as any;

    idempotencyRepo = {
      findByKey: jest.fn(),
      save: jest.fn(),
      deleteExpired: jest.fn(),
    } as any;

    useCase = new CreateTransactionUseCase(transactionRepo, idempotencyRepo);
  });

  it('should create a deposit transaction with ledger entry', async () => {
    transactionRepo.createWithLedger.mockResolvedValue({
      transaction: mockTransaction,
      ledgerEntry: mockLedgerEntry,
    });

    const result = await useCase.execute({
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
      amount: 100,
      description: 'Test deposit',
    });

    expect(result).toEqual(mockTransaction);
    expect(transactionRepo.createWithLedger).toHaveBeenCalledWith({
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
      amount: 100,
      description: 'Test deposit',
    });
  });

  it('should throw AppError when amount is zero or negative', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        type: TransactionType.DEPOSIT,
        amount: 0,
      }),
    ).rejects.toThrow(AppError);

    await expect(
      useCase.execute({
        userId: 'user-1',
        type: TransactionType.DEPOSIT,
        amount: -10,
      }),
    ).rejects.toThrow('Amount must be greater than zero');
  });

  it('should return existing transaction when idempotency key matches', async () => {
    transactionRepo.findByIdempotencyKey.mockResolvedValue(mockTransaction);

    const result = await useCase.execute({
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
      amount: 100,
      idempotencyKey: 'key-1',
    });

    expect(result).toEqual(mockTransaction);
    expect(transactionRepo.createWithLedger).not.toHaveBeenCalled();
  });

  it('should create transaction and save idempotency record when key is new', async () => {
    transactionRepo.findByIdempotencyKey.mockResolvedValue(null);
    transactionRepo.createWithLedger.mockResolvedValue({
      transaction: { ...mockTransaction, idempotencyKey: 'key-2' },
      ledgerEntry: mockLedgerEntry,
    });
    idempotencyRepo.save.mockResolvedValue({} as any);

    const result = await useCase.execute({
      userId: 'user-1',
      type: TransactionType.DEPOSIT,
      amount: 100,
      idempotencyKey: 'key-2',
    });

    expect(result.idempotencyKey).toBe('key-2');
    expect(transactionRepo.createWithLedger).toHaveBeenCalled();
    expect(idempotencyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'key-2',
        userId: 'user-1',
        statusCode: 201,
      }),
    );
  });

  it('should create a withdrawal transaction', async () => {
    const withdrawalTx = {
      ...mockTransaction,
      type: TransactionType.WITHDRAWAL,
    };
    transactionRepo.createWithLedger.mockResolvedValue({
      transaction: withdrawalTx,
      ledgerEntry: { ...mockLedgerEntry, type: TransactionType.WITHDRAWAL, runningBalance: -100 },
    });

    const result = await useCase.execute({
      userId: 'user-1',
      type: TransactionType.WITHDRAWAL,
      amount: 100,
    });

    expect(result.type).toBe(TransactionType.WITHDRAWAL);
  });
});
