import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';

import { ProductController } from './product.controller';
import { ProductAdminController } from './admin/product-admin.controller';

import { ProductService } from './product.service';
import { ProductAdminService } from './admin/product-admin.service';

import { ProductRepository } from './repository/product.repository';
import { CategoryRepository } from '../category/repository/category.repository';

import { Product, ProductSchema } from '../../schema/product.schema';
import { CategoryModel, CategorySchema } from '../../schema/category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
            { name: CategoryModel.name, schema: CategorySchema },
        ]),
        AdminJwtModule,
    ],
    controllers: [ProductController, ProductAdminController],
    providers: [ProductRepository, CategoryRepository, ProductService, ProductAdminService],
    exports: [ProductService],
})
export class ProductModule {}
