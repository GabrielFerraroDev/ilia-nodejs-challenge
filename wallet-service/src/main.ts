import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'wallet_queue',
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Wallet service running on port ${port}`);
  console.log('RabbitMQ microservice started');
}

bootstrap();
