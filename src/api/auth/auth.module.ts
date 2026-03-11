import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { Admin, AdminSchema } from '../../schema/admin.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]), AdminJwtModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
