import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResourceController } from './resource.controller';

import { ResourceService } from './resource.service';

import { ResourceRepository } from './repository/resource.repository';

import { Product, ProductSchema } from '../../schema/product.schema';
import { Resource, ResourceSchema } from '../../schema/resource.schema';
import { CategoryModel, CategorySchema } from '../../schema/category.schema';

/**
 * 자료실 모듈
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Resource.name, schema: ResourceSchema },
            { name: CategoryModel.name, schema: CategorySchema },
            { name: Product.name, schema: ProductSchema },
        ]),
    ],
    controllers: [ResourceController],
    providers: [ResourceService, ResourceRepository],
    exports: [ResourceService, ResourceRepository],
})
export class ResourceModule {}
