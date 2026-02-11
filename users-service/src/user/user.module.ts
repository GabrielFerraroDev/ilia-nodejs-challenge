import { Module } from '@nestjs/common';
import { UserController } from './infra/controllers/user.controller';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { IUserRepository } from './domain/interfaces/repositories/user-repository.interface';
import { UserRepository } from './infra/repositories/user.repository';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [UserController],
  providers: [
    GetProfileUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    { provide: IUserRepository, useClass: UserRepository },
  ],
})
export class UserModule {}
