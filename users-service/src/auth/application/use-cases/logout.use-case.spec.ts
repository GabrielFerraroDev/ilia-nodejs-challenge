import { createHash } from 'crypto';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let refreshTokenRepo: any;

  beforeEach(() => {
    refreshTokenRepo = {
      findByToken: jest.fn(),
      create: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };
    useCase = new LogoutUseCase(refreshTokenRepo);
  });

  it('should revoke the refresh token when it exists and is not revoked', async () => {
    const tokenHash = createHash('sha256').update('some-token').digest('hex');
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: tokenHash,
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });
    refreshTokenRepo.revoke.mockResolvedValue(undefined);

    await useCase.execute('some-token');

    expect(refreshTokenRepo.findByToken).toHaveBeenCalledWith(tokenHash);
    expect(refreshTokenRepo.revoke).toHaveBeenCalledWith(tokenHash);
  });

  it('should not revoke when token is already revoked', async () => {
    const tokenHash = createHash('sha256').update('some-token').digest('hex');
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      token: tokenHash,
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    });

    await useCase.execute('some-token');

    expect(refreshTokenRepo.revoke).not.toHaveBeenCalled();
  });

  it('should not revoke when token is not found', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(null);

    await useCase.execute('invalid-token');

    expect(refreshTokenRepo.revoke).not.toHaveBeenCalled();
  });
});
