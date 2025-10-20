import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactRequest, ContactRequestSchema } from '../../schemas/contact-request.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: ContactRequest.name, schema: ContactRequestSchema }])],
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
