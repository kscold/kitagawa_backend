import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cheerio from 'cheerio';
import axios from 'axios';

import { Product, ProductDocument } from '../../schemas/product.schema';

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);
    private readonly baseUrl = 'https://www.kitagawa.com';

    constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

    /**
     * 메인 페이지에서 모든 카테고리 링크 추출
     */
    async crawlAllCategories(): Promise<{ mainCategory: string; url: string }[]> {
        try {
            this.logger.log('Crawling all categories from main page');
            const response = await axios.get(`${this.baseUrl}/en/mtools/`);
            const $ = cheerio.load(response.data);

            const categories: { mainCategory: string; url: string }[] = [];

            // 실제 기타가와 사이트 구조: .productList li
            $('.productList li').each((_, element) => {
                const $link = $(element).find('a').first();
                const categoryName = $(element).find('h4, .ttl').text().trim();
                const categoryLink = $link.attr('href');

                if (categoryName && categoryLink) {
                    const fullUrl = categoryLink.startsWith('http') ? categoryLink : `${this.baseUrl}${categoryLink}`;

                    categories.push({
                        mainCategory: categoryName,
                        url: fullUrl,
                    });

                    this.logger.log(`Found category: ${categoryName} -> ${fullUrl}`);
                }
            });

            this.logger.log(`Total found ${categories.length} categories`);
            return categories;
        } catch (error) {
            this.logger.error(`Error crawling categories: ${error.message}`);
            throw error;
        }
    }

    /**
     * 카테고리 페이지에서 모든 제품 링크 추출
     */
    async crawlProductsFromCategory(
        categoryUrl: string,
        categoryName: string,
    ): Promise<{ productName: string; url: string; category: string }[]> {
        try {
            this.logger.log(`Crawling products from category: ${categoryName} (${categoryUrl})`);
            const response = await axios.get(categoryUrl);
            const $ = cheerio.load(response.data);

            const products: { productName: string; url: string; category: string }[] = [];

            // 카테고리 페이지의 제품 목록 크롤링
            $('.productList li').each((_, element) => {
                const $link = $(element).find('a').first();
                const productName = $(element).find('h4, .ttl, h3').text().trim();
                const productLink = $link.attr('href');

                if (productName && productLink && productLink.endsWith('.html')) {
                    // URL 정규화: 이미 http로 시작하면 그대로 사용, 아니면 baseUrl 추가
                    let fullUrl = productLink;
                    if (!productLink.startsWith('http')) {
                        // /로 시작하면 그대로, 아니면 / 추가
                        fullUrl = productLink.startsWith('/')
                            ? `${this.baseUrl}${productLink}`
                            : `${this.baseUrl}/${productLink}`;
                    }

                    products.push({
                        productName,
                        url: fullUrl,
                        category: categoryName,
                    });

                    this.logger.log(`  Found product: ${productName} -> ${fullUrl}`);
                }
            });

            this.logger.log(`  Total found ${products.length} products in ${categoryName}`);
            return products;
        } catch (error) {
            this.logger.error(`Error crawling products from category ${categoryUrl}: ${error.message}`);
            return [];
        }
    }

    /**
     * BR/BR-PLUS Series 직접 크롤링 (예제)
     */
    async crawlBRPlusSeries(): Promise<ProductDocument | null> {
        const url = `${this.baseUrl}/en/mtools/chuck/br_series.html`;
        this.logger.log(`Crawling BR Series: ${url}`);
        return await this.crawlProductPage(url);
    }

    /**
     * 개별 제품 페이지 크롤링
     */
    async crawlProductPage(url: string): Promise<ProductDocument | null> {
        try {
            this.logger.log(`Crawling product page: ${url}`);
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            // 제품 코드 추출
            const productCode = this.extractProductCode(url, $);

            // 제품명 추출
            const productName = $('h2, .prodname, #main h1').first().text().trim() || productCode;

            // 카테고리 추출
            const breadcrumbs = $('.breadcrumb, .topicPath');
            let mainCategory = 'Chucks';
            let subCategory = '';

            breadcrumbs.find('a, li').each((_, elem) => {
                const text = $(elem).text().trim();
                if (text && text !== 'Home' && text !== 'Machine Tool Products') {
                    if (!subCategory) subCategory = text;
                    else mainCategory = text;
                }
            });

            // **핵심: Product Specifications HTML 추출**
            const specHtml = $('#spec').html() || '';
            this.logger.log(`Extracted spec HTML length: ${specHtml.length} characters`);

            // 이미지 추출 (제품 이미지 + spec 섹션 이미지)
            const imageUrls: string[] = [];
            $('#main img, #spec img').each((_, img) => {
                const src = $(img).attr('src');
                if (src && !src.includes('spacer') && !src.includes('icon') && !src.includes('blank')) {
                    const fullSrc = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
                    if (!imageUrls.includes(fullSrc)) {
                        imageUrls.push(fullSrc);
                    }
                }
            });
            const mainImageUrl = imageUrls[0] || '';

            // 유튜브 링크 추출
            let youtubeUrl = '';
            $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, iframe) => {
                const src = $(iframe).attr('src');
                if (src) {
                    youtubeUrl = src;
                    this.logger.log(`Found YouTube video: ${youtubeUrl}`);
                }
            });

            // 제품 설명 추출
            const description = $('.lead, .description, #main p').first().text().trim();

            // 다운로드 링크 추출
            const downloads: any[] = [];
            $(
                '#spec a[href*="pdf"], #spec a[href*="PDF"], #spec a[href*="dxf"], #spec a[href*="DXF"], #spec a[href*="dwg"], #spec a[href*="DWG"], #spec a[href*="3D"]',
            ).each((_, link) => {
                const href = $(link).attr('href');
                const text = $(link).text().trim();

                if (href) {
                    const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    let type = 'PDF';
                    let category = '2D';

                    if (href.toLowerCase().includes('.dxf')) type = 'DXF';
                    if (href.toLowerCase().includes('.dwg')) type = 'DWG';
                    if (href.toLowerCase().includes('parasolid')) {
                        type = 'Parasolid';
                        category = '3D';
                    }
                    if (href.toLowerCase().includes('step')) {
                        type = 'STEP';
                        category = '3D';
                    }

                    downloads.push({
                        type,
                        category,
                        url: fullUrl,
                        model: text || 'All',
                    });
                }
            });

            // MongoDB에 저장할 데이터 구성
            const productData: Partial<Product> = {
                productCode,
                productName,
                category: {
                    mainCategory,
                    subCategory,
                    series: productName,
                },
                description,
                sourceUrl: url,
                imageUrls,
                mainImageUrl,
                youtubeUrl, // YouTube 영상 URL
                specificationHtml: specHtml, // **HTML 그대로 저장**
                downloads,
                tags: [mainCategory, subCategory, productName].filter(Boolean),
                isActive: true,
                metadata: {
                    lastCrawled: new Date(),
                    crawlSource: 'kitagawa.com',
                },
            };

            // MongoDB에 저장 (upsert)
            const product: any = (await this.productModel
                .findOneAndUpdate({ productCode }, productData, {
                    upsert: true,
                    new: true,
                })
                .exec()) as any;

            this.logger.log(`✅ Product saved: ${productCode}`);
            return product;
        } catch (error) {
            this.logger.error(`Error crawling product page ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * 제품 코드 추출
     */
    private extractProductCode(url: string, $: cheerio.CheerioAPI): string {
        // URL에서 추출 (예: /br_series.html -> br_series)
        const match = url.match(/\/([^\/]+)\.html$/);
        if (match) {
            return match[1];
        }

        // 또는 페이지 내에서 추출
        return $('meta[name="product-code"]').attr('content') || `product_${Date.now()}`;
    }

    /**
     * 딜레이 함수
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
