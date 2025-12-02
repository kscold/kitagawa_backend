import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResourceAdminController } from './resource-admin.controller';

import { ResourceAdminService } from './resource-admin.service';

import { Resource, ResourceSchema } from '../../../schema/resource.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Resource.name, schema: ResourceSchema }])],
    controllers: [ResourceAdminController],
    providers: [ResourceAdminService],
    exports: [ResourceAdminService],
})
export class ResourceAdminModule {}
