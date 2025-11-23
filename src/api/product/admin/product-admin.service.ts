import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProductDocument } from '../../../schemas/product.schema';

import { ProductRepository } from '../repository/product.repository';

/**
 * Product Admin Service
 * 관리자 전용 비즈니스 로직, 에러 핸들링, 로깅 담당
 */
@Injectable()
export class ProductAdminService {
    private readonly logger = new Logger(ProductAdminService.name);
    private readonly isDevelopment: boolean;

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly configService: ConfigService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    }

    /**
     * 제품 목록 조회 (관리자용 - 비활성화 제품 포함)
     */
    async findAll(filters: {
        category?: string;
        subCategory?: string;
        tag?: string;
        isActive?: boolean;
        limit?: number;
        skip?: number;
    }): Promise<{ products: ProductDocument[]; total: number }> {
        const methodName = 'findAll';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - filters: ${JSON.stringify(filters)}`);
            }

            // 관리자는 모든 제품을 볼 수 있음 (isActive 필터 없이)
            const result = await this.productRepository.findAllWithPagination(filters);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${result.total}, count: ${result.products.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 목록 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 슬러그로 조회 (관리자용 - 비활성화 제품 포함)
     */
    async findBySlug(slug: string): Promise<ProductDocument> {
        const methodName = 'findBySlug';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new BadRequestException(`제품을 찾을 수 없습니다 (slug: ${slug})`);
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return product;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 생성
     */
    async create(productData: any): Promise<ProductDocument> {
        const methodName = 'create';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${productData.slug}`);
            }

            // 중복 체크 (slug 기반)
            const existingProduct = await this.productRepository.findBySlug(productData.slug);
            if (existingProduct) {
                throw new BadRequestException(`제품 슬러그 '${productData.slug}'는 이미 존재합니다`);
            }

            // 제품 생성
            const newProduct = await this.productRepository.create({
                ...productData,
                isActive: productData.isActive ?? true, // 기본값: 활성화
                isFeatured: productData.isFeatured ?? false, // 기본값: 추천 아님
                order: productData.order ?? 0, // 기본값: 0
                viewCount: 0, // 조회수 초기화
                metadata: {
                    lastCrawled: new Date(),
                    crawlSource: 'admin',
                    version: '1.0',
                },
            });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${newProduct.slug}`);
            }

            return newProduct;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 생성 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 수정 (slug 기반)
     */
    async update(slug: string, productData: any): Promise<ProductDocument> {
        const methodName = 'update';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new BadRequestException(`제품 슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // slug와 slug는 수정 불가능하므로 제거
            delete productData.slug;
            delete productData.slug;

            // 메타데이터 업데이트
            const updatedMetadata = {
                ...product.metadata,
                lastCrawled: new Date(),
                crawlSource: 'admin-update',
            };

            // 제품 수정
            const updatedProduct = await this.productRepository.update(slug, {
                ...productData,
                metadata: updatedMetadata,
            });

            if (!updatedProduct) {
                throw new BadRequestException('제품 수정에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedProduct;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 수정 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 삭제 (slug 기반)
     */
    async delete(slug: string): Promise<void> {
        const methodName = 'delete';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new BadRequestException(`제품 슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 제품 삭제 (Hard Delete)
            const deleted = await this.productRepository.delete(slug);
            if (!deleted) {
                throw new BadRequestException('제품 삭제에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 삭제 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 비활성화 (slug 기반)
     */
    async deactivate(slug: string): Promise<ProductDocument> {
        const methodName = 'deactivate';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new BadRequestException(`제품 슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 이미 비활성화 상태인 경우
            if (!product.isActive) {
                throw new BadRequestException('이미 비활성화된 제품입니다');
            }

            // 제품 비활성화
            const updatedProduct = await this.productRepository.toggleActive(slug, false);
            if (!updatedProduct) {
                throw new BadRequestException('제품 비활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedProduct;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 비활성화 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 활성화 (slug 기반)
     */
    async activate(slug: string): Promise<ProductDocument> {
        const methodName = 'activate';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new BadRequestException(`제품 슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 이미 활성화 상태인 경우
            if (product.isActive) {
                throw new BadRequestException('이미 활성화된 제품입니다');
            }

            // 제품 활성화
            const updatedProduct = await this.productRepository.toggleActive(slug, true);
            if (!updatedProduct) {
                throw new BadRequestException('제품 활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updatedProduct;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 활성화 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 순서 업데이트 (slug 기반, DND용)
     * @deprecated 대신 updateOrderByLevel 사용
     */
    async updateOrder(slug: string, order: number): Promise<ProductDocument> {
        const methodName = 'updateOrder';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}, order: ${order}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new BadRequestException(`제품 슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // order 유효성 검사
            if (order < 0) {
                throw new BadRequestException('order는 0 이상이어야 합니다');
            }

            // order 업데이트
            const updatedProduct = await this.productRepository.update(slug, { order });
            if (!updatedProduct) {
                throw new BadRequestException('제품 순서 업데이트에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}, order: ${order}`);
            }

            return updatedProduct;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 순서 업데이트 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 레벨별 제품 목록 조회
     */
    async findByCategory(
        level: 1 | 2,
        categorySlug: string,
        options?: { limit?: number; skip?: number },
    ): Promise<{ products: ProductDocument[]; total: number }> {
        const methodName = 'findByCategory';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - level: ${level}, categorySlug: ${categorySlug}`);
            }

            const result = await this.productRepository.findByCategoryWithLevel(level, categorySlug, options);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${result.total}, count: ${result.products.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('카테고리별 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 순서 업데이트 (레벨별)
     */
    async updateOrderByLevel(
        slug: string,
        level: 1 | 2,
        categorySlug: string,
        order: number,
    ): Promise<ProductDocument> {
        const methodName = 'updateOrderByLevel';

        try {
            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 요청 - slug: ${slug}, level: ${level}, categorySlug: ${categorySlug}, order: ${order}`,
                );
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new BadRequestException(`제품 슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // order 유효성 검사
            if (order < 0) {
                throw new BadRequestException('order는 0 이상이어야 합니다');
            }

            // 제품이 해당 카테고리에 속하는지 확인
            const belongsToCategory =
                level === 1
                    ? product.category.mainCategory === categorySlug
                    : product.category.subCategory === categorySlug;

            if (!belongsToCategory) {
                throw new BadRequestException(`제품이 카테고리 '${categorySlug}' (Level ${level})에 속하지 않습니다`);
            }

            // order 업데이트
            const updatedProduct = await this.productRepository.updateOrderByLevel(slug, level, order);
            if (!updatedProduct) {
                throw new BadRequestException('제품 순서 업데이트에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}, level: ${level}, order: ${order}`);
            }

            return updatedProduct;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 순서 업데이트 중 오류가 발생했습니다');
        }
    }

    /**
     * 여러 제품의 순서를 일괄 업데이트 (DND용)
     */
    async reorderBatch(level: 1 | 2, categorySlug: string, items: { slug: string; order: number }[]): Promise<void> {
        const methodName = 'reorderBatch';

        try {
            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 요청 - level: ${level}, categorySlug: ${categorySlug}, items: ${items.length}개`,
                );
            }

            // 모든 제품이 존재하는지 확인
            for (const item of items) {
                const product = await this.productRepository.findBySlug(item.slug);
                if (!product) {
                    throw new BadRequestException(`제품 슬러그 '${item.slug}'에 해당하는 제품을 찾을 수 없습니다`);
                }

                // 제품이 해당 카테고리에 속하는지 확인
                const belongsToCategory =
                    level === 1
                        ? product.category.mainCategory === categorySlug
                        : product.category.subCategory === categorySlug;

                if (!belongsToCategory) {
                    throw new BadRequestException(
                        `제품 '${item.slug}'이(가) 카테고리 '${categorySlug}' (Level ${level})에 속하지 않습니다`,
                    );
                }

                // order 유효성 검사
                if (item.order < 0) {
                    throw new BadRequestException(`제품 '${item.slug}'의 order는 0 이상이어야 합니다`);
                }
            }

            // 일괄 업데이트
            await this.productRepository.updateOrdersBatch(level, items);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - ${items.length}개 제품 순서 업데이트 완료`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new BadRequestException('제품 순서 일괄 업데이트 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 이미지 업데이트
     */
    async updateProductImage(slug: string, mainImageUrl: string): Promise<ProductDocument> {
        const methodName = 'updateProductImage';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}, mainImageUrl: ${mainImageUrl}`);
            }

            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new BadRequestException(`제품을 찾을 수 없습니다: ${slug}`);
            }

            const updated = await this.productRepository.update(slug, { mainImageUrl });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updated;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 제품명 업데이트
     */
    async updateProductName(slug: string, productName: string): Promise<ProductDocument> {
        const methodName = 'updateProductName';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}, productName: ${productName}`);
            }

            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new BadRequestException(`제품을 찾을 수 없습니다: ${slug}`);
            }

            const updated = await this.productRepository.update(slug, { productName });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updated;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 제품 설명 업데이트
     */
    async updateProductDescription(
        slug: string,
        description: { content?: string; contentDetail?: string; description?: string },
    ): Promise<ProductDocument> {
        const methodName = 'updateProductDescription';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new BadRequestException(`제품을 찾을 수 없습니다: ${slug}`);
            }

            const updated = await this.productRepository.update(slug, description);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updated;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 제품 자료 파일 업데이트
     */
    async updateProductFiles(slug: string, files: any[]): Promise<ProductDocument> {
        const methodName = 'updateProductFiles';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}, files: ${files.length}개`);
            }

            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new BadRequestException(`제품을 찾을 수 없습니다: ${slug}`);
            }

            // specificationFiles 형식으로 변환
            const specificationFiles = files.map((file) => ({
                title: file.title,
                url: file.url,
                type: file.type,
                category: '2D', // 기본값, 필요시 수정 가능
                model: file.title, // 모델명을 title로 사용
            }));

            const updated = await this.productRepository.update(slug, { specificationFiles });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return updated;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }
}
