import { NotFoundException } from '@nestjs/common';
import { DeleteUserUseCase } from './delete-user.use-case';
import { IUserRepository } from '../../domain/interfaces/repositories/user-repository.interface';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    useCase = new DeleteUserUseCase(userRepo);
  });

  it('should delete existing user', async () => {
    userRepo.findById.mockResolvedValue({
      id: 'user-1',
      name: 'Test',
      email: 'test@test.com',
      password: '$2a$10$hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userRepo.delete.mockResolvedValue(undefined as any);

    await useCase.execute('user-1');

    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
  });

  it('should throw 404 when user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('no-user')).rejects.toThrow(NotFoundException);
  });
});
