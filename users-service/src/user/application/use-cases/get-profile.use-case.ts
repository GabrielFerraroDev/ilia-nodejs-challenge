import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/repositories/user-repository.interface';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  }
}
