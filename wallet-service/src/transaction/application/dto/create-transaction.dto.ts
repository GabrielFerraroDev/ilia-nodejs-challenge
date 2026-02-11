import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../domain/entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: 'DEPOSIT', description: 'Transaction type' })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 100.50, description: 'Amount in decimal (max 2 decimal places)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'Initial deposit', description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
