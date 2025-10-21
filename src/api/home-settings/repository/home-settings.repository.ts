import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { HomeSettings, HomeSettingsDocument, HomeImage, HomeIntroduction } from '../../../schemas/home-settings.schema';

/**
 * HomeSettings Repository
 * 순수한 데이터베이스 쿼리만 담당
 * Singleton 패턴으로 단일 document 관리
 */
@Injectable()
export class HomeSettingsRepository {
    constructor(@InjectModel(HomeSettings.name) private readonly homeSettingsModel: Model<HomeSettingsDocument>) {}

    /**
     * 홈 설정 조회 (없으면 기본값 생성)
     */
    async findOrCreate(): Promise<HomeSettingsDocument> {
        let settings = (await this.homeSettingsModel.findOne().exec()) as HomeSettingsDocument | null;

        if (!settings) {
            // 설정이 없으면 기본값으로 생성
            const newSettings = new this.homeSettingsModel({
                mainImages: [],
                introduction: {
                    title: '',
                    titleKo: '',
                    description: '',
                    descriptionKo: '',
                },
                isActive: true,
                metadata: {},
            });
            settings = (await newSettings.save()) as HomeSettingsDocument;
        }

        return settings;
    }

    /**
     * 홈 소개 업데이트
     */
    async updateIntroduction(introduction: Partial<HomeIntroduction>): Promise<HomeSettingsDocument | null> {
        const settings = await this.findOrCreate();
        return (await this.homeSettingsModel
            .findByIdAndUpdate(
                settings._id,
                {
                    $set: {
                        'introduction.title': introduction.title ?? settings.introduction?.title,
                        'introduction.titleKo': introduction.titleKo ?? settings.introduction?.titleKo,
                        'introduction.description': introduction.description ?? settings.introduction?.description,
                        'introduction.descriptionKo':
                            introduction.descriptionKo ?? settings.introduction?.descriptionKo,
                    },
                },
                { new: true },
            )
            .exec()) as HomeSettingsDocument | null;
    }

    /**
     * 대표 이미지 추가
     */
    async addMainImage(image: HomeImage): Promise<HomeSettingsDocument | null> {
        const settings = await this.findOrCreate();
        return (await this.homeSettingsModel
            .findByIdAndUpdate(
                settings._id,
                {
                    $push: { mainImages: image },
                },
                { new: true },
            )
            .exec()) as HomeSettingsDocument | null;
    }

    /**
     * 대표 이미지 삭제
     */
    async removeMainImage(imageUrl: string): Promise<HomeSettingsDocument | null> {
        const settings = await this.findOrCreate();
        return (await this.homeSettingsModel
            .findByIdAndUpdate(
                settings._id,
                {
                    $pull: { mainImages: { url: imageUrl } },
                },
                { new: true },
            )
            .exec()) as HomeSettingsDocument | null;
    }

    /**
     * 대표 이미지 순서 변경
     */
    async updateImageOrder(images: HomeImage[]): Promise<HomeSettingsDocument | null> {
        const settings = await this.findOrCreate();
        return (await this.homeSettingsModel
            .findByIdAndUpdate(
                settings._id,
                {
                    $set: { mainImages: images },
                },
                { new: true },
            )
            .exec()) as HomeSettingsDocument | null;
    }

    /**
     * 전체 설정 업데이트
     */
    async update(settingsData: Partial<HomeSettings>): Promise<HomeSettingsDocument | null> {
        const settings = await this.findOrCreate();
        return (await this.homeSettingsModel
            .findByIdAndUpdate(settings._id, { $set: settingsData }, { new: true })
            .exec()) as HomeSettingsDocument | null;
    }
}
