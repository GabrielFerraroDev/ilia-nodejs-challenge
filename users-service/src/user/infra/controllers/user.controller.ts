import {
  Controller, Get, Post, Put, Delete, Body, Req, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { WalletService } from '../../../wallet/wallet.service';
import { UpdateUserDto } from '../../application/dto/update-user.dto';

@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly walletService: WalletService,
  ) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    return this.getProfileUseCase.execute(req.user.userId);
  }

  @Put('me')
  async update(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.updateUserUseCase.execute(req.user.userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: any) {
    await this.deleteUserUseCase.execute(req.user.userId);
  }

  @Get('me/balance')
  async getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('me/transactions')
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
  async createTransaction(@Req() req: any, @Body() body: any) {
    return this.walletService.createTransaction({
      userId: req.user.userId,
      type: body.type,
      amount: body.amount,
      description: body.description,
    });
  }
}
