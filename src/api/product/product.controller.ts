import { Controller, Get, Param, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

import { ProductService } from './product.service';

/**
 * 제품 Public API
 * 인증 없이 접근 가능한 조회 API만 제공
 */
@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    /**
     * 홈 - 추천 제품 조회
     */
    @Get('featured')
    @ApiOperation({
        summary: '추천 제품 조회',
        description: '홈 화면에 표시할 추천 제품을 조회합니다 (인증 불필요)',
    })
    @ApiQuery({ name: 'limit', required: false, description: '조회할 제품 수 (기본: 8)' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getFeaturedProducts(@Query('limit') limit?: string) {
        const products = await this.productService.getFeaturedProducts(parseInt(limit) || 8);

        return {
            success: true,
            count: products.length,
            data: products,
        };
    }

    /**
     * 홈 - 인기 제품 조회
     */
    @Get('popular')
    @ApiOperation({
        summary: '인기 제품 조회 (조회수 기준)',
        description: '조회수가 높은 인기 제품을 조회합니다 (인증 불필요)',
    })
    @ApiQuery({ name: 'limit', required: false, description: '조회할 제품 수 (기본: 8)' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getPopularProducts(@Query('limit') limit?: string) {
        const products = await this.productService.getPopularProducts(parseInt(limit) || 8);

        return {
            success: true,
            count: products.length,
            data: products,
        };
    }

    /**
     * 홈 - 최신 제품 조회
     */
    @Get('recent')
    @ApiOperation({
        summary: '최신 제품 조회',
        description: '최근 등록된 제품을 조회합니다 (인증 불필요)',
    })
    @ApiQuery({ name: 'limit', required: false, description: '조회할 제품 수 (기본: 8)' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getRecentProducts(@Query('limit') limit?: string) {
        const products = await this.productService.getRecentProducts(parseInt(limit) || 8);

        return {
            success: true,
            count: products.length,
            data: products,
        };
    }

    /**
     * 카테고리 목록 조회
     */
    @Get('categories')
    @ApiOperation({
        summary: '카테고리 목록 조회',
        description: '모든 카테고리 목록을 조회합니다 (인증 불필요)',
    })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getCategories() {
        const categories = await this.productService.getCategories();

        return {
            success: true,
            count: categories.length,
            data: categories,
        };
    }

    /**
     * 모든 제품 조회
     */
    @Get()
    @ApiOperation({
        summary: '제품 목록 조회',
        description: '필터 조건에 따라 제품 목록을 조회합니다 (인증 불필요)',
    })
    @ApiQuery({ name: 'category', required: false, description: '카테고리 필터' })
    @ApiQuery({ name: 'subCategory', required: false, description: '서브 카테고리 필터' })
    @ApiQuery({ name: 'tag', required: false, description: '태그 필터' })
    @ApiQuery({ name: 'isActive', required: false, description: '활성화 상태 필터' })
    @ApiQuery({ name: 'limit', required: false, description: '조회할 제품 수 (기본: 20)' })
    @ApiQuery({ name: 'skip', required: false, description: '건너뛸 제품 수 (페이징)' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async findAll(
        @Query('category') category?: string,
        @Query('subCategory') subCategory?: string,
        @Query('tag') tag?: string,
        @Query('isActive') isActive?: string,
        @Query('limit') limit?: string,
        @Query('skip') skip?: string,
    ) {
        const filters: any = {};

        if (category) filters.category = category;
        if (subCategory) filters.subCategory = subCategory;
        if (tag) filters.tag = tag;
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        const limitNum = limit ? parseInt(limit) : 20;
        const skipNum = skip ? parseInt(skip) : 0;
        filters.limit = limitNum;
        filters.skip = skipNum;

        const { products, total } = await this.productService.findAll(filters);

        return {
            success: true,
            count: products.length,
            total,
            page: Math.floor(skipNum / limitNum) + 1,
            totalPages: Math.ceil(total / limitNum),
            data: products,
        };
    }

    /**
     * 제품 검색 (고급)
     */
    @Get('search')
    @ApiOperation({
        summary: '제품 검색',
        description: '키워드, 카테고리, 태그 등으로 제품을 검색합니다 (인증 불필요)',
    })
    @ApiQuery({ name: 'q', required: false, description: '검색 키워드' })
    @ApiQuery({ name: 'category', required: false, description: '카테고리 필터' })
    @ApiQuery({ name: 'subCategory', required: false, description: '서브 카테고리 필터' })
    @ApiQuery({ name: 'tags', required: false, description: '태그 필터 (콤마로 구분)' })
    @ApiQuery({ name: 'sort', required: false, description: '정렬 (recent, popular, name)' })
    @ApiQuery({ name: 'limit', required: false, description: '조회할 제품 수 (기본: 20)' })
    @ApiQuery({ name: 'skip', required: false, description: '건너뛸 제품 수 (페이징)' })
    @ApiResponse({ status: HttpStatus.OK, description: '검색 성공' })
    async search(
        @Query('q') keyword?: string,
        @Query('category') category?: string,
        @Query('subCategory') subCategory?: string,
        @Query('tags') tags?: string,
        @Query('sort') sort?: string,
        @Query('limit') limit?: string,
        @Query('skip') skip?: string,
    ) {
        const limitNum = limit ? parseInt(limit) : 20;
        const skipNum = skip ? parseInt(skip) : 0;

        const { products, total } = await this.productService.advancedSearch({
            keyword,
            category,
            subCategory,
            tags: tags?.split(','),
            sort,
            limit: limitNum,
            skip: skipNum,
        });

        return {
            success: true,
            count: products.length,
            total,
            page: Math.floor(skipNum / limitNum) + 1,
            totalPages: Math.ceil(total / limitNum),
            data: products,
        };
    }

    /**
     * 제품 코드로 조회
     */
    @Get('code/:productCode')
    @ApiOperation({
        summary: '제품 코드로 조회',
        description: '제품 코드로 특정 제품을 조회합니다 (인증 불필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async findByCode(@Param('productCode') productCode: string) {
        const product = await this.productService.findByCode(productCode);

        return {
            success: true,
            data: product,
        };
    }

    /**
     * 제품 ID로 조회
     */
    @Get(':id')
    @ApiOperation({
        summary: '제품 ID로 조회',
        description: '제품 ID로 특정 제품을 조회합니다 (인증 불필요)',
    })
    @ApiParam({ name: 'id', description: '제품 ID' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async findById(@Param('id') id: string) {
        const product = await this.productService.findById(id);

        return {
            success: true,
            data: product,
        };
    }

    /**
     * 카테고리별 제품 조회
     */
    @Get('category/:mainCategory')
    @ApiOperation({
        summary: '카테고리별 제품 조회',
        description: '메인 카테고리와 서브 카테고리로 제품을 조회합니다 (인증 불필요)',
    })
    @ApiParam({ name: 'mainCategory', description: '메인 카테고리' })
    @ApiQuery({ name: 'subCategory', required: false, description: '서브 카테고리' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async findByCategory(@Param('mainCategory') mainCategory: string, @Query('subCategory') subCategory?: string) {
        const products = await this.productService.findByCategory(mainCategory, subCategory);

        return {
            success: true,
            count: products.length,
            data: products,
        };
    }

    /**
     * 매칭 제품 조회
     */
    @Get(':productCode/matching')
    @ApiOperation({
        summary: '매칭 제품 조회',
        description: '특정 제품과 매칭되는 제품들을 조회합니다 (인증 불필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getMatchingProducts(@Param('productCode') productCode: string) {
        const matchingProducts = await this.productService.findMatchingProducts(productCode);

        return {
            success: true,
            count: matchingProducts.length,
            data: matchingProducts,
        };
    }

    /**
     * 다운로드 링크 조회
     */
    @Get(':productCode/downloads')
    @ApiOperation({
        summary: '다운로드 링크 조회',
        description: '제품의 다운로드 가능한 파일 링크들을 조회합니다 (인증 불필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiQuery({ name: 'model', required: false, description: '모델명 필터' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getDownloads(@Param('productCode') productCode: string, @Query('model') model?: string) {
        const downloads = await this.productService.getDownloads(productCode, model);

        return {
            success: true,
            count: downloads.length,
            data: downloads,
        };
    }
}
