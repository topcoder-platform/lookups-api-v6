import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Enable global validation pipe to automatically validate DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Apply the Prisma exception filter globally
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // Get PrismaService instance to handle graceful shutdown
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('TopCoder Lookup API')
    .setDescription('The API for managing lookup data like countries, devices, and educational institutions.')
    .setVersion('5.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();
