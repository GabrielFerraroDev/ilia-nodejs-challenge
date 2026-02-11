import {
  Controller, Get, Post, Param, Query, Body, Req, Headers,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case';
import { FindTransactionByIdUseCase } from '../../application/use-cases/find-transaction-by-id.use-case';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { CreateTransactionDto } from '../../application/dto/create-transaction.dto';
import { ListTransactionsDto } from '../../application/dto/list-transactions.dto';
import { TransactionResponseDto, BalanceResponseDto, ListTransactionsResponseDto } from '../../application/dto/transaction-response.dto';
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

  @Post('api/v1/transactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiTags('Transactions')
  @ApiOperation({ summary: 'Create transaction', description: 'Create a deposit or withdrawal transaction' })
  @ApiHeader({ name: 'idempotency-key', required: false, description: 'Idempotency key to prevent duplicate transactions' })
  @ApiResponse({ status: 201, description: 'Transaction created', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input (bad amount, type, etc.)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Insufficient balance for withdrawal' })
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

  @Get('api/v1/transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiTags('Transactions')
  @ApiOperation({ summary: 'List transactions', description: 'List transactions with optional filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated transaction list', type: ListTransactionsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any, @Query() query: ListTransactionsDto) {
    return this.listTransactions.execute({ userId: req.userId, ...query });
  }

  @Get('api/v1/transactions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiTags('Transactions')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction found', type: TransactionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.findTransactionById.execute(id, req.userId);
  }

  @Get('api/v1/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiTags('Balance')
  @ApiOperation({ summary: 'Get current balance' })
  @ApiResponse({ status: 200, description: 'Current balance', type: BalanceResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async balance(@Req() req: any) {
    return this.getBalance.execute(req.userId);
  }

  // --- Internal routes (S2S auth) ---

  @Post('internal/transactions')
  @UseGuards(InternalAuthGuard)
  @ApiTags('Internal')
  @ApiOperation({ summary: 'Create transaction (S2S)', description: 'Internal service-to-service route' })
  @HttpCode(HttpStatus.CREATED)
  async createInternal(
    @Req() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.createTransaction.execute({ userId: req.userId, ...dto });
  }

  @Get('internal/transactions')
  @UseGuards(InternalAuthGuard)
  @ApiTags('Internal')
  @ApiOperation({ summary: 'List transactions (S2S)' })
  async listInternal(@Req() req: any, @Query() query: ListTransactionsDto) {
    return this.listTransactions.execute({ userId: req.userId, ...query });
  }

  @Get('internal/balance')
  @UseGuards(InternalAuthGuard)
  @ApiTags('Internal')
  @ApiOperation({ summary: 'Get balance (S2S)' })
  async getBalanceInternal(@Req() req: any) {
    return this.getBalance.execute(req.userId);
  }
}
