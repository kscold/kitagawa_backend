import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactController } from './contact.controller';

import { ContactService } from './contact.service';

import { ContactRequest, ContactRequestSchema } from '../../schema/contact-request.schema';
import { CompanyInfo, CompanyInfoSchema } from '../../schema/company-info.schema';
import { EmailModule } from '../../common/module/email.module';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ContactRequest.name, schema: ContactRequestSchema },
            { name: CompanyInfo.name, schema: CompanyInfoSchema },
        ]),
        EmailModule,
        UploadModule,
    ],
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
