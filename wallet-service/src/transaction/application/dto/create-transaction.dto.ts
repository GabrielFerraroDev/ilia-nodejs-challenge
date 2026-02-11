import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { TransactionType } from '../../domain/entities/transaction.entity';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
