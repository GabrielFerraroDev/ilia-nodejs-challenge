import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import { IUserRepository } from '../../domain/interfaces/repositories/user-repository.interface';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let userRepo: jest.Mocked<IUserRepository>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    password: '$2a$10$hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    useCase = new GetProfileUseCase(userRepo);
  });

  it('should return user profile without password', async () => {
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      createdAt: mockUser.createdAt,
    });
    expect(result).not.toHaveProperty('password');
    expect(userRepo.findById).toHaveBeenCalledWith('user-1');
  });

  it('should throw 404 when user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('no-user')).rejects.toThrow(NotFoundException);
  });
});
