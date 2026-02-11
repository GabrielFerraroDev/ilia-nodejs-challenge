import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Wallet Transactions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const JWT_SECRET = 'ILIACHALLENGE';
  const userId = 'e2e-user-1';
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
    token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  });

  afterAll(async () => {
    await prisma.ledgerEntry.deleteMany({ where: { userId } });
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.idempotencyRecord.deleteMany({ where: { userId } });
    await app.close();
  });

  describe('GET /health', () => {
    it('should return ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without JWT', () => {
      return request(app.getHttpServer())
        .get('/api/balance')
        .expect(401);
    });

    it('should reject requests with invalid JWT', () => {
      return request(app.getHttpServer())
        .get('/api/balance')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a DEPOSIT transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'DEPOSIT', amount: 500, description: 'Initial deposit' })
        .expect(201);

      expect(res.body).toMatchObject({
        userId,
        type: 'DEPOSIT',
        amount: 500,
        description: 'Initial deposit',
      });
      expect(res.body.id).toBeDefined();
    });

    it('should create a WITHDRAWAL transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'WITHDRAWAL', amount: 150, description: 'Withdrawal' })
        .expect(201);

      expect(res.body.type).toBe('WITHDRAWAL');
      expect(res.body.amount).toBe(150);
    });

    it('should reject withdrawal with insufficient balance', async () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'WITHDRAWAL', amount: 99999 })
        .expect(422);
    });

    it('should reject zero amount', async () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'DEPOSIT', amount: 0 })
        .expect(400);
    });

    it('should reject negative amount', async () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'DEPOSIT', amount: -10 })
        .expect(400);
    });

    it('should reject invalid transaction type', async () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'INVALID', amount: 100 })
        .expect(400);
    });
  });

  describe('Idempotency', () => {
    it('should return same transaction for duplicate idempotency key', async () => {
      const key = 'idem-e2e-test-' + Date.now();

      const res1 = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ type: 'DEPOSIT', amount: 50 })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ type: 'DEPOSIT', amount: 50 })
        .expect(201);

      expect(res1.body.id).toBe(res2.body.id);
    });
  });

  describe('GET /api/balance', () => {
    it('should return correct running balance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/balance')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.userId).toBe(userId);
      expect(typeof res.body.balance).toBe('number');
      expect(res.body.balance).toBe(400); // 500 - 150 + 50
    });
  });

  describe('GET /api/transactions', () => {
    it('should list all user transactions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.transactions).toBeInstanceOf(Array);
      expect(res.body.transactions.length).toBeGreaterThanOrEqual(3);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
      expect(res.body.limit).toBeDefined();
      expect(res.body.offset).toBeDefined();
    });

    it('should filter by type', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/transactions?type=DEPOSIT')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      res.body.transactions.forEach((tx: any) => {
        expect(tx.type).toBe('DEPOSIT');
      });
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/transactions?limit=1&offset=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.transactions.length).toBe(1);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(0);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should return a single transaction by ID', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/transactions?limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const txId = listRes.body.transactions[0].id;

      const res = await request(app.getHttpServer())
        .get(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(txId);
      expect(res.body.userId).toBe(userId);
    });

    it('should return 404 for non-existent transaction', async () => {
      return request(app.getHttpServer())
        .get('/api/transactions/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 404 for another user transaction', async () => {
      const otherToken = jwt.sign({ userId: 'other-user' }, JWT_SECRET, { expiresIn: '15m' });
      const listRes = await request(app.getHttpServer())
        .get('/api/transactions?limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const txId = listRes.body.transactions[0].id;

      return request(app.getHttpServer())
        .get(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });
  });
});
