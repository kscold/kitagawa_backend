import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger();

    // CORS 설정
    app.enableCors({
        origin: ['http://localhost:3000', 'https://www.kitagawa.co.kr'],
        credentials: true,
    });

    // Validation 파이프 설정
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // 글로벌 prefix 설정
    app.setGlobalPrefix('api');

    // Swagger 설정
    const config = new DocumentBuilder()
        .setTitle('Kitagawa API')
        .setDescription('기타가와(Kitagawa) 제품 정보 제공 API')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    const port = process.env.PORT || 8080;
    await app.listen(port, '0.0.0.0');

    logger.log(`Application is running on: http://0.0.0.0:${port}/api`);
    logger.log(`Swagger documentation: http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
