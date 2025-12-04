import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../common/guard/admin-jwt-auth.guard';

import { CrawlerService } from './crawler.service';

import { SwaggerResponse } from '../../common/decorator/swagger-response.decorator';

@ApiTags('크롤러 관리자')
@Controller('crawler-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class CrawlerController {
    constructor(private readonly crawlerService: CrawlerService) {}

    /**
     * 모든 카테고리 크롤링
     */
    @Post('crawl-all')
    @ApiOperation({
        summary: '모든 카테고리와 제품 크롤링 (관리자용)',
        description: '키타가와 웹사이트의 모든 카테고리와 제품을 크롤링합니다.',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '크롤링 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: 'Successfully crawled 10 categories, saved 150 products',
                data: {
                    categories: 10,
                    products: 150,
                },
            },
        },
    })
    async crawlAll() {
        // 1단계: 메인 페이지에서 모든 카테고리 추출
        const categories = await this.crawlerService.crawlAllCategories();

        let totalProducts = 0;
        const savedProducts = [];

        // 2단계: 각 카테고리 페이지에서 제품 목록 추출
        for (const category of categories) {
            const products = await this.crawlerService.crawlProductsFromCategory(category.url, category.mainCategory);

            // 3단계: 각 제품 상세 페이지 크롤링
            for (const productInfo of products) {
                const product = await this.crawlerService.crawlProductPage(productInfo.url);
                if (product) {
                    savedProducts.push(product);
                    totalProducts++;
                }
                // 서버 부하 방지 - 제품 간 딜레이 2초
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            // 카테고리 간 딜레이 5초 (타임아웃 방지)
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        return {
            success: true,
            code: HttpStatus.OK,
            message: `Successfully crawled ${categories.length} categories, saved ${totalProducts} products`,
            data: {
                categories: categories.length,
                products: totalProducts,
            },
        };
    }

    /**
     * 특정 URL 크롤링
     */
    @Post('crawl')
    @ApiOperation({
        summary: '특정 제품 URL 크롤링 (관리자용)',
        description: '특정 제품 페이지 URL을 크롤링하여 데이터를 수집합니다.',
    })
    @ApiBody({
        schema: {
            properties: {
                url: {
                    type: 'string',
                    example: 'https://www.kitagawa.com/en/mtools/chuck/br_series.html',
                    description: '크롤링할 제품 페이지 URL',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '크롤링 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: 'Crawling completed',
                data: {
                    name: 'BR Series Chuck',
                    category: 'Chuck',
                    url: 'https://www.kitagawa.com/en/mtools/chuck/br_series.html',
                },
            },
        },
    })
    async crawlUrl(@Body('url') url: string) {
        const product = await this.crawlerService.crawlProductPage(url);
        return {
            success: true,
            code: HttpStatus.OK,
            message: 'Crawling completed',
            data: product,
        };
    }

    /**
     * BR/BR-PLUS Series 크롤링
     */
    @Post('crawl/br-plus-series')
    @ApiOperation({
        summary: 'BR-PLUS Series 제품 크롤링 (관리자용)',
        description: 'BR-PLUS 시리즈 제품들을 크롤링합니다.',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '크롤링 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: 'BR-PLUS Series crawling completed',
            },
        },
    })
    async crawlBRPlusSeries() {
        await this.crawlerService.crawlBRPlusSeries();
        return {
            success: true,
            code: HttpStatus.OK,
            message: 'BR-PLUS Series crawling completed',
        };
    }

    /**
     * 특정 URL 크롤링 (단일 제품)
     */
    @Post('crawl/url')
    @ApiOperation({
        summary: '특정 URL 크롤링 (관리자용)',
        description: '특정 URL의 제품 정보를 크롤링합니다.',
    })
    @ApiBody({
        schema: {
            properties: {
                url: {
                    type: 'string',
                    example: 'https://www.kitagawa.com/en/mtools/chuck/br_series.html',
                    description: '크롤링할 URL',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '크롤링 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: 'Product crawled successfully',
                data: {
                    name: 'BR Series Chuck',
                    category: 'Chuck',
                    url: 'https://www.kitagawa.com/en/mtools/chuck/br_series.html',
                },
            },
        },
    })
    async crawlByUrl(@Body('url') url: string) {
        const product = await this.crawlerService.crawlProductPage(url);
        return {
            success: true,
            code: HttpStatus.OK,
            message: product ? 'Product crawled successfully' : 'Failed to crawl product',
            data: product,
        };
    }
}
