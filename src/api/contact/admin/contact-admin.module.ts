import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { ContactAdminController } from './contact-admin.controller';

import { ContactAdminService } from './contact-admin.service';

import { Product, ProductSchema } from '../../../schema/product.schema';
import { Resource, ResourceSchema } from '../../../schema/resource.schema';
import { CompanyInfo, CompanyInfoSchema } from '../../../schema/company-info.schema';
import { ContactRequest, ContactRequestSchema } from '../../../schema/contact-request.schema';
import { AdminContactRequest, AdminContactRequestSchema } from '../../../schema/admin-contact-request.schema';

import { DiscordWebhookService } from '../../../common/service/discord-webhook.service';
import { ProductCrawlerService } from '../../../common/service/product-crawler.service';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: ContactRequest.name, schema: ContactRequestSchema },
            { name: CompanyInfo.name, schema: CompanyInfoSchema },
            { name: AdminContactRequest.name, schema: AdminContactRequestSchema },
            { name: Resource.name, schema: ResourceSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
    ],
    controllers: [ContactAdminController],
    providers: [ContactAdminService, DiscordWebhookService, ProductCrawlerService],
    exports: [ContactAdminService],
})
export class ContactAdminModule {}
