import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/repositories/user-repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.delete(userId);
  }
}
