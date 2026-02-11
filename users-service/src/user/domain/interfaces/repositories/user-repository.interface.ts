import { User } from '../../entities/user.entity';

export abstract class IUserRepository {
  abstract findById(id: string): Promise<User | null>;

  abstract findByEmail(email: string): Promise<User | null>;

  abstract update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'password'>>): Promise<User>;

  abstract delete(id: string): Promise<void>;
}
