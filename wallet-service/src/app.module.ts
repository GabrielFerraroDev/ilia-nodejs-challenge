import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionModule } from './transaction/transaction.module';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { InternalAuthGuard } from './common/guards/internal-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        level: process.env.LOG_LEVEL || 'info',
        genReqId: (req) => req.headers['x-correlation-id'] || randomUUID(),
        customProps: () => ({ service: 'wallet-service' }),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["set-cookie"]',
            'req.headers["idempotency-key"]',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
    PrometheusModule.register({ defaultMetrics: { enabled: true }, path: '/metrics' }),
    PrismaModule,
    TransactionModule,
  ],
  controllers: [HealthController],
  providers: [JwtAuthGuard, InternalAuthGuard],
})
export class AppModule {}
