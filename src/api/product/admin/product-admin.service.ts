import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProductDocument } from '../../../schema/product.schema';
import { CategoryDocument } from '../../../schema/category.schema';

import { ProductRepository } from '../repository/product.repository';
import { CategoryRepository } from '../../category/repository/category.repository';

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
        private readonly categoryRepository: CategoryRepository,
        private readonly configService: ConfigService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
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

    /**
     * 카테고리 + 서브카테고리 + 제품 조회 (DND용)
     * Level 1: 상위 카테고리 + 서브카테고리 목록 + 각 서브카테고리의 제품들
     * Level 2: 서브카테고리 + 제품 목록
     */
    async findCategoryWithProducts(level: 1 | 2, categorySlug: string) {
        const methodName = 'findCategoryWithProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - level: ${level}, categorySlug: ${categorySlug}`);
            }

            if (level === 1) {
                // Level 1: 상위 카테고리 조회
                const category = await this.categoryRepository.findBySlug(categorySlug);
                if (!category) {
                    throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${categorySlug}`);
                }

                // 서브카테고리 목록 조회 (order로 정렬)
                const subCategories = await this.categoryRepository.findByParentName(category.name);

                // Level 1: 서브카테고리 목록만 반환 (products는 제외)
                const subCategoriesData = subCategories.map((subCategory) => ({
                    _id: subCategory._id.toString(),
                    name: subCategory.name,
                    slug: subCategory.slug,
                    order: subCategory.order,
                    isActive: subCategory.isActive,
                    productCount: subCategory.productCount || 0,
                    mainImageUrl: subCategory.imageUrl || null,
                    content: (subCategory as any).content || null,
                }));

                const totalProducts = category.productCount || 0;

                return {
                    category: {
                        _id: category._id.toString(),
                        name: category.name,
                        slug: category.slug,
                        level: category.level,
                        order: category.order,
                        isActive: category.isActive,
                        productCount: category.productCount || 0,
                        imageUrl: category.imageUrl,
                        content: (category as any).content,
                    },
                    subCategories: subCategoriesData,
                    totalSubCategories: subCategories.length,
                    totalProducts,
                };
            } else {
                // Level 2: 서브카테고리 조회
                const category = await this.categoryRepository.findBySlug(categorySlug);
                if (!category) {
                    throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${categorySlug}`);
                }

                const { products } = await this.productRepository.findByCategoryWithLevel(2, category.name, {});

                return {
                    category: {
                        _id: category._id.toString(),
                        name: category.name,
                        slug: category.slug,
                        level: category.level,
                        order: category.order,
                        isActive: category.isActive,
                        productCount: category.productCount || 0,
                    },
                    subCategories: [],
                    products: products.map((p) => ({
                        _id: p._id.toString(),
                        slug: p.slug,
                        productName: p.productName,
                        productTitle: p.productTitle,
                        mainImageUrl: p.mainImageUrl,
                        description: p.description,
                        orderInLevel2: p.orderInLevel2,
                        isActive: p.isActive,
                        viewCount: p.viewCount,
                    })),
                    totalSubCategories: 0,
                    totalProducts: products.length,
                };
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 1 카테고리 목록 조회 (메인 제품 설정)
     */
    async findLevel1Categories() {
        const methodName = 'findLevel1Categories';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] Level 1 카테고리 목록 조회`);
            }

            // Level 1 카테고리 조회 (catalogue 제외)
            const categories = await this.categoryRepository.findAll({ level: 1 });

            // catalogue 제외 및 데이터 정리
            const items = categories
                .filter((category: CategoryDocument) => category.slug !== 'catalogue')
                .map((category: CategoryDocument) => ({
                    _id: category._id.toString(),
                    name: category.name,
                    slug: category.slug,
                    level: category.level,
                    order: category.order,
                    isActive: category.isActive,
                    productCount: category.productCount || 0,
                    imageUrl: category.imageUrl,
                    content: (category as any).content,
                }));

            return {
                items,
                total: items.length,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 1 카테고리 순서 일괄 변경 (DND용)
     */
    async reorderLevel1Categories(items: { slug: string; order: number }[]) {
        const methodName = 'reorderLevel1Categories';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] Level 1 카테고리 순서 변경 - ${items.length}개`);
            }

            // CategoryRepository의 updateOrdersBatch 메서드 사용
            await this.categoryRepository.updateOrdersBatch(items);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 순서 변경 완료`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 상위 카테고리 + 서브카테고리 목록 조회
     */
    async findCategoryWithSubCategories(categorySlug: string) {
        const methodName = 'findCategoryWithSubCategories';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - categorySlug: ${categorySlug}`);
            }

            // 상위 카테고리 조회
            const category = await this.categoryRepository.findBySlug(categorySlug);
            if (!category) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${categorySlug}`);
            }

            // 서브카테고리 목록 조회 (order로 정렬)
            const subCategories = await this.categoryRepository.findByParentName(category.name);

            const subCategoriesData = subCategories.map((subCategory) => ({
                _id: subCategory._id.toString(),
                name: subCategory.name,
                slug: subCategory.slug,
                order: subCategory.order,
                isActive: subCategory.isActive,
                productCount: subCategory.productCount || 0,
                imageUrl: subCategory.imageUrl || null,
                content: (subCategory as any).content || null,
            }));

            return {
                category: {
                    _id: category._id.toString(),
                    name: category.name,
                    slug: category.slug,
                    level: category.level,
                    order: category.order,
                    isActive: category.isActive,
                    productCount: category.productCount || 0,
                    imageUrl: category.imageUrl,
                    content: (category as any).content,
                },
                subCategories: subCategoriesData,
                totalSubCategories: subCategories.length,
                totalProducts: category.productCount || 0,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 서브카테고리 + 제품 목록 조회 (페이지네이션)
     */
    async findSubCategoryWithProducts(subCategorySlug: string, pagination: { page: number; limit: number }) {
        const methodName = 'findSubCategoryWithProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 요청 - subCategorySlug: ${subCategorySlug}, page: ${pagination.page}, limit: ${pagination.limit}`,
                );
            }

            // 서브카테고리 조회
            const subCategory = await this.categoryRepository.findBySlug(subCategorySlug);
            if (!subCategory) {
                throw new NotFoundException(`서브카테고리를 찾을 수 없습니다: ${subCategorySlug}`);
            }

            // 페이지네이션 계산
            const skip = (pagination.page - 1) * pagination.limit;

            // WORK GRIPPER 특수 케이스 처리
            // - DB 카테고리: name="WORK GRIPPER", parentName="WORK GRIPPER"
            // - DB 제품: category.mainCategory="WORK GRIPPER", category.subCategory="Gripper"
            const isWorkGripper = subCategory.parentName === 'WORK GRIPPER' && subCategory.name === 'WORK GRIPPER';

            let products: ProductDocument[];
            let total: number;

            if (isWorkGripper) {
                // WORK GRIPPER: mainCategory로 조회 (제품의 subCategory가 "Gripper"이므로 매칭 안됨)
                const result = await this.productRepository.findByCategoryWithLevel(1, 'WORK GRIPPER', {
                    limit: pagination.limit,
                    skip,
                });
                products = result.products;
                total = result.total;
            } else {
                // 일반 케이스: subCategory 이름으로 조회
                const result = await this.productRepository.findByCategoryWithLevel(2, subCategory.name, {
                    limit: pagination.limit,
                    skip,
                });
                products = result.products;
                total = result.total;
            }

            // 총 페이지 수 계산
            const totalPages = Math.ceil(total / pagination.limit);

            return {
                subCategory: {
                    _id: subCategory._id.toString(),
                    name: subCategory.name,
                    slug: subCategory.slug,
                    parentName: subCategory.parentName,
                    level: subCategory.level,
                    order: subCategory.order,
                    isActive: subCategory.isActive,
                    productCount: subCategory.productCount || 0,
                },
                items: products.map((p) => ({
                    _id: p._id.toString(),
                    slug: p.slug,
                    productName: p.productName,
                    productTitle: p.productTitle,
                    category: p.category,
                    mainImageUrl: p.mainImageUrl,
                    description: p.description,
                    content: p.content,
                    orderInLevel2: p.orderInLevel2,
                    isActive: p.isActive,
                    viewCount: p.viewCount,
                })),
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages,
                },
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 1 카테고리 정보 수정
     */
    async updateLevel1Category(
        slug: string,
        updateData: {
            name?: string;
            content?: string;
            imageUrl?: string;
            isActive?: boolean;
        },
    ) {
        const methodName = 'updateLevel1Category';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 카테고리 수정 - slug: ${slug}`);
            }

            // 카테고리 수정
            const updatedCategory = await this.categoryRepository.updateBySlug(slug, updateData);

            if (!updatedCategory) {
                throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${slug}`);
            }

            return {
                _id: updatedCategory._id.toString(),
                name: updatedCategory.name,
                slug: updatedCategory.slug,
                level: updatedCategory.level,
                order: updatedCategory.order,
                isActive: updatedCategory.isActive,
                productCount: updatedCategory.productCount || 0,
                imageUrl: updatedCategory.imageUrl,
                content: (updatedCategory as any).content,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 2 서브카테고리 순서 일괄 변경 (DND용)
     */
    async reorderSubCategories(items: { slug: string; order: number }[]) {
        const methodName = 'reorderSubCategories';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 서브카테고리 순서 변경 - ${items.length}개`);
            }

            // CategoryRepository의 updateOrdersBatch 메서드 사용
            await this.categoryRepository.updateOrdersBatch(items);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 순서 변경 완료`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 3 제품 순서 일괄 변경 (DND용)
     */
    async reorderProducts(subCategorySlug: string, items: { slug: string; order: number }[]) {
        const methodName = 'reorderProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 제품 순서 변경 - subCategorySlug: ${subCategorySlug}, ${items.length}개`,
                );
            }

            // 서브카테고리 존재 확인
            const subCategory = await this.categoryRepository.findBySlug(subCategorySlug);
            if (!subCategory) {
                throw new NotFoundException(`서브카테고리를 찾을 수 없습니다: ${subCategorySlug}`);
            }

            // 모든 제품이 존재하고 해당 서브카테고리에 속하는지 확인
            for (const item of items) {
                const product = await this.productRepository.findBySlug(item.slug);
                if (!product) {
                    throw new BadRequestException(`제품을 찾을 수 없습니다: ${item.slug}`);
                }

                // 제품이 해당 서브카테고리에 속하는지 확인 (카테고리 이름으로 비교)
                if (product.category.subCategory !== subCategory.name) {
                    throw new BadRequestException(
                        `제품 '${item.slug}'이(가) 서브카테고리 '${subCategory.name}'에 속하지 않습니다`,
                    );
                }

                // order 유효성 검사
                if (item.order < 0) {
                    throw new BadRequestException(`제품 '${item.slug}'의 order는 0 이상이어야 합니다`);
                }
            }

            // Level 2 제품 순서 일괄 업데이트
            await this.productRepository.updateOrdersBatch(2, items);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 순서 변경 완료 - ${items.length}개 제품`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 2 서브카테고리 정보 수정
     */
    async updateLevel2Category(
        slug: string,
        updateData: {
            name?: string;
            content?: string;
            imageUrl?: string;
            isActive?: boolean;
        },
    ) {
        const methodName = 'updateLevel2Category';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 서브카테고리 수정 - slug: ${slug}`);
            }

            // 서브카테고리 수정
            const updatedCategory = await this.categoryRepository.updateBySlug(slug, updateData);

            if (!updatedCategory) {
                throw new NotFoundException(`서브카테고리를 찾을 수 없습니다: ${slug}`);
            }

            return {
                _id: updatedCategory._id.toString(),
                name: updatedCategory.name,
                slug: updatedCategory.slug,
                parentName: updatedCategory.parentName,
                level: updatedCategory.level,
                order: updatedCategory.order,
                isActive: updatedCategory.isActive,
                productCount: updatedCategory.productCount || 0,
                imageUrl: updatedCategory.imageUrl,
                content: (updatedCategory as any).content,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Level 3 제품 정보 수정
     */
    async updateLevel3Product(
        slug: string,
        updateData: {
            productTitle?: string;
            productName?: string;
            mainImageUrl?: string;
            imageUrls?: string[];
            description?: string;
            content?: string;
            contentDetail?: string;
            isActive?: boolean;
            downloads?: any[];
            pdfUrl?: string;
            youtubeUrl?: string[];
        },
    ) {
        const methodName = 'updateLevel3Product';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 제품 수정 - slug: ${slug}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new NotFoundException(`제품을 찾을 수 없습니다: ${slug}`);
            }

            // 제품 수정
            const updatedProduct = await this.productRepository.update(slug, updateData);

            if (!updatedProduct) {
                throw new BadRequestException('제품 수정에 실패했습니다');
            }

            return {
                _id: updatedProduct._id.toString(),
                slug: updatedProduct.slug,
                productName: updatedProduct.productName,
                productTitle: updatedProduct.productTitle,
                mainImageUrl: updatedProduct.mainImageUrl,
                description: updatedProduct.description,
                content: updatedProduct.content,
                contentDetail: updatedProduct.contentDetail,
                isActive: updatedProduct.isActive,
                orderInLevel2: updatedProduct.orderInLevel2,
                viewCount: updatedProduct.viewCount,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 단일 제품 상세 조회 (slug 기반)
     */
    async getProductBySlug(slug: string) {
        const methodName = 'getProductBySlug';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 제품 조회 - slug: ${slug}`);
            }

            // 제품 조회
            const product = await this.productRepository.findBySlug(slug);
            if (!product) {
                throw new NotFoundException(`제품을 찾을 수 없습니다: ${slug}`);
            }

            // 제품 상세 정보 반환
            return {
                _id: product._id.toString(),
                slug: product.slug,
                productName: product.productName,
                productTitle: product.productTitle,
                category: product.category,
                sourceUrl: product.sourceUrl,
                mainImageUrl: product.mainImageUrl,
                imageUrls: product.imageUrls,
                content: product.content,
                contentDetail: product.contentDetail,
                description: product.description,
                specificationHtml: product.specificationHtml,
                downloads: product.downloads,
                specificationFiles: product.specificationFiles,
                additionalInfo: product.additionalInfo,
                tags: product.tags,
                isActive: product.isActive,
                isFeatured: product.isFeatured,
                viewCount: product.viewCount,
                order: product.order,
                orderInLevel1: product.orderInLevel1,
                orderInLevel2: product.orderInLevel2,
                pdfUrl: product.pdfUrl,
                youtubeUrl: product.youtubeUrl,
            };
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw error;
        }
    }
}
