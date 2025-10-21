import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompanyController } from './company.controller';
import { CompanyAdminController } from './admin/company-admin.controller';

import { CompanyService } from './company.service';
import { CompanyAdminService } from './admin/company-admin.service';

import { CompanyInfo, CompanyInfoSchema } from '../../schemas/company-info.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: CompanyInfo.name, schema: CompanyInfoSchema }])],
    controllers: [CompanyController, CompanyAdminController],
    providers: [CompanyService, CompanyAdminService],
    exports: [CompanyService, CompanyAdminService],
})
export class CompanyModule {}
