import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../domain/entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'u1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  userId!: string;

  @ApiProperty({ enum: TransactionType, example: 'DEPOSIT' })
  type!: TransactionType;

  @ApiProperty({ example: 100.50 })
  amount!: number;

  @ApiPropertyOptional({ example: 'Initial deposit', nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ example: 'idem-key-123', nullable: true })
  idempotencyKey!: string | null;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt!: Date;
}

export class BalanceResponseDto {
  @ApiProperty({ example: 'u1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  userId!: string;

  @ApiProperty({ example: 350.00 })
  balance!: number;
}

export class ListTransactionsResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  transactions!: TransactionResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}
