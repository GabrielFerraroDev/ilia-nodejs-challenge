export interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export abstract class IRefreshTokenRepository {
  abstract create(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshTokenRecord>;

  abstract findByToken(token: string): Promise<RefreshTokenRecord | null>;

  abstract revoke(token: string): Promise<void>;

  abstract revokeAllForUser(userId: string): Promise<void>;

  abstract deleteExpired(): Promise<number>;
}
