import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { AdminJwtAuthGuard } from '../../common/guard/admin-jwt-auth.guard';

@ApiTags('Crawler - Admin')
@Controller('crawler-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class CrawlerController {
    constructor(private readonly crawlerService: CrawlerService) {}

    /**
     * 모든 카테고리 크롤링
     */
    @Post('crawl-all')
    @ApiOperation({ summary: '모든 카테고리와 제품 크롤링 (관리자용)' })
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
                // 서버 부하 방지
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            // 카테고리 간 딜레이
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        return {
            success: true,
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
    @ApiOperation({ summary: '특정 제품 URL 크롤링 (관리자용)' })
    @ApiBody({ schema: { properties: { url: { type: 'string' } } } })
    async crawlUrl(@Body('url') url: string) {
        const product = await this.crawlerService.crawlProductPage(url);
        return {
            success: true,
            message: 'Crawling completed',
            data: product,
        };
    }

    /**
     * BR/BR-PLUS Series 크롤링
     */
    @Post('crawl/br-plus-series')
    @ApiOperation({ summary: 'BR-PLUS Series 제품 크롤링 (관리자용)' })
    async crawlBRPlusSeries() {
        await this.crawlerService.crawlBRPlusSeries();
        return {
            success: true,
            message: 'BR-PLUS Series crawling completed',
        };
    }

    /**
     * 특정 URL 크롤링 (단일 제품)
     */
    @Post('crawl/url')
    @ApiOperation({ summary: '특정 URL 크롤링 (관리자용)' })
    @ApiBody({
        schema: {
            properties: {
                url: { type: 'string', example: 'https://www.kitagawa.com/en/mtools/chuck/br_series.html' },
            },
        },
    })
    async crawlByUrl(@Body('url') url: string) {
        const product = await this.crawlerService.crawlProductPage(url);
        return {
            success: true,
            message: product ? 'Product crawled successfully' : 'Failed to crawl product',
            data: product,
        };
    }
}
