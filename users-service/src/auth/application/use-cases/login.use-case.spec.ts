import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let prisma: any;
  let jwtService: any;
  let refreshTokenRepo: any;

  const hashedPassword = bcrypt.hashSync('Secret123', 10);

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-access-token'),
    };
    refreshTokenRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      findByToken: jest.fn(),
      revokeByToken: jest.fn(),
    };
    useCase = new LoginUseCase(prisma, jwtService, refreshTokenRepo);
  });

  it('should return accessToken, refreshToken and user on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      email: 'test@test.com',
      password: 'Secret123',
    });

    expect(result.accessToken).toBe('jwt-access-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.stringMatching(/^[a-f0-9]{64}$/),
        userId: 'user-1',
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('should throw UnauthorizedException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'no@user.com', password: 'Secret123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      useCase.execute({ email: 'test@test.com', password: 'WrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
