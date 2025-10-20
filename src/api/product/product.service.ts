import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProductDocument } from '../../schemas/product.schema';
import { ProductRepository } from './repository/product.repository';

/**
 * Product Service
 * 비즈니스 로직, 에러 핸들링, 로깅 담당
 */
@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);
    private readonly isDevelopment: boolean;

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly configService: ConfigService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    }

    /**
     * 모든 제품 조회 (필터, 페이지네이션 포함)
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

            const result = await this.productRepository.findAllWithPagination(filters);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${result.total}, count: ${result.products.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 목록 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 추천 제품 조회
     */
    async getFeaturedProducts(limit: number = 8): Promise<ProductDocument[]> {
        const methodName = 'getFeaturedProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - limit: ${limit}`);
            }

            const products = await this.productRepository.findFeatured(limit);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${products.length}`);
            }

            return products;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('추천 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 인기 제품 조회 (조회수 기준)
     */
    async getPopularProducts(limit: number = 8): Promise<ProductDocument[]> {
        const methodName = 'getPopularProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - limit: ${limit}`);
            }

            const products = await this.productRepository.findPopular(limit);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${products.length}`);
            }

            return products;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('인기 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 최신 제품 조회
     */
    async getRecentProducts(limit: number = 8): Promise<ProductDocument[]> {
        const methodName = 'getRecentProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - limit: ${limit}`);
            }

            const products = await this.productRepository.findRecent(limit);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${products.length}`);
            }

            return products;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('최신 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리 목록 조회
     */
    async getCategories(): Promise<any[]> {
        const methodName = 'getCategories';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청`);
            }

            const categories = await this.productRepository.findCategories();

            const result = categories.map((cat: any) => ({
                mainCategory: cat._id,
                totalCount: cat.totalCount,
                subCategories: cat.subCategories,
            }));

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${result.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 코드로 조회 (조회수 증가)
     */
    async findByCode(productCode: string, incrementView: boolean = true): Promise<ProductDocument> {
        const methodName = 'findByCode';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}, incrementView: ${incrementView}`);
            }

            const product = await this.productRepository.findByCode(productCode);

            if (!product) {
                throw new NotFoundException(`제품 코드 '${productCode}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 조회수 증가
            if (incrementView) {
                await this.productRepository.incrementViewCount(productCode);
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - productCode: ${productCode}`);
            }

            return product;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 ID로 조회
     */
    async findById(id: string): Promise<ProductDocument> {
        const methodName = 'findById';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - id: ${id}`);
            }

            const product = await this.productRepository.findById(id);

            if (!product) {
                throw new NotFoundException(`ID '${id}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - id: ${id}`);
            }

            return product;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 슬러그로 제품 조회 (단일 제품 상세 조회용) - 주 메서드
     */
    async findBySlug(slug: string, incrementView = true): Promise<ProductDocument> {
        const methodName = 'findBySlug';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - slug: ${slug}`);
            }

            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new NotFoundException(`슬러그 '${slug}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 조회수 증가
            if (incrementView) {
                await this.productRepository.incrementViewCount(slug);
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - slug: ${slug}`);
            }

            return product;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 카테고리별 제품 조회
     */
    async findByCategory(mainCategory: string, subCategory?: string): Promise<ProductDocument[]> {
        const methodName = 'findByCategory';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - mainCategory: ${mainCategory}, subCategory: ${subCategory}`);
            }

            const products = await this.productRepository.findByCategory(mainCategory, subCategory);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${products.length}`);
            }

            return products;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('카테고리별 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 고급 검색
     */
    async advancedSearch(params: {
        keyword?: string;
        category?: string;
        subCategory?: string;
        tags?: string[];
        sort?: string;
        limit?: number;
        skip?: number;
    }): Promise<{ products: ProductDocument[]; total: number }> {
        const methodName = 'advancedSearch';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - params: ${JSON.stringify(params)}`);
            }

            const result = await this.productRepository.advancedSearch(params);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${result.total}, count: ${result.products.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 검색 중 오류가 발생했습니다');
        }
    }

    /**
     * 매칭 제품 조회
     * TODO: 매칭 로직 구현 필요
     */
    async findMatchingProducts(productCode: string): Promise<ProductDocument[]> {
        const methodName = 'findMatchingProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}`);
            }

            // 제품 존재 여부 확인
            await this.findByCode(productCode, false);

            // TODO: 실제 매칭 로직 구현
            // 현재는 빈 배열 반환
            const matchingProducts: ProductDocument[] = [];

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${matchingProducts.length}`);
            }

            return matchingProducts;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('매칭 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 다운로드 링크 조회
     */
    async getDownloads(productCode: string, model?: string): Promise<any[]> {
        const methodName = 'getDownloads';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}, model: ${model}`);
            }

            const product = await this.findByCode(productCode, false);

            let downloads = product.downloads || [];

            // 모델 필터 적용
            if (model) {
                downloads = downloads.filter((download) => download.model === model || download.model === 'All');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - count: ${downloads.length}`);
            }

            return downloads;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('다운로드 링크 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 시리즈별 제품 조회
     */
    async findBySeries(
        seriesSlug: string,
        filters?: { limit?: number; skip?: number },
    ): Promise<{ products: ProductDocument[]; total: number }> {
        const methodName = 'findBySeries';

        try {
            // slug를 series 이름으로 변환 (예: "mr-series" -> "MR series")
            const seriesName = seriesSlug
                .split('-')
                .map((word, index) => {
                    // 첫 번째 단어는 대문자로
                    if (index === 0) {
                        return word.toUpperCase();
                    }
                    // "series"는 소문자 유지
                    if (word.toLowerCase() === 'series') {
                        return 'series';
                    }
                    // 숫자는 그대로
                    if (/^\d+$/.test(word)) {
                        return word;
                    }
                    // 나머지는 대문자로
                    return word.toUpperCase();
                })
                .join(' ');

            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 요청 - seriesSlug: ${seriesSlug}, seriesName: ${seriesName}, filters: ${JSON.stringify(filters)}`,
                );
            }

            const result = await this.productRepository.findAllWithPagination({
                series: seriesName,
                ...filters,
            });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - total: ${result.total}, count: ${result.products.length}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('시리즈별 제품 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 검색 (영어, 한글, 자음 지원)
     */
    async searchProducts(
        keyword: string,
        filters?: {
            category?: string;
            subCategory?: string;
            limit?: number;
            skip?: number;
        },
    ): Promise<{ products: ProductDocument[]; total: number }> {
        const methodName = 'searchProducts';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - keyword: ${keyword}, filters: ${JSON.stringify(filters)}`);
            }

            // 키워드 유효성 검증
            if (!keyword || keyword.trim().length === 0) {
                throw new InternalServerErrorException('검색 키워드는 필수입니다');
            }

            const result = await this.productRepository.searchProducts({
                keyword: keyword.trim(),
                category: filters?.category,
                subCategory: filters?.subCategory,
                limit: filters?.limit,
                skip: filters?.skip,
            });

            if (this.isDevelopment) {
                this.logger.log(
                    `[${methodName}] 성공 - keyword: ${keyword}, total: ${result.total}, count: ${result.products.length}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 검색 중 오류가 발생했습니다');
        }
    }
}
