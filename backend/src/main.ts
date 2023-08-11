import { NestFactory } from '@nestjs/core';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import supertokens from 'supertokens-node';

import { AppModule } from './app.module';
import { AuthFilter } from './auth/auth.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: `${process.env.WEB_DOMAIN}`,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    methods: ['GET', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });
  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const config = new DocumentBuilder()
    .setTitle('Pfartists documentations')
    .setDescription('Pfartists API description')
    .setVersion('1.0')
    .addTag('pfartists')
    .build();
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  app.useGlobalFilters(new AuthFilter());
  await app.listen(
    process.env.NODE_ENV === 'production' ? process.env.BACKEND_PORT : 3001,
  );
}
bootstrap();
