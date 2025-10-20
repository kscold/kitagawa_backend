import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyInfo, CompanyInfoSchema } from '../../schemas/company-info.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: CompanyInfo.name, schema: CompanyInfoSchema }])],
    controllers: [CompanyController],
    providers: [CompanyService],
    exports: [CompanyService],
})
export class CompanyModule {}
