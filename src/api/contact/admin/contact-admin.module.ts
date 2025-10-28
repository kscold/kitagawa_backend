import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactAdminController } from './contact-admin.controller';
import { ContactAdminService } from './contact-admin.service';
import { ContactRequest, ContactRequestSchema } from '../../../schemas/contact-request.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: ContactRequest.name, schema: ContactRequestSchema }])],
    controllers: [ContactAdminController],
    providers: [ContactAdminService],
    exports: [ContactAdminService],
})
export class ContactAdminModule {}
