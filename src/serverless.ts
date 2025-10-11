import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

import { AppModule } from './app.module';

const expressApp = express();
const createNestServer = async (expressInstance: express.Application) => {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

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

    return app.init();
};

createNestServer(expressApp)
    .then(() => console.log('Nest Ready for GCP Cloud Functions'))
    .catch((err) => console.error('Nest broken', err));

// GCP Cloud Functions 엔트리포인트
export const api = expressApp;
