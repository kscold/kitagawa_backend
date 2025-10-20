import { Injectable } from '@nestjs/common';
import { HomeSettingsDocument } from '../../schemas/home-settings.schema';
import { HomeSettingsRepository } from './repository/home-settings.repository';

/**
 * HomeSettings Public Service
 * 일반 사용자용 비즈니스 로직
 */
@Injectable()
export class HomeSettingsService {
    constructor(private readonly homeSettingsRepository: HomeSettingsRepository) {}

    /**
     * 활성화된 홈 설정 조회
     */
    async getSettings(): Promise<HomeSettingsDocument> {
        const settings = await this.homeSettingsRepository.findOrCreate();

        // 이미지 순서대로 정렬
        if (settings.mainImages) {
            settings.mainImages.sort((a, b) => a.order - b.order);
        }

        return settings;
    }
}
