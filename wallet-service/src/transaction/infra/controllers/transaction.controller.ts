import {
  Controller, Get, Post, Param, Query, Body, Req, Headers,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case';
import { FindTransactionByIdUseCase } from '../../application/use-cases/find-transaction-by-id.use-case';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { CreateTransactionDto } from '../../application/dto/create-transaction.dto';
import { ListTransactionsDto } from '../../application/dto/list-transactions.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../../../common/guards/internal-auth.guard';

@Controller()
export class TransactionController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly findTransactionById: FindTransactionByIdUseCase,
    private readonly getBalance: GetBalanceUseCase,
  ) {}

  // --- Public routes (JWT auth) ---

  @Post('api/transactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: any,
    @Body() dto: CreateTransactionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.createTransaction.execute({
      userId: req.userId,
      ...dto,
      idempotencyKey,
    });
  }

  @Get('api/transactions')
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any, @Query() query: ListTransactionsDto) {
    return this.listTransactions.execute({ userId: req.userId, ...query });
  }

  @Get('api/transactions/:id')
  @UseGuards(JwtAuthGuard)
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.findTransactionById.execute(id, req.userId);
  }

  @Get('api/balance')
  @UseGuards(JwtAuthGuard)
  async balance(@Req() req: any) {
    return this.getBalance.execute(req.userId);
  }

  // --- Internal routes (S2S auth) ---

  @Post('internal/transactions')
  @UseGuards(InternalAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInternal(
    @Req() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.createTransaction.execute({ userId: req.userId, ...dto });
  }

  @Get('internal/transactions')
  @UseGuards(InternalAuthGuard)
  async listInternal(@Req() req: any, @Query() query: ListTransactionsDto) {
    return this.listTransactions.execute({ userId: req.userId, ...query });
  }

  @Get('internal/balance')
  @UseGuards(InternalAuthGuard)
  async getBalanceInternal(@Req() req: any) {
    return this.getBalance.execute(req.userId);
  }
}
