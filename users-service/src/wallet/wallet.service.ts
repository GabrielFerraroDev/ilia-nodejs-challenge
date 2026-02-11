import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { AppError } from '../common/errors/app-error';

@Injectable()
export class WalletService {
  constructor(
    @Inject('WALLET_SERVICE') private readonly walletClient: ClientProxy,
  ) {}

  async createTransaction(data: {
    userId: string;
    type: string;
    amount: number;
    description?: string;
  }) {
    try {
      return await firstValueFrom(
        this.walletClient.send('wallet.create_transaction', data).pipe(timeout(10000)),
      );
    } catch (err: any) {
      throw new AppError(err.message || 'Wallet service error', err.statusCode || 500);
    }
  }

  async getBalance(userId: string) {
    try {
      return await firstValueFrom(
        this.walletClient.send('wallet.get_balance', { userId }).pipe(timeout(10000)),
      );
    } catch (err: any) {
      throw new AppError(err.message || 'Wallet service error', err.statusCode || 500);
    }
  }

  async listTransactions(data: {
    userId: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      return await firstValueFrom(
        this.walletClient.send('wallet.list_transactions', data).pipe(timeout(10000)),
      );
    } catch (err: any) {
      throw new AppError(err.message || 'Wallet service error', err.statusCode || 500);
    }
  }
}
