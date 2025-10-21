import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoryController } from './category.controller';
import { CategoryAdminController } from './admin/category-admin.controller';

import { CategoryService } from './category.service';
import { CategoryAdminService } from './admin/category-admin.service';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';

import { CategoryRepository } from './repository/category.repository';

import { Product, ProductSchema } from '../../schemas/product.schema';
import { CategoryModel, CategorySchema } from '../../schemas/category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CategoryModel.name, schema: CategorySchema },
            { name: Product.name, schema: ProductSchema },
        ]),
        AdminJwtModule,
    ],
    controllers: [CategoryController, CategoryAdminController],
    providers: [CategoryService, CategoryRepository, CategoryAdminService],
    exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
