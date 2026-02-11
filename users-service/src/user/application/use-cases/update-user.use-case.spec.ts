import { NotFoundException } from '@nestjs/common';
import { UpdateUserUseCase } from './update-user.use-case';
import { IUserRepository } from '../../domain/interfaces/repositories/user-repository.interface';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
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
    useCase = new UpdateUserUseCase(userRepo);
  });

  it('should update user name', async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue({ ...mockUser, name: 'Updated Name', updatedAt: new Date() });

    const result = await useCase.execute('user-1', { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
    expect(result).not.toHaveProperty('password');
    expect(userRepo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ name: 'Updated Name' }),
    );
  });

  it('should hash password when updating password', async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    await useCase.execute('user-1', { password: 'NewPassword123' });

    expect(userRepo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        password: expect.not.stringMatching('NewPassword123'),
      }),
    );
  });

  it('should throw 404 when user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('no-user', { name: 'Test' }),
    ).rejects.toThrow(NotFoundException);
  });
});
