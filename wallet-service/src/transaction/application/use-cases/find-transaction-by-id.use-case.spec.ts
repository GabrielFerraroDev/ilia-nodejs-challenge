import { FindTransactionByIdUseCase } from './find-transaction-by-id.use-case';
import { ITransactionRepository } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { TransactionType } from '../../domain/entities/transaction.entity';
import { AppError } from '../../../common/errors/app-error';

describe('FindTransactionByIdUseCase', () => {
  let useCase: FindTransactionByIdUseCase;
  let transactionRepo: jest.Mocked<ITransactionRepository>;

  const mockTransaction = {
    id: 'tx-1',
    userId: 'user-1',
    type: TransactionType.DEPOSIT,
    amount: 100,
    description: 'Test',
    idempotencyKey: null,
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

    useCase = new FindTransactionByIdUseCase(transactionRepo);
  });

  it('should return transaction when found and owned by user', async () => {
    transactionRepo.findById.mockResolvedValue(mockTransaction);

    const result = await useCase.execute('tx-1', 'user-1');

    expect(result).toEqual(mockTransaction);
    expect(transactionRepo.findById).toHaveBeenCalledWith('tx-1');
  });

  it('should throw 404 when transaction not found', async () => {
    transactionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('tx-999', 'user-1')).rejects.toThrow(AppError);
    await expect(useCase.execute('tx-999', 'user-1')).rejects.toThrow('Transaction not found');
  });

  it('should throw 404 when transaction belongs to another user', async () => {
    transactionRepo.findById.mockResolvedValue(mockTransaction);

    await expect(useCase.execute('tx-1', 'other-user')).rejects.toThrow(AppError);
  });
});
