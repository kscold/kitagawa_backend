import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResourceController } from './resource.controller';

import { ResourceService } from './resource.service';

import { ResourceRepository } from './repository/resource.repository';

import { Resource, ResourceSchema } from '../../schemas/resource.schema';

/**
 * 자료실 모듈
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Resource.name, schema: ResourceSchema }])],
    controllers: [ResourceController],
    providers: [ResourceService, ResourceRepository],
    exports: [ResourceService, ResourceRepository],
})
export class ResourceModule {}
