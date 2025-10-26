import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ResourceRepository } from './repository/resource.repository';

import { ResourceDocument, ResourceType } from '../../schemas/resource.schema';

/**
 * Resource Service
 * 비즈니스 로직, 에러 핸들링, 로깅 담당
 */
@Injectable()
export class ResourceService {
    private readonly logger = new Logger(ResourceService.name);
    private readonly isDevelopment: boolean;

    constructor(
        private readonly resourceRepository: ResourceRepository,
        private readonly configService: ConfigService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    }

    /**
     * 자료 목록 조회
     */
    async findAll(filters: {
        type?: ResourceType;
        category?: string;
        keyword?: string;
        fileType?: string;
        limit?: number;
        skip?: number;
    }): Promise<{ resources: ResourceDocument[]; total: number }> {
        const methodName = 'findAll';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - filters: ${JSON.stringify(filters)}`);
            }

            const result = await this.resourceRepository.findAllWithPagination({
                ...filters,
                isActive: true,
            });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${result.total}, count: ${result.resources.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('자료 목록 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * ID로 자료 조회
     */
    async findById(id: string): Promise<ResourceDocument> {
        const methodName = 'findById';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - id: ${id}`);
            }

            const resource = await this.resourceRepository.findById(id);

            if (!resource) {
                throw new NotFoundException(`자료를 찾을 수 없습니다 (ID: ${id})`);
            }

            if (!resource.isActive) {
                throw new NotFoundException(`비활성화된 자료입니다 (ID: ${id})`);
            }

            // 조회수 증가
            await this.resourceRepository.incrementViewCount(id);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - id: ${id}`);
            }

            return resource;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('자료 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 다운로드 수 증가
     */
    async incrementDownloadCount(id: string): Promise<void> {
        const methodName = 'incrementDownloadCount';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - id: ${id}`);
            }

            await this.resourceRepository.incrementDownloadCount(id);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - id: ${id}`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('다운로드 수 증가 중 오류가 발생했습니다');
        }
    }

    /**
     * 자료 타입 통계 조회
     */
    async getResourceTypeStats(): Promise<{ type: ResourceType; count: number }[]> {
        const methodName = 'getResourceTypeStats';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청`);
            }

            const stats = await this.resourceRepository.getResourceTypeStats();

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${stats.length}`);
            }

            return stats;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('자료 타입 통계 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 추천 자료 조회
     */
    async getFeaturedResources(limit: number = 10): Promise<ResourceDocument[]> {
        const methodName = 'getFeaturedResources';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - limit: ${limit}`);
            }

            const resources = await this.resourceRepository.findFeatured(limit);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${resources.length}`);
            }

            return resources;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('추천 자료 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 인기 자료 조회
     */
    async getPopularResources(limit: number = 10): Promise<ResourceDocument[]> {
        const methodName = 'getPopularResources';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - limit: ${limit}`);
            }

            const resources = await this.resourceRepository.findPopular(limit);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${resources.length}`);
            }

            return resources;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('인기 자료 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 최신 자료 조회
     */
    async getRecentResources(limit: number = 10): Promise<ResourceDocument[]> {
        const methodName = 'getRecentResources';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - limit: ${limit}`);
            }

            const resources = await this.resourceRepository.findRecent(limit);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${resources.length}`);
            }

            return resources;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('최신 자료 조회 중 오류가 발생했습니다');
        }
    }
}
