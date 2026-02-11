import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/interfaces/repositories/user-repository.interface';
import { AppError } from '../../../common/errors/app-error';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, data: { name?: string; email?: string; password?: string }) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing) throw new AppError('Email already in use', 409);
    }

    const updateData: Record<string, string> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    const updated = await this.userRepo.update(userId, updateData);
    return { id: updated.id, name: updated.name, email: updated.email, updatedAt: updated.updatedAt };
  }
}
