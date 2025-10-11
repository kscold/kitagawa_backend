import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
    // HTTPS 옵션 설정 (개발 환경용 - 자체 서명 인증서)
    const httpsOptions = {
        key: fs.readFileSync('./ssl/server.key'),
        cert: fs.readFileSync('./ssl/server.cert'),
    };

    const app = await NestFactory.create(AppModule, {
        httpsOptions,
    });

    // CORS 설정
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });

    // Validation 파이프 설정
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // 글로벌 prefix 설정
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 8080;
    await app.listen(port);

    console.log(`HTTPS Application is running on: https://localhost:${port}/api`);
}

bootstrap();
