import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './api/auth/auth.module';
import { UploadModule } from './api/upload/upload.module';
import { ProductModule } from './api/product/product.module';
import { CrawlerModule } from './api/crawler/crawler.module';
import { ContactModule } from './api/contact/contact.module';
import { CompanyModule } from './api/company/company.module';
import { CategoryModule } from './api/category/category.module';
import { ResourceModule } from './api/resource/resource.module';
import { ContactAdminModule } from './api/contact/admin/contact-admin.module';
import { HomeSettingsModule } from './api/home-settings/home-settings.module';
import { ResourceAdminModule } from './api/resource/admin/resource-admin.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
        }),
        AuthModule,
        UploadModule,
        ProductModule,
        CrawlerModule,
        ContactModule,
        CompanyModule,
        CategoryModule,
        ResourceModule,
        ContactAdminModule,
        HomeSettingsModule,
        ResourceAdminModule,
    ],
})
export class AppModule {}
