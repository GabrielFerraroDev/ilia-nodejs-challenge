export interface IdempotencyRecord {
  id: string;
  key: string;
  userId: string;
  responseBody: string;
  statusCode: number;
  createdAt: Date;
  expiresAt: Date;
}
