import {
  Controller, Get, Post, Put, Delete, Body, Req, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { WalletService } from '../../../wallet/wallet.service';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserResponseDto } from '../../../auth/application/dto/auth-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly walletService: WalletService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: any) {
    return this.getProfileUseCase.execute(req.user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated user', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.updateUserUseCase.execute(req.user.userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delete(@Req() req: any) {
    await this.deleteUserUseCase.execute(req.user.userId);
  }

  @Get('me/balance')
  @ApiOperation({ summary: 'Get wallet balance', description: 'Proxied to wallet-service via RabbitMQ' })
  @ApiResponse({ status: 200, description: 'Current balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'List wallet transactions', description: 'Proxied to wallet-service via RabbitMQ' })
  @ApiQuery({ name: 'type', required: false, enum: ['DEPOSIT', 'WITHDRAWAL'], description: 'Filter by type' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default 20)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset (default 0)' })
  @ApiResponse({ status: 200, description: 'Paginated transaction list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTransactions(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.listTransactions({
      userId: req.user.userId,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('me/transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create wallet transaction', description: 'Proxied to wallet-service via RabbitMQ' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Insufficient balance' })
  async createTransaction(@Req() req: any, @Body() body: any) {
    return this.walletService.createTransaction({
      userId: req.user.userId,
      type: body.type,
      amount: body.amount,
      description: body.description,
    });
  }
}
