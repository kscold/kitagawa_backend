import { Injectable, Logger, BadRequestException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CategoryRepository } from '../repository/category.repository';

import { Product, ProductDocument } from '../../../schema/product.schema';
import { CategoryDocument, CategoryLevel } from '../../../schema/category.schema';

import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';

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
        @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    }

    /**
     * 카테고리 응답 정규화 (불필요한 필드 제거)
     */
    private normalizeCategoryResponse(category: CategoryDocument) {
        const categoryObj = category.toObject ? category.toObject() : { ...category };

        // 제거할 필드 목록
        const fieldsToRemove = ['children', 'parentLevelCategory', 'parentLevelSlug'];

        fieldsToRemove.forEach((field) => {
            if (categoryObj[field] !== undefined) {
                delete categoryObj[field];
            }
        });

        return categoryObj;
    }

    /**
     * 모든 카테고리 조회 (관리자용 - 비활성화 포함)
     */
    async findAll(
        filters?: {
            level?: CategoryLevel;
            isActive?: boolean;
        },
        pagination?: { page: number; limit: number },
    ) {
        const methodName = 'findAll';

        try {
            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 요청 - filters: ${JSON.stringify(filters)}, pagination: ${JSON.stringify(pagination)}`,
                );
            }

            // 페이지네이션이 있는 경우
            if (pagination) {
                const { categories, total } = await this.categoryRepository.findAllWithPagination(
                    filters || {},
                    pagination.page,
                    pagination.limit,
                );

                const totalPages = Math.ceil(total / pagination.limit);

                if (this.isDevelopment) {
                    this.logger.log(
                        `[${methodName}] 성공 - count: ${categories.length}, total: ${total}, page: ${pagination.page}/${totalPages}`,
                    );
                }

                // 카테고리 응답 정규화
                const normalizedCategories = categories.map((cat) => this.normalizeCategoryResponse(cat));

                const paginatedData = PaginationResponseDto.fromPageLimit(
                    normalizedCategories,
                    total,
                    pagination.page,
                    pagination.limit,
                );

                return {
                    success: true,
                    code: HttpStatus.OK,
                    message: '카테고리 목록 조회 성공',
                    data: paginatedData,
                };
            }

            // 페이지네이션이 없는 경우
            const categories = await this.categoryRepository.findAll(filters);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${categories.length}`);
            }

            // 카테고리 응답 정규화
            const normalizedCategories = categories.map((cat) => this.normalizeCategoryResponse(cat));

            return {
                success: true,
                code: HttpStatus.OK,
                message: '카테고리 목록 조회 성공',
                data: {
                    items: normalizedCategories,
                    total: normalizedCategories.length,
                },
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 목록 조회 중 오류가 발생했습니다');
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
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return category;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 조회 중 오류가 발생했습니다');
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
                throw new BadRequestException(`slug '${categoryData.slug}'는 이미 존재합니다`);
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
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 생성 중 오류가 발생했습니다');
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
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
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
                throw new BadRequestException('카테고리 수정에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedCategory;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 수정 중 오류가 발생했습니다');
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
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
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
                throw new BadRequestException('카테고리 삭제에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 삭제 중 오류가 발생했습니다');
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
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 이미 비활성화 상태인 경우
            if (!category.isActive) {
                throw new BadRequestException('이미 비활성화된 카테고리입니다');
            }

            // 카테고리 비활성화
            const updatedCategory = await this.categoryRepository.toggleActiveBySlug(slug, false);
            if (!updatedCategory) {
                throw new BadRequestException('카테고리 비활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedCategory;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 비활성화 중 오류가 발생했습니다');
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
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 이미 활성화 상태인 경우
            if (category.isActive) {
                throw new BadRequestException('이미 활성화된 카테고리입니다');
            }

            // 카테고리 활성화
            const updatedCategory = await this.categoryRepository.toggleActiveBySlug(slug, true);
            if (!updatedCategory) {
                throw new BadRequestException('카테고리 활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedCategory;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 활성화 중 오류가 발생했습니다');
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
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 순서 업데이트
            const updatedCategory = await this.categoryRepository.updateOrderBySlug(slug, order);
            if (!updatedCategory) {
                throw new BadRequestException('카테고리 순서 변경에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}, order: ${order}`);
            }

            return updatedCategory;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 순서 변경 중 오류가 발생했습니다');
        }
    }

    /**
     * 여러 카테고리의 순서를 일괄 업데이트 (DND용)
     */
    async reorderBatch(
        level: 1 | 2,
        parentName: string | undefined,
        items: { slug: string; order: number }[],
    ): Promise<void> {
        const methodName = 'reorderBatch';

        try {
            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 요청 - level: ${level}, parentName: ${parentName || 'N/A'}, items: ${items.length}개`,
                );
            }

            // 모든 카테고리가 존재하는지 확인
            for (const item of items) {
                const category = await this.categoryRepository.findBySlug(item.slug);
                if (!category) {
                    throw new BadRequestException(
                        `카테고리 슬러그 '${item.slug}'에 해당하는 카테고리를 찾을 수 없습니다`,
                    );
                }

                // 카테고리 레벨 확인
                if (category.level !== level) {
                    throw new BadRequestException(
                        `카테고리 '${item.slug}'의 레벨이 Level ${level}이 아닙니다 (현재: Level ${category.level})`,
                    );
                }

                // Level 2인 경우 parentName 확인
                if (level === CategoryLevel.LEVEL_2 && parentName) {
                    if (category.parentName !== parentName) {
                        throw new BadRequestException(
                            `카테고리 '${item.slug}'이(가) 부모 카테고리 '${parentName}'에 속하지 않습니다`,
                        );
                    }
                }

                // order 유효성 검사
                if (item.order < 0) {
                    throw new BadRequestException(`카테고리 '${item.slug}'의 order는 0 이상이어야 합니다`);
                }
            }

            // 일괄 업데이트
            await this.categoryRepository.updateOrdersBatch(items);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - ${items.length}개 카테고리 순서 업데이트 완료`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리 순서 일괄 업데이트 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리에 속한 제품 목록 조회
     */
    async getCategoryProducts(
        slug: string,
        options?: { limit?: number; skip?: number },
    ): Promise<{ products: ProductDocument[]; total: number; category: CategoryDocument }> {
        const methodName = 'getCategoryProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 카테고리 조회
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            // 카테고리 레벨에 따라 쿼리 조건 설정
            let query: any = {};
            let orderField: string;

            switch (category.level) {
                case CategoryLevel.LEVEL_1:
                    query = { 'category.mainCategory': category.name };
                    orderField = 'order.level1';
                    break;
                case CategoryLevel.LEVEL_2:
                    query = {
                        'category.mainCategory': category.parentName,
                        'category.subCategory': category.name,
                    };
                    orderField = 'order.level2';
                    break;
                default:
                    throw new BadRequestException(`지원하지 않는 카테고리 레벨입니다: ${category.level}`);
            }

            // 제품 조회 (순서대로 정렬, 필요한 필드만 선택)
            const total = await this.productModel.countDocuments(query).exec();

            const productsQuery = this.productModel
                .find(query)
                .select('slug productName mainImageUrl content contentDetail order')
                .sort({ [orderField]: 1, createdAt: -1 });

            if (options?.skip !== undefined) {
                productsQuery.skip(options.skip);
            }

            if (options?.limit !== undefined) {
                productsQuery.limit(options.limit);
            }

            const products = await productsQuery.exec();

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${total}, count: ${products.length}`);
            }

            // 명시적으로 타입을 지정하여 반환
            const result: { products: ProductDocument[]; total: number; category: CategoryDocument } = {
                products,
                total,
                category,
            };

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 카테고리 내 제품 순서 일괄 변경 (DND용)
     */
    async reorderCategoryProducts(slug: string, items: Array<{ slug: string; order: number }>): Promise<void> {
        const methodName = 'reorderCategoryProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - categorySlug: ${slug}, items: ${items.length}개`);
            }

            // 카테고리 조회
            const category = await this.categoryRepository.findBySlug(slug);
            if (!category) {
                throw new BadRequestException(`카테고리를 찾을 수 없습니다 (slug: ${slug})`);
            }

            const level = category.level;
            const orderField = `order.level${level}`;

            // 각 제품의 유효성 검사 및 순서 업데이트
            for (const item of items) {
                // 제품 조회
                const product = await this.productModel.findOne({ slug: item.slug }).exec();
                if (!product) {
                    throw new BadRequestException(`제품을 찾을 수 없습니다 (slug: ${item.slug})`);
                }

                // 제품이 해당 카테고리에 속하는지 확인
                let belongsToCategory = false;
                switch (level) {
                    case CategoryLevel.LEVEL_1:
                        belongsToCategory = product.category?.mainCategory === category.name;
                        break;
                    case CategoryLevel.LEVEL_2:
                        belongsToCategory =
                            product.category?.mainCategory === category.parentName &&
                            product.category?.subCategory === category.name;
                        break;
                    default:
                        throw new BadRequestException(`지원하지 않는 카테고리 레벨입니다: ${level}`);
                }

                if (!belongsToCategory) {
                    throw new BadRequestException(`제품 '${item.slug}'이(가) 카테고리 '${slug}'에 속하지 않습니다`);
                }

                // order 유효성 검사
                if (item.order < 0) {
                    throw new BadRequestException(`제품 '${item.slug}'의 order는 0 이상이어야 합니다`);
                }

                // 순서 업데이트
                await this.productModel.updateOne({ slug: item.slug }, { [orderField]: item.order }).exec();
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - ${items.length}개 제품 순서 업데이트 완료`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }
}
