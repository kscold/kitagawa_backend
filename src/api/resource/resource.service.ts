import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ResourceRepository } from './repository/resource.repository';

import { ResourceDocument, ResourceType } from '../../schemas/resource.schema';
import { CategoryModel, CategoryDocument } from '../../schemas/category.schema';

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
        @InjectModel(CategoryModel.name)
        private readonly categoryModel: Model<CategoryDocument>,
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

    /**
     * Level1 카테고리 목록 조회 (자료 개수 포함)
     */
    async getLevel1CategoriesWithResourceCount(): Promise<
        Array<{
            _id: any;
            name: string;
            slug: string;
            imageUrl: string;
            content: string;
            order: number;
            count: number;
        }>
    > {
        const methodName = 'getLevel1CategoriesWithResourceCount';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청`);
            }

            // CATALOGUE 제외한 Level 1 카테고리 조회
            const categories = await this.categoryModel
                .find({
                    level: 1,
                    isActive: true,
                    slug: { $ne: 'catalogue' },
                })
                .select('_id name slug imageUrl content order')
                .sort({ order: 1 })
                .lean();

            // 각 카테고리별 자료 개수 조회
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const { total } = await this.findAll({
                        category: category.slug,
                        limit: 0,
                        skip: 0,
                    });
                    return {
                        _id: category._id,
                        name: category.name,
                        slug: category.slug,
                        imageUrl: category.imageUrl,
                        content: category.content,
                        order: category.order,
                        count: total,
                    };
                }),
            );

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${categoriesWithCount.length}`);
            }

            return categoriesWithCount;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 목록 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * Level2 카테고리별 자료 조회 (모델별 그룹화 + 페이지네이션)
     */
    async findResourcesByLevel2CategoryGrouped(
        slug: string,
        filters: {
            keyword?: string;
            fileType?: string;
            page?: number;
            limit?: number;
        },
    ): Promise<{
        items: Array<{
            productName: string;
            model: string;
            pdfUrl?: string;
            dwgUrl?: string;
            imageUrl?: string;
            order?: number;
        }>;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }> {
        const methodName = 'findResourcesByLevel2CategoryGrouped';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}, filters: ${JSON.stringify(filters)}`);
            }

            // 모든 자료 조회
            const { resources } = await this.findAll({
                category: slug,
                keyword: filters.keyword,
                fileType: filters.fileType,
                limit: 0,
                skip: 0,
            });

            // 모델별로 그룹화
            const modelMap = new Map<
                string,
                {
                    productName: string;
                    model: string;
                    pdfUrl?: string;
                    dwgUrl?: string;
                    imageUrl?: string;
                    order: number;
                }
            >();

            resources.forEach((resource) => {
                const model = resource.metadata?.model;
                const productName = resource.metadata?.productName;

                // Use productName as fallback if model is not available
                const groupKey = model || productName;

                if (!groupKey || !productName) return;

                if (!modelMap.has(groupKey)) {
                    modelMap.set(groupKey, {
                        productName,
                        model: groupKey,
                        imageUrl: resource.thumbnailUrl,
                        order: resource.order || 0,
                    });
                }

                const entry = modelMap.get(groupKey);
                const fileUrl = resource.file?.url;

                // imageUrl이 없으면 업데이트
                if (!entry.imageUrl && resource.thumbnailUrl) {
                    entry.imageUrl = resource.thumbnailUrl;
                }

                // order 값 업데이트 (더 높은 order 우선)
                if (resource.order && resource.order > entry.order) {
                    entry.order = resource.order;
                }

                if (fileUrl) {
                    if (fileUrl.toLowerCase().endsWith('.pdf')) {
                        entry.pdfUrl = fileUrl;
                    } else if (fileUrl.toLowerCase().endsWith('.dwg')) {
                        entry.dwgUrl = fileUrl;
                    }
                }
            });

            // Map을 배열로 변환하고 order로 정렬
            const allItems = Array.from(modelMap.values()).sort((a, b) => {
                // order가 낮을수록 앞으로 (오름차순) - 단, order가 0인 경우는 뒤로
                if (a.order === 0 && b.order === 0) {
                    // 둘 다 0이면 productName으로 정렬
                    return a.productName.localeCompare(b.productName);
                }
                if (a.order === 0) return 1; // a를 뒤로
                if (b.order === 0) return -1; // b를 뒤로
                if (a.order !== b.order) {
                    return a.order - b.order; // 오름차순
                }
                // order가 같으면 productName으로 정렬 (오름차순)
                return a.productName.localeCompare(b.productName);
            });

            // 페이지네이션 적용
            const page = filters.page || 1;
            const limit = filters.limit || 50;
            const skip = (page - 1) * limit;
            const paginatedItems = allItems.slice(skip, skip + limit);
            const totalItems = allItems.length;

            const result = {
                items: paginatedItems,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                    hasNextPage: skip + limit < totalItems,
                    hasPreviousPage: page > 1,
                },
            };

            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 성공 - totalItems: ${totalItems}, currentPage: ${page}, items: ${paginatedItems.length}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리별 자료 조회 중 오류가 발생했습니다');
        }
    }
}
