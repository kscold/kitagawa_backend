import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';

import { CategoryController } from './category.controller';
import { CategoryAdminController } from './admin/category-admin.controller';

import { CategoryService } from './category.service';
import { CategoryAdminService } from './admin/category-admin.service';

import { CategoryRepository } from './repository/category.repository';

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
    controllers: [CategoryController, CategoryAdminController],
    providers: [CategoryService, CategoryRepository, CategoryAdminService],
    exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
