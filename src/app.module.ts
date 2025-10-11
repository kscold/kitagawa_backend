import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { ProductModule } from './api/product/product.module';
import { CrawlerModule } from './api/crawler/crawler.module';
import { AuthModule } from './api/auth/auth.module';

import { databaseConfig } from './config/database.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRoot(databaseConfig.uri, databaseConfig.options),
        AuthModule,
        ProductModule,
        CrawlerModule,
    ],
})
export class AppModule {}
