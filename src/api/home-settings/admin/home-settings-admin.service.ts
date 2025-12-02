import {
    Injectable,
    Logger,
    InternalServerErrorException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HomeSettingsRepository } from '../repository/home-settings.repository';

import { HomeSettingsDocument, HomeImage } from '../../../schema/home-settings.schema';

/**
 * HomeSettings Admin Service
 * 관리자 전용 비즈니스 로직, 에러 핸들링, 로깅 담당
 */
@Injectable()
export class HomeSettingsAdminService {
    private readonly logger = new Logger(HomeSettingsAdminService.name);
    private readonly isDevelopment: boolean;
    private readonly MAX_IMAGES = 5; // 최대 이미지 개수

    constructor(
        private readonly homeSettingsRepository: HomeSettingsRepository,
        private readonly configService: ConfigService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    }

    /**
     * 홈 설정 조회
     */
    async getSettings(): Promise<HomeSettingsDocument> {
        const methodName = 'getSettings';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청`);
            }

            const settings = await this.homeSettingsRepository.findOrCreate();

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공`);
            }

            return settings;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('홈 설정 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 홈 소개 업데이트
     */
    async updateIntroduction(introductionData: any): Promise<HomeSettingsDocument> {
        const methodName = 'updateIntroduction';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청`);
            }

            const updatedSettings = await this.homeSettingsRepository.updateIntroduction(introductionData);

            if (!updatedSettings) {
                throw new InternalServerErrorException('홈 소개 업데이트에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공`);
            }

            return updatedSettings;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('홈 소개 업데이트 중 오류가 발생했습니다');
        }
    }

    /**
     * 대표 이미지 추가
     */
    async addMainImage(imageData: { url: string; alt?: string; altKo?: string }): Promise<HomeSettingsDocument> {
        const methodName = 'addMainImage';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - url: ${imageData.url}`);
            }

            // 현재 설정 조회
            const currentSettings = await this.homeSettingsRepository.findOrCreate();

            // 최대 개수 체크
            if (currentSettings.mainImages.length >= this.MAX_IMAGES) {
                throw new BadRequestException(`최대 ${this.MAX_IMAGES}개의 이미지만 추가할 수 있습니다`);
            }

            // 중복 체크
            const isDuplicate = currentSettings.mainImages.some((img) => img.url === imageData.url);
            if (isDuplicate) {
                throw new BadRequestException('이미 존재하는 이미지입니다');
            }

            // 새 이미지 추가 (order는 현재 배열 길이로 설정)
            const newImage: HomeImage = {
                url: imageData.url,
                order: currentSettings.mainImages.length,
                alt: imageData.alt,
                altKo: imageData.altKo,
            };

            const updatedSettings = await this.homeSettingsRepository.addMainImage(newImage);

            if (!updatedSettings) {
                throw new InternalServerErrorException('이미지 추가에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - url: ${imageData.url}`);
            }

            return updatedSettings;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('이미지 추가 중 오류가 발생했습니다');
        }
    }

    /**
     * 대표 이미지 삭제
     */
    async removeMainImage(imageUrl: string): Promise<HomeSettingsDocument> {
        const methodName = 'removeMainImage';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - url: ${imageUrl}`);
            }

            // 현재 설정 조회
            const currentSettings = await this.homeSettingsRepository.findOrCreate();

            // 이미지 존재 확인
            const imageExists = currentSettings.mainImages.some((img) => img.url === imageUrl);
            if (!imageExists) {
                throw new NotFoundException('삭제할 이미지를 찾을 수 없습니다');
            }

            const updatedSettings = await this.homeSettingsRepository.removeMainImage(imageUrl);

            if (!updatedSettings) {
                throw new InternalServerErrorException('이미지 삭제에 실패했습니다');
            }

            // 순서 재조정
            const reorderedImages = updatedSettings.mainImages.map((img, index) => ({
                ...img,
                order: index,
            }));

            const finalSettings = await this.homeSettingsRepository.updateImageOrder(reorderedImages);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - url: ${imageUrl}`);
            }

            return finalSettings!;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('이미지 삭제 중 오류가 발생했습니다');
        }
    }

    /**
     * 이미지 순서 변경
     */
    async updateImageOrder(imageUrls: string[]): Promise<HomeSettingsDocument> {
        const methodName = 'updateImageOrder';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - count: ${imageUrls.length}`);
            }

            // 현재 설정 조회
            const currentSettings = await this.homeSettingsRepository.findOrCreate();

            // 모든 URL이 존재하는지 확인
            const currentUrls = currentSettings.mainImages.map((img) => img.url);
            const invalidUrls = imageUrls.filter((url) => !currentUrls.includes(url));

            if (invalidUrls.length > 0) {
                throw new BadRequestException(
                    `존재하지 않는 이미지 URL이 포함되어 있습니다: ${invalidUrls.join(', ')}`,
                );
            }

            // 개수 확인
            if (imageUrls.length !== currentSettings.mainImages.length) {
                throw new BadRequestException('모든 이미지의 순서를 지정해야 합니다');
            }

            // 새로운 순서로 이미지 재정렬
            const reorderedImages: HomeImage[] = imageUrls.map((url, index) => {
                const originalImage = currentSettings.mainImages.find((img) => img.url === url)!;
                return {
                    ...originalImage,
                    order: index,
                };
            });

            const updatedSettings = await this.homeSettingsRepository.updateImageOrder(reorderedImages);

            if (!updatedSettings) {
                throw new InternalServerErrorException('이미지 순서 변경에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공`);
            }

            return updatedSettings;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('이미지 순서 변경 중 오류가 발생했습니다');
        }
    }
}
