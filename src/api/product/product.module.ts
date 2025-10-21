import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';

import { ProductController } from './product.controller';
import { ProductAdminController } from './admin/product-admin.controller';

import { ProductService } from './product.service';
import { ProductAdminService } from './admin/product-admin.service';

import { ProductRepository } from './repository/product.repository';

import { Product, ProductSchema } from '../../schemas/product.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]), AdminJwtModule],
    controllers: [ProductController, ProductAdminController],
    providers: [ProductRepository, ProductService, ProductAdminService],
    exports: [ProductService],
})
export class ProductModule {}
