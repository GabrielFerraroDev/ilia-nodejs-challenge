import { RegisterUseCase } from './register.use-case';
import { AppError } from '../../../common/errors/app-error';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    useCase = new RegisterUseCase(prisma);
  });

  it('should register a new user with hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      password: '$2a$10$hashedpassword',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });

    const result = await useCase.execute({
      name: 'Test User',
      email: 'test@test.com',
      password: 'Secret123',
    });

    expect(result).toEqual({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      createdAt: expect.any(Date),
    });
    expect(result).not.toHaveProperty('password');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test User',
        email: 'test@test.com',
        password: expect.not.stringMatching('Secret123'),
      }),
    });
  });

  it('should throw 409 when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      useCase.execute({
        name: 'Test',
        email: 'existing@test.com',
        password: 'Secret123',
      }),
    ).rejects.toThrow(AppError);

    await expect(
      useCase.execute({
        name: 'Test',
        email: 'existing@test.com',
        password: 'Secret123',
      }),
    ).rejects.toThrow('Email already in use');
  });
});
