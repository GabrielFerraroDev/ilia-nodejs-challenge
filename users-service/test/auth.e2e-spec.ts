import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let cookies: string | string[];

  const testUser = {
    name: 'E2E Test User',
    email: `e2e-${Date.now()}@test.com`,
    password: 'Secret123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { user: { email: testUser.email } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('GET /health', () => {
    it('should return ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(res.body.id).toBeDefined();
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should reject invalid email', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'Secret123!' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return accessToken + set cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });

      accessToken = res.body.accessToken;
      cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('should reject wrong password', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPass' })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'Secret123!' })
        .expect(401);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject unauthenticated request', async () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user name', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated E2E User' })
        .expect(200);

      expect(res.body.name).toBe('Updated E2E User');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new access token with valid refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject without refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(200);

      expect(res.body.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear refresh token cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(204);

      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });

    it('should reject refresh after logout', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      // Token was revoked, should fail
      expect(res.body.statusCode || res.body.error).toBeDefined();
    });
  });
});
