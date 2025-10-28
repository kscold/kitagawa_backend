import {
    Injectable,
    NotFoundException,
    Logger,
    InternalServerErrorException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CategoryRepository } from '../repository/category.repository';

import { CategoryDocument, CategoryLevel } from '../../../schemas/category.schema';

/**
 * Category Admin Service
 * 관리자 전용 비즈니스 로직, 에러 핸들링, 로깅 담당
 */
@Injectable()
export class CategoryAdminService {
    private readonly logger = new Logger(CategoryAdminService.name);
    private readonly isDevelopment: boolean;

    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly configService: ConfigService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    }

    /**
     * 모든 카테고리 조회 (관리자용 - 비활성화 포함)
     */
    async findAll(filters?: {
        level?: CategoryLevel;
        isActive?: boolean;
    }): Promise<{ categories: CategoryDocument[]; total: number }> {
        const methodName = 'findAll';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - filters: ${JSON.stringify(filters)}`);
            }

            const categories = await this.categoryRepository.findAll(filters);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${categories.length}`);
            }

            return {
                categories,
                total: categories.length,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 목록 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * slug로 카테고리 조회 (관리자용)
     */
    async findBySlug(slug: string): Promise<CategoryDocument> {
        const methodName = 'findBySlug';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            const category = await this.categoryRepository.findBySlug(slug);

            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return category;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 생성
     */
    async create(categoryData: any): Promise<CategoryDocument> {
        const methodName = 'create';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${categoryData.slug}`);
            }

            // slug 중복 체크
            const existingCategory = await this.categoryRepository.findBySlug(categoryData.slug);
            if (existingCategory) {
                throw new ConflictException(`slug '${categoryData.slug}'는 이미 존재합니다`);
            }

            // Level 2인 경우 parentName과 mainCategory 검증
            if (categoryData.level === CategoryLevel.LEVEL_2) {
                if (!categoryData.parentName) {
                    throw new BadRequestException('Level 2 카테고리는 parentName이 필수입니다');
                }

                // 부모 카테고리 존재 확인
                const parentCategory = await this.categoryRepository.findBySlug(
                    categoryData.parentName.toLowerCase().replace(/\s+/g, '-'),
                );
                if (!parentCategory || parentCategory.level !== CategoryLevel.LEVEL_1) {
                    throw new BadRequestException(`유효한 부모 카테고리(Level 1)를 찾을 수 없습니다`);
                }

                // mainCategory 자동 설정
                categoryData.mainCategory = categoryData.parentName;
            } else {
                // Level 1인 경우 parentName과 mainCategory는 null
                categoryData.parentName = null;
                categoryData.mainCategory = null;
            }

            // 카테고리 생성
            const newCategory = await this.categoryRepository.create({
                ...categoryData,
                isActive: categoryData.isActive ?? true,
                order: categoryData.order ?? 0,
                productCount: 0,
            });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${newCategory.slug}`);
            }

            return newCategory;
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 생성 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 수정 (slug 기반)
     */
    async update(slug: string, categoryData: any): Promise<CategoryDocument> {
        const methodName = 'update';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 카테고리 존재 확인
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // slug 수정 방지
            delete categoryData.slug;

            // Level 2인 경우 parentName 검증
            if (categoryData.level === CategoryLevel.LEVEL_2 || category.level === CategoryLevel.LEVEL_2) {
                if (categoryData.parentName) {
                    categoryData.mainCategory = categoryData.parentName;
                }
            }

            // 카테고리 수정
            const updatedCategory = await this.categoryRepository.updateBySlug(slug, categoryData);

            if (!updatedCategory) {
                throw new InternalServerErrorException('카테고리 수정에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedCategory;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 수정 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 삭제 (slug 기반)
     */
    async delete(slug: string): Promise<void> {
        const methodName = 'delete';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 카테고리 존재 확인
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // Level 1 카테고리인 경우, 하위 카테고리 확인
            if (category.level === CategoryLevel.LEVEL_1) {
                const children = await this.categoryRepository.findByParentName(category.name);
                if (children.length > 0) {
                    throw new BadRequestException(
                        `하위 카테고리가 ${children.length}개 존재하여 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하세요.`,
                    );
                }
            }

            // 제품이 있는지 확인
            if (category.productCount > 0) {
                throw new BadRequestException(
                    `이 카테고리에 ${category.productCount}개의 제품이 있어 삭제할 수 없습니다.`,
                );
            }

            // 카테고리 삭제
            const deleted = await this.categoryRepository.deleteBySlug(slug);
            if (!deleted) {
                throw new InternalServerErrorException('카테고리 삭제에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 삭제 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 비활성화 (slug 기반)
     */
    async deactivate(slug: string): Promise<CategoryDocument> {
        const methodName = 'deactivate';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 카테고리 존재 확인
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 이미 비활성화 상태인 경우
            if (!category.isActive) {
                throw new BadRequestException('이미 비활성화된 카테고리입니다');
            }

            // 카테고리 비활성화
            const updatedCategory = await this.categoryRepository.toggleActiveBySlug(slug, false);
            if (!updatedCategory) {
                throw new InternalServerErrorException('카테고리 비활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedCategory;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 비활성화 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 활성화 (slug 기반)
     */
    async activate(slug: string): Promise<CategoryDocument> {
        const methodName = 'activate';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 카테고리 존재 확인
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 이미 활성화 상태인 경우
            if (category.isActive) {
                throw new BadRequestException('이미 활성화된 카테고리입니다');
            }

            // 카테고리 활성화
            const updatedCategory = await this.categoryRepository.toggleActiveBySlug(slug, true);
            if (!updatedCategory) {
                throw new InternalServerErrorException('카테고리 활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedCategory;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 활성화 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 순서 변경 (slug 기반)
     */
    async updateOrder(slug: string, order: number): Promise<CategoryDocument> {
        const methodName = 'updateOrder';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}, order: ${order}`);
            }

            // 카테고리 존재 확인
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 순서 업데이트
            const updatedCategory = await this.categoryRepository.updateOrderBySlug(slug, order);
            if (!updatedCategory) {
                throw new InternalServerErrorException('카테고리 순서 변경에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}, order: ${order}`);
            }

            return updatedCategory;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 순서 변경 중 오류가 발생했습니다');
        }
    }
}
