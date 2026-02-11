import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
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
    const rawToken = 'valid-token';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: tokenHash,
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });

    const result = await useCase.execute(rawToken);

    expect(result).toEqual({ accessToken: 'new-access-token' });
    expect(refreshTokenRepo.findByToken).toHaveBeenCalledWith(tokenHash);
    expect(jwtService.sign).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('should throw UnauthorizedException when token not found', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(null);
    const hash = createHash('sha256').update('invalid-token').digest('hex');

    await expect(useCase.execute('invalid-token')).rejects.toThrow(UnauthorizedException);
    expect(refreshTokenRepo.findByToken).toHaveBeenCalledWith(hash);
  });

  it('should throw UnauthorizedException when token is revoked', async () => {
    const tokenHash = createHash('sha256').update('revoked-token').digest('hex');
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: tokenHash,
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    });

    await expect(useCase.execute('revoked-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is expired', async () => {
    const tokenHash = createHash('sha256').update('expired-token').digest('hex');
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: tokenHash,
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
    });

    await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
  });
});
