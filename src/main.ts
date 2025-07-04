// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  // Create hybrid application (both HTTP and microservice)
  const app = await NestFactory.create(AppModule);

  // Connect microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'notification_queue',
      queueOptions: {
        durable: true,
      },
      exchange: 'notification_exchange',
      routingKey: 'result_published',
      noAck: false,
      exchangeType: 'direct',
    },
  });

  // Enable CORS for Swagger UI
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription(
      'Microservice for handling notifications via RabbitMQ and HTTP endpoints',
    )
    .setVersion('1.0')
    .addTag('notifications', 'Notification management endpoints')
    .addTag('health', 'Health check endpoints')
    .addTag('microservice', 'Message pattern documentation')
    .addServer(
      `http://localhost:${process.env.PORT}`,
      'Local development server',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Notification Service API Documentation',
  });

  // Start both HTTP server and microservice
  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3003);

  console.log('Notification Microservice is listening...');
  console.log(
    `HTTP Server is running on: http://localhost:${process.env.PORT}`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT}/api-docs`,
  );
}

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
