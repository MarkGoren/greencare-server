import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    cors({ credentials: true, origin: 'http://localhost:3000' }),
    cookieParser(),
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 60000,
      },
    }),
  );
  await app.listen(3001);
}
bootstrap();
