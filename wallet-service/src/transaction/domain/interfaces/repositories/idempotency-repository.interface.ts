import { IdempotencyRecord } from '../../entities/idempotency-record.entity';

export abstract class IIdempotencyRepository {
  abstract findByKey(key: string, userId: string): Promise<IdempotencyRecord | null>;

  abstract save(data: {
    key: string;
    userId: string;
    responseBody: string;
    statusCode: number;
    expiresAt: Date;
  }): Promise<IdempotencyRecord>;

  abstract deleteExpired(): Promise<number>;
}
