import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let jwtService: any;
  let refreshTokenRepo: any;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('new-access-token'),
    };
    refreshTokenRepo = {
      findByToken: jest.fn(),
      create: jest.fn(),
      revokeByToken: jest.fn(),
    };
    useCase = new RefreshTokenUseCase(jwtService, refreshTokenRepo);
  });

  it('should return a new access token for a valid refresh token', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: 'valid-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });

    const result = await useCase.execute('valid-token');

    expect(result).toEqual({ accessToken: 'new-access-token' });
    expect(jwtService.sign).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('should throw UnauthorizedException when token not found', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(null);

    await expect(useCase.execute('invalid-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is revoked', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: 'revoked-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    });

    await expect(useCase.execute('revoked-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is expired', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: 'expired-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
    });

    await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
  });
});
