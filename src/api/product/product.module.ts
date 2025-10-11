import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductController } from './product.controller';
import { ProductAdminController } from './admin/product-admin.controller';

import { ProductService } from './product.service';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';
import { Product, ProductSchema } from '../../schemas/product.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        AdminJwtModule, // Admin JWT 모듈 추가
    ],
    controllers: [
        ProductController, // Public API (인증 없음)
        ProductAdminController, // Admin API (JWT 인증 필요)
    ],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
