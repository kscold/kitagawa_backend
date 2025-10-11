import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CrawlerController } from './crawler.controller';

import { CrawlerService } from './crawler.service';

import { Product, ProductSchema } from '../../schemas/product.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
    controllers: [CrawlerController],
    providers: [CrawlerService],
    exports: [CrawlerService],
})
export class CrawlerModule {}
