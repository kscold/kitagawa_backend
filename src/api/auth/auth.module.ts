import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { AdminJwtModule } from '../../common/module/admin-jwt.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]), AdminJwtModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
