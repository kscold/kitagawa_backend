import { Injectable, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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
            throw new InternalServerErrorException('제품 목록 조회 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 코드로 조회 (관리자용 - 비활성화 제품 포함)
     */
    async findByCode(productCode: string): Promise<ProductDocument> {
        const methodName = 'findByCode';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}`);
            }

            const product = await this.productRepository.findByCode(productCode);

            if (!product) {
                throw new NotFoundException(`제품을 찾을 수 없습니다 (productCode: ${productCode})`);
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
     * 제품 생성
     */
    async create(productData: any): Promise<ProductDocument> {
        const methodName = 'create';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productData.productCode}`);
            }

            // 중복 체크
            const existingProduct = await this.productRepository.findByCode(productData.productCode);
            if (existingProduct) {
                throw new BadRequestException(`제품 코드 '${productData.productCode}'는 이미 존재합니다`);
            }

            // 제품 생성
            const newProduct = await this.productRepository.create({
                ...productData,
                isActive: productData.isActive ?? true, // 기본값: 활성화
                isFeatured: productData.isFeatured ?? false, // 기본값: 추천 아님
                priority: productData.priority ?? 0, // 기본값: 0
                viewCount: 0, // 조회수 초기화
                metadata: {
                    lastCrawled: new Date(),
                    crawlSource: 'admin',
                    version: '1.0',
                },
            });

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - productCode: ${newProduct.productCode}`);
            }

            return newProduct;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 생성 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 수정
     */
    async update(productCode: string, productData: any): Promise<ProductDocument> {
        const methodName = 'update';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findByCode(productCode);
            if (!product) {
                throw new NotFoundException(`제품 코드 '${productCode}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // productCode는 수정 불가능하므로 제거
            delete productData.productCode;

            // 메타데이터 업데이트
            const updatedMetadata = {
                ...product.metadata,
                lastCrawled: new Date(),
                crawlSource: 'admin-update',
            };

            // 제품 수정
            const updatedProduct = await this.productRepository.update(productCode, {
                ...productData,
                metadata: updatedMetadata,
            });

            if (!updatedProduct) {
                throw new InternalServerErrorException('제품 수정에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - productCode: ${productCode}`);
            }

            return updatedProduct;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 수정 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 삭제
     */
    async delete(productCode: string): Promise<void> {
        const methodName = 'delete';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findByCode(productCode);
            if (!product) {
                throw new NotFoundException(`제품 코드 '${productCode}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 제품 삭제 (Hard Delete)
            const deleted = await this.productRepository.delete(productCode);
            if (!deleted) {
                throw new InternalServerErrorException('제품 삭제에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - productCode: ${productCode}`);
            }
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 삭제 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 비활성화
     */
    async deactivate(productCode: string): Promise<ProductDocument> {
        const methodName = 'deactivate';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findByCode(productCode);
            if (!product) {
                throw new NotFoundException(`제품 코드 '${productCode}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 이미 비활성화 상태인 경우
            if (!product.isActive) {
                throw new BadRequestException('이미 비활성화된 제품입니다');
            }

            // 제품 비활성화
            const updatedProduct = await this.productRepository.toggleActive(productCode, false);
            if (!updatedProduct) {
                throw new InternalServerErrorException('제품 비활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - productCode: ${productCode}`);
            }

            return updatedProduct;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 비활성화 중 오류가 발생했습니다');
        }
    }

    /**
     * 제품 활성화
     */
    async activate(productCode: string): Promise<ProductDocument> {
        const methodName = 'activate';

        try {
            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 요청 - productCode: ${productCode}`);
            }

            // 제품 존재 확인
            const product = await this.productRepository.findByCode(productCode);
            if (!product) {
                throw new NotFoundException(`제품 코드 '${productCode}'에 해당하는 제품을 찾을 수 없습니다`);
            }

            // 이미 활성화 상태인 경우
            if (product.isActive) {
                throw new BadRequestException('이미 활성화된 제품입니다');
            }

            // 제품 활성화
            const updatedProduct = await this.productRepository.toggleActive(productCode, true);
            if (!updatedProduct) {
                throw new InternalServerErrorException('제품 활성화에 실패했습니다');
            }

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 성공 - productCode: ${productCode}`);
            }

            return updatedProduct;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('제품 활성화 중 오류가 발생했습니다');
        }
    }
}
