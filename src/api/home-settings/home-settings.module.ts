import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HomeSettingsController } from './home-settings.controller';
import { HomeSettingsAdminController } from './admin/home-settings-admin.controller';

import { HomeSettingsService } from './home-settings.service';
import { HomeSettingsAdminService } from './admin/home-settings-admin.service';

import { HomeSettings, HomeSettingsSchema } from '../../schemas/home-settings.schema';

import { HomeSettingsRepository } from './repository/home-settings.repository';

import { AdminJwtModule } from '../../common/module/admin-jwt.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: HomeSettings.name, schema: HomeSettingsSchema }]), AdminJwtModule],
    controllers: [HomeSettingsController, HomeSettingsAdminController],
    providers: [HomeSettingsService, HomeSettingsRepository, HomeSettingsAdminService],
    exports: [HomeSettingsService, HomeSettingsRepository],
})
export class HomeSettingsModule {}
