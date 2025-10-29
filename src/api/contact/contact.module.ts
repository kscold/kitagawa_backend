import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactController } from './contact.controller';

import { ContactService } from './contact.service';

import { ContactRequest, ContactRequestSchema } from '../../schemas/contact-request.schema';
import { EmailModule } from '../../common/module/email.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ContactRequest.name, schema: ContactRequestSchema }]),
        EmailModule,
    ],
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
