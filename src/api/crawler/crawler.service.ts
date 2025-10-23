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
            const slug = this.extractProductCode(url, $);

            // 제품명 추출
            const productName = $('h2, .prodname, #main h1').first().text().trim() || slug;

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

            // 다운로드 링크 추출 - 메인 카탈로그 PDF만 수집 (전체 페이지에서 검색)
            const downloads: any[] = [];
            let mainCatalogPdf = '';

            // 1. 먼저 "Download Catalogue pages" 링크 찾기 (주로 페이지 상단에 위치)
            $('a[href*="PDF"], a[href*="pdf"]').each((_, link) => {
                const href = $(link).attr('href');
                const text = $(link).text().trim().toLowerCase();

                if (href && text.includes('catalogue')) {
                    const fileName = href.split('/').pop() || '';
                    if (/^\d+_/.test(fileName) || fileName.toLowerCase().includes('series')) {
                        mainCatalogPdf = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        this.logger.log(`  Found main catalog PDF: ${fileName}`);
                        return false; // break loop
                    }
                }
            });

            // 2. 찾지 못했다면 #spec 섹션에서 메인 카탈로그 PDF 찾기
            if (!mainCatalogPdf) {
                $('#spec a[href*="pdf"], #spec a[href*="PDF"]').each((_, link) => {
                    const href = $(link).attr('href');

                    if (href) {
                        const fileName = href.split('/').pop() || '';
                        const isIndividualModelFile =
                            /^DHP-\w+\.pdf$/i.test(fileName) || /^\w{2,4}-\d+\.pdf$/i.test(fileName);
                        const isMainCatalog =
                            /^\d+_/.test(fileName) ||
                            fileName.toLowerCase().includes('series') ||
                            fileName.toLowerCase().includes('catalog');

                        if (isMainCatalog && !isIndividualModelFile && !mainCatalogPdf) {
                            mainCatalogPdf = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                            this.logger.log(`  Found catalog PDF in spec: ${fileName}`);
                        }
                    }
                });
            }

            // 메인 카탈로그 PDF를 downloads 배열에 추가
            if (mainCatalogPdf) {
                downloads.push({
                    type: 'PDF',
                    category: 'Catalog',
                    url: mainCatalogPdf,
                    model: 'All',
                });
            }

            // 이미지 추출 - 아이콘 이미지 제외, 실제 제품 이미지만 수집
            const imageUrls: string[] = [];

            // 제외할 아이콘/UI 이미지 패턴
            const iconPatterns = [
                'spacer',
                'icon',
                'blank',
                'dopdf.gif',
                'domigi.gif',
                'dohidari.gif',
                'dotif.gif',
                'dodxf.gif',
                'dodwg.gif',
                'picture_gif/do', // do로 시작하는 gif 아이콘들
                '/inc/product/images/entry/', // 엔트리 아이콘들
                '/inc/product/images/side/', // 사이드바 이미지들
                'meganav', // 메가 네비게이션 이미지들
                'sitelink', // 사이트 링크 이미지들
                'support.png',
                'faq.png',
                'network.png',
                'exhibition.png',
            ];

            // 먼저 실제 제품 이미지 찾기 (figure, fancybox 등)
            const productImages: string[] = [];
            $('figure img, .fancybox img, .product-image img, #main > img').each((_, img) => {
                const src = $(img).attr('src');
                if (src && !iconPatterns.some(pattern => src.includes(pattern))) {
                    const fullSrc = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
                    if (!productImages.includes(fullSrc)) {
                        productImages.push(fullSrc);
                    }
                }
            });

            // figure 태그의 링크에서도 이미지 추출
            $('figure a[href*=".jpg"], figure a[href*=".png"], .fancybox[href*=".jpg"], .fancybox[href*=".png"]').each((_, link) => {
                const href = $(link).attr('href');
                if (href && !iconPatterns.some(pattern => href.includes(pattern))) {
                    const fullHref = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    if (!productImages.includes(fullHref)) {
                        productImages.push(fullHref);
                    }
                }
            });

            // 제품 이미지가 있으면 그것을 사용, 없으면 일반 이미지에서 필터링
            if (productImages.length > 0) {
                imageUrls.push(...productImages);
            } else {
                // 일반 이미지 수집 (아이콘 제외)
                $('#main img').each((_, img) => {
                    const src = $(img).attr('src');
                    if (src && !iconPatterns.some(pattern => src.includes(pattern))) {
                        const fullSrc = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
                        if (!imageUrls.includes(fullSrc)) {
                            imageUrls.push(fullSrc);
                        }
                    }
                });
            }

            const mainImageUrl = imageUrls[0] || '';

            // 유튜브 링크 추출
            const youtubeUrl: string[] = [];
            $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, iframe) => {
                const src = $(iframe).attr('src');
                if (src) {
                    youtubeUrl.push(src);
                    this.logger.log(`Found YouTube video: ${src}`);
                }
            });

            // MongoDB에 저장할 데이터 구성
            const seriesName = this.extractSeriesName(productName, slug);
            const productData: Partial<Product> = {
                slug,
                productName,
                category: {
                    mainCategory,
                    subCategory,
                    series: seriesName,
                },
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
                .findOneAndUpdate({ slug }, productData, {
                    upsert: true,
                    new: true,
                })
                .exec()) as any;

            this.logger.log(`✅ Product saved: ${slug}`);
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
        // URL에서 추출 (예: /br_series.html -> br_series, /ck_r.html -> ck_r)
        const match = url.match(/\/([^\/]+)\.html$/);
        if (match) {
            return match[1];
        }

        // 또는 페이지 내에서 추출
        return $('meta[name="product-code"]').attr('content') || `product_${Date.now()}`;
    }

    /**
     * productName에서 series 이름 추출
     * 예: "High Precision Power ChuckBR series" -> "BR series"
     */
    private extractSeriesName(productName: string, slug: string): string {
        // 1. "Chuck", "table" 등의 단어 뒤에 나오는 시리즈 이름 추출
        // 예: "Power ChuckBR series" -> "BR series"
        const afterKeywordMatch = productName.match(/(?:chuck|table|vise|cylinder|gripper)([A-Z0-9][A-Z0-9\-\/\(\)]*)\s*series/i);
        if (afterKeywordMatch) {
            let extracted = afterKeywordMatch[1].trim();

            // "CK(R)" -> "CK / CKR"로 변환
            if (extracted.includes('(') && extracted.includes(')')) {
                const baseMatch = extracted.match(/^([A-Z]+)\(([A-Z]+)\)$/);
                if (baseMatch) {
                    extracted = `${baseMatch[1]} / ${baseMatch[1]}${baseMatch[2]}`;
                }
            }

            return `${extracted} series`;
        }

        // 2. 일반적인 "series" 키워드 매칭 (단어 경계 포함)
        // 예: "MR series", "BR series"
        const seriesMatch = productName.match(/\b([A-Z0-9][A-Z0-9\-\/\(\)]*(?:\s*\/\s*[A-Z0-9\-\/\(\)]+)*)\s*series/i);
        if (seriesMatch) {
            let extracted = seriesMatch[1].trim();

            // "CK(R)" -> "CK / CKR"로 변환
            if (extracted.includes('(') && extracted.includes(')')) {
                const baseMatch = extracted.match(/^([A-Z]+)\(([A-Z]+)\)$/);
                if (baseMatch) {
                    extracted = `${baseMatch[1]} / ${baseMatch[1]}${baseMatch[2]}`;
                }
            }

            return `${extracted} series`;
        }

        // 3. "series" 키워드가 없는 경우 (예: "Tailstock Manual", "Tail Spindle")
        // productName이 짧으면 그대로 사용
        if (productName.length < 30 && !productName.toLowerCase().includes('chuck') && !productName.toLowerCase().includes('table')) {
            return productName;
        }

        // 4. slug를 대문자로 변환하여 사용 (예: "ck_r" -> "CK_R series")
        const slugSeries = slug.toUpperCase().replace(/_/g, ' ') + ' series';
        return slugSeries;
    }

    /**
     * 딜레이 함수
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
