import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from '../../schema/resource.schema';
import { Product, ProductDocument } from '../../schema/product.schema';

interface FileInfo {
    url: string;
    fileId: string;
    type: 'pdf' | 'dxf' | 'dwg';
    model: string;
    rowLabel?: string;
}

/**
 * 제품 크롤링 서비스
 * 일본 기타가와 사이트에서 제품 정보를 크롤링하여 DB에 저장
 */
@Injectable()
export class ProductCrawlerService {
    private readonly logger = new Logger(ProductCrawlerService.name);

    constructor(
        @InjectModel(Resource.name)
        private readonly resourceModel: Model<ResourceDocument>,
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>,
    ) {}

    /**
     * URL에서 제품 정보를 크롤링하여 DB에 저장
     * @param url - 일본 기타가와 사이트 URL (예: https://www.kitagawa.com/en/mtools/csd/br-ajc-m.html)
     * @returns 생성된 Resource ID 목록
     */
    async crawlAndImportProduct(url: string): Promise<string[]> {
        this.logger.log(`크롤링 시작: ${url}`);

        try {
            // URL 검증
            this.validateUrl(url);

            // slug 추출 (예: br-ajc-m)
            const slug = this.extractSlug(url);
            this.logger.log(`Slug 추출: ${slug}`);

            // HTML 페이지 가져오기
            const html = await this.fetchHtml(url);

            // 제품 정보 파싱
            const productData = await this.parseProductPage(html, slug);

            // 자료실 파일 정보 파싱
            const files = await this.parseLibraryFiles(html, productData.productName);

            if (files.length === 0) {
                throw new Error('자료실 파일을 찾을 수 없습니다');
            }

            // DB에 Resource 생성
            const resourceIds = await this.createResources(productData, files);

            // DB에 Product 생성/업데이트
            await this.createOrUpdateProduct(url, slug, productData, files);

            this.logger.log(`크롤링 완료: ${resourceIds.length}개 리소스 생성`);
            return resourceIds;
        } catch (error) {
            this.logger.error(`크롤링 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * ====================
     * Helper Methods
     * ====================
     */

    /**
     * Extract file ID from URL
     */
    private extractFileId(url: string): string {
        const match = url.match(/DHP-[^.]+/);
        return match ? match[0] : '';
    }

    /**
     * Clean HTML entities and normalize content
     */
    private cleanHtml(html: string): string {
        return html
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract number from model name for sorting
     */
    private extractModelNumber(model: string): number {
        const match = model.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    /**
     * URL 검증
     */
    private validateUrl(url: string): void {
        if (!url.includes('kitagawa.com') && !url.includes('kitagawa.co.jp')) {
            throw new Error('유효하지 않은 URL입니다. 기타가와 사이트 URL만 지원합니다.');
        }
    }

    /**
     * URL에서 slug 추출
     * 예: https://www.kitagawa.com/en/mtools/csd/br-ajc-m.html -> br-ajc-m
     */
    private extractSlug(url: string): string {
        const match = url.match(/\/([^/]+)\.html?$/);
        if (!match) {
            throw new Error('URL에서 slug를 추출할 수 없습니다.');
        }
        return match[1];
    }

    /**
     * HTML 페이지 가져오기
     */
    private async fetchHtml(url: string): Promise<string> {
        this.logger.log(`HTML 가져오기: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
    }

    /**
     * 제품 페이지에서 제품 정보 파싱
     */
    private async parseProductPage(
        html: string,
        slug: string,
    ): Promise<{
        productName: string;
        seriesName?: string;
        category: string;
        description?: string;
        mainImageUrl?: string;
        imageUrls?: string[];
        specificationHtml?: string;
        youtubeUrls?: string[];
        downloads?: Array<{ type: string; category: string; title: string; url: string }>;
        metadata: any;
    }> {
        this.logger.log('제품 정보 파싱 중...');

        // Extract product name from h1
        let productName = '';
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
            productName = this.cleanHtml(h1Match[1]);
        }

        // Fallback to slug
        if (!productName) {
            productName = slug.toUpperCase();
        }

        // Determine category from slug
        const category = this.getCategoryFromSlug(slug);

        // Extract description (from catchphrase + listType01)
        let description = '';
        const catchPhraseMatch = html.match(/<p[^>]*class="catchphrase"[^>]*>([\s\S]*?)<\/p>/i);
        if (catchPhraseMatch) {
            description = this.cleanHtml(catchPhraseMatch[1].replace(/<[^>]+>/g, ''));
        }

        const listMatch = html.match(/<ul[^>]*class="listType01"[^>]*>([\s\S]*?)<\/ul>/i);
        if (listMatch) {
            const listItems = listMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
            const listText = listItems.map((li) => this.cleanHtml(li.replace(/<[^>]+>/g, ''))).join('\n');
            description = description ? `${description}\n${listText}` : listText;
        }

        // Extract main image (from fancybox figure)
        let mainImageUrl = '';
        const fancyboxMatch = html.match(
            /<figure[^>]*>.*?<a[^>]*class="fancybox"[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*>.*?<\/a>.*?<\/figure>/is,
        );
        if (fancyboxMatch) {
            mainImageUrl = fancyboxMatch[1].startsWith('http')
                ? fancyboxMatch[1]
                : `https://www.kitagawa.com${fancyboxMatch[1]}`;
        }

        // Extract all images
        const imageUrls: string[] = [];
        if (mainImageUrl) {
            imageUrls.push(mainImageUrl);
        }

        // Extract YouTube URLs
        const youtubeUrls: string[] = [];
        const youtubeMatches = html.match(/https:\/\/www\.youtube\.com\/embed\/[^"?]+[^"]*/gi) || [];
        youtubeUrls.push(...youtubeMatches);

        // Extract specification HTML
        let specificationHtml = '';
        const specMatch = html.match(
            /<h3[^>]*class="midashi01"[^>]*>Product Specifications<\/h3>([\s\S]*?)(?=<h3|<div class="pagetop"|$)/i,
        );
        if (specMatch) {
            specificationHtml = specMatch[0];
        }

        // Extract downloads (PDFs - catalog, flyer, manual)
        const downloads: Array<{ type: string; category: string; title: string; url: string }> = [];

        // Extract from dropDown section (catalogue extract, flyer)
        const dropDownMatch = html.match(/<div class="dropDown">[\s\S]*?<\/div>/i);
        if (dropDownMatch) {
            const pdfLinks = dropDownMatch[0].match(/<a[^>]*href="([^"]*\.pdf)"[^>]*>([^<]*)<\/a>/gi) || [];
            for (const link of pdfLinks) {
                const urlMatch = link.match(/href="([^"]*)"/i);
                const titleMatch = link.match(/>([^<]*)</);
                if (urlMatch && titleMatch) {
                    const url = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.kitagawa.com${urlMatch[1]}`;
                    downloads.push({
                        type: 'PDF',
                        category: 'Catalog',
                        title: this.cleanHtml(titleMatch[1]),
                        url,
                    });
                }
            }
        }

        // Extract instruction manual
        const manualMatch = html.match(/<a[^>]*href="([^"]*manu[^"]*\.pdf)"[^>]*>[\s\S]*?<span>([^<]*)<\/span>/i);
        if (manualMatch) {
            const url = manualMatch[1].startsWith('http')
                ? manualMatch[1]
                : `https://www.kitagawa.com${manualMatch[1]}`;
            downloads.push({
                type: 'PDF',
                category: 'Manual',
                title: this.cleanHtml(manualMatch[2]),
                url,
            });
        }

        this.logger.log(`제품명: ${productName}, 카테고리: ${category}`);

        return {
            productName,
            category,
            description,
            mainImageUrl,
            imageUrls,
            specificationHtml,
            youtubeUrls,
            downloads,
            metadata: {
                slug,
                sourceUrl: `https://www.kitagawa.com/en/mtools/csd/${slug}.html`,
            },
        };
    }

    /**
     * 자료실 파일 정보 파싱
     * rebuild-all-resources-from-html.ts의 parseHtml 로직 기반
     */
    private async parseLibraryFiles(html: string, productName: string): Promise<FileInfo[]> {
        this.logger.log('자료실 파일 파싱 중...');

        const files: FileInfo[] = [];

        // Split into tables
        const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];

        for (const tableHtml of tables) {
            const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

            // Step 1: Find Model row and extract model names
            let models: string[] = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.match(/>Model<|>型/i)) {
                    const cells = row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
                    for (const cell of cells) {
                        const content = this.cleanHtml(cell.replace(/<[^>]+>/g, ''));
                        if (content && !content.match(/^Model$/i) && !content.match(/^型/)) {
                            models.push(content);
                        }
                    }
                    break;
                }
            }

            if (models.length === 0) continue;

            // Step 2: Detect variant structure
            const hasVariants = rows.some(
                (r: string) =>
                    r.match(/<th[^>]*>[^<]*M\.\.H[ABC]\d*[DN]?[^<]*<\/th>/i) ||
                    r.match(/<th[^>]*>[^<]*YW-RE?[^<]*<\/th>/i),
            );

            if (hasVariants) {
                // Process variant structure - ONLY take FIRST variant for each type
                const variantData: Map<string, { pdf: string[]; dxf: string[]; dwg: string[] }> = new Map();
                let currentVariant = '';
                let firstPdfVariant = '';
                let firstDxfVariant = '';
                let firstDwgVariant = '';

                for (const row of rows) {
                    // Check for variant label
                    const variantMatch =
                        row.match(/<th[^>]*>([^<]*YW-RE[^<]*)<\/th>/i) ||
                        row.match(/<th[^>]*>([^<]*YW-R[^<]*)<\/th>/i) ||
                        row.match(/<th[^>]*>([^<]*M\.\.H[ABC]\d*[DN]?[^<]*)<\/th>/i);

                    if (variantMatch) {
                        currentVariant = variantMatch[1].trim();
                        if (!variantData.has(currentVariant)) {
                            variantData.set(currentVariant, { pdf: [], dxf: [], dwg: [] });
                        }
                    }

                    if (!currentVariant) continue;

                    // Extract URLs from this row
                    const urlMatches = row.match(/href="([^"]*\.(pdf|dxf|dwg))"/gi) || [];
                    if (urlMatches.length === 0) continue;

                    const urls = urlMatches.map((m) => {
                        const match = m.match(/href="([^"]*)"/);
                        return match ? match[1] : '';
                    });

                    // Determine file type and track first variant for each type
                    const hasPdf = urls.some((u) => u.toLowerCase().endsWith('.pdf'));
                    const hasDxf = urls.some((u) => u.toLowerCase().endsWith('.dxf'));
                    const hasDwg = urls.some((u) => u.toLowerCase().endsWith('.dwg'));

                    const data = variantData.get(currentVariant)!;

                    if (hasPdf) {
                        if (!firstPdfVariant) firstPdfVariant = currentVariant;
                        data.pdf.push(...urls.filter((u) => u.toLowerCase().endsWith('.pdf')));
                    }
                    if (hasDxf) {
                        if (!firstDxfVariant) firstDxfVariant = currentVariant;
                        data.dxf.push(...urls.filter((u) => u.toLowerCase().endsWith('.dxf')));
                    }
                    if (hasDwg) {
                        if (!firstDwgVariant) firstDwgVariant = currentVariant;
                        data.dwg.push(...urls.filter((u) => u.toLowerCase().endsWith('.dwg')));
                    }
                }

                // Only use FIRST variant for each file type
                for (let i = 0; i < models.length; i++) {
                    const baseModel = models[i];

                    // PDF - use first PDF variant only
                    if (firstPdfVariant && variantData.get(firstPdfVariant)?.pdf[i]) {
                        const url = variantData.get(firstPdfVariant)!.pdf[i];
                        files.push({
                            url: url,
                            fileId: this.extractFileId(url),
                            type: 'pdf',
                            model: baseModel,
                            rowLabel: firstPdfVariant,
                        });
                    }

                    // DXF - use first DXF variant only
                    if (firstDxfVariant && variantData.get(firstDxfVariant)?.dxf[i]) {
                        const url = variantData.get(firstDxfVariant)!.dxf[i];
                        files.push({
                            url: url,
                            fileId: this.extractFileId(url),
                            type: 'dxf',
                            model: baseModel,
                            rowLabel: firstDxfVariant,
                        });
                    }

                    // DWG - use first DWG variant only
                    if (firstDwgVariant && variantData.get(firstDwgVariant)?.dwg[i]) {
                        const url = variantData.get(firstDwgVariant)!.dwg[i];
                        files.push({
                            url: url,
                            fileId: this.extractFileId(url),
                            type: 'dwg',
                            model: baseModel,
                            rowLabel: firstDwgVariant,
                        });
                    }
                }
            } else {
                // Standard pattern - parse by cell to handle multiple URLs per cell
                const pdfUrls: string[] = [];
                const dxfUrls: string[] = [];
                const dwgUrls: string[] = [];

                for (const row of rows) {
                    const isPdfRow = row.match(/<th[^>]*>[^<]*PDF[^<]*<\/th>/i);
                    const isDxfRow = row.match(/<th[^>]*>[^<]*DXF[^<]*<\/th>/i);
                    const isDwgRow = row.match(/<th[^>]*>[^<]*DWG[^<]*<\/th>/i);

                    // Extract cells (td elements) from this row
                    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];

                    if (isPdfRow || isDxfRow || isDwgRow) {
                        // Explicit file type row - parse by cell
                        for (const cell of cells) {
                            const cellUrls = cell.match(/href="([^"]*\.(pdf|dxf|dwg))"/gi) || [];
                            if (cellUrls.length === 0) continue;

                            // Take only the FIRST URL from each cell
                            const firstUrlMatch = cellUrls[0].match(/href="([^"]*)"/);
                            const firstUrl = firstUrlMatch ? firstUrlMatch[1] : '';
                            if (!firstUrl) continue;

                            if (isPdfRow && firstUrl.toLowerCase().endsWith('.pdf')) {
                                pdfUrls.push(firstUrl);
                            } else if (isDxfRow && firstUrl.toLowerCase().endsWith('.dxf')) {
                                dxfUrls.push(firstUrl);
                            } else if (isDwgRow && firstUrl.toLowerCase().endsWith('.dwg')) {
                                dwgUrls.push(firstUrl);
                            }
                        }
                    } else {
                        // No explicit header - check if row has URLs and parse by cell
                        for (const cell of cells) {
                            const cellUrls = cell.match(/href="([^"]*\.(pdf|dxf|dwg))"/gi) || [];
                            if (cellUrls.length === 0) continue;

                            // Group URLs by type, take first of each type
                            let foundPdf = false,
                                foundDxf = false,
                                foundDwg = false;
                            for (const urlMatch of cellUrls) {
                                const match = urlMatch.match(/href="([^"]*)"/);
                                if (!match) continue;
                                const url = match[1];

                                if (!foundPdf && url.toLowerCase().endsWith('.pdf')) {
                                    pdfUrls.push(url);
                                    foundPdf = true;
                                } else if (!foundDxf && url.toLowerCase().endsWith('.dxf')) {
                                    dxfUrls.push(url);
                                    foundDxf = true;
                                } else if (!foundDwg && url.toLowerCase().endsWith('.dwg')) {
                                    dwgUrls.push(url);
                                    foundDwg = true;
                                }
                            }
                        }
                    }
                }

                for (let i = 0; i < models.length; i++) {
                    const model = models[i];

                    if (pdfUrls[i]) {
                        files.push({
                            url: pdfUrls[i],
                            fileId: this.extractFileId(pdfUrls[i]),
                            type: 'pdf',
                            model: model,
                        });
                    }
                    if (dxfUrls[i]) {
                        files.push({
                            url: dxfUrls[i],
                            fileId: this.extractFileId(dxfUrls[i]),
                            type: 'dxf',
                            model: model,
                        });
                    }
                    if (dwgUrls[i]) {
                        files.push({
                            url: dwgUrls[i],
                            fileId: this.extractFileId(dwgUrls[i]),
                            type: 'dwg',
                            model: model,
                        });
                    }
                }
            }
        }

        this.logger.log(`파싱된 파일: ${files.length}개`);
        return files;
    }

    /**
     * Get category from slug
     * rebuild-all-resources-from-html.ts의 getCategoryFromProduct 로직 기반
     */
    private getCategoryFromSlug(slug: string): string {
        const slugLower = slug.toLowerCase();

        // Category patterns
        const cylinderPatterns = /^(sr|ss|s-l|s |m |y-r|yw-r|y-re|ys|ay-r|f )/i;
        const chuckPatterns =
            /chuck|power.*chuck|^n |nl|nlt|nrc|nt|sc|jn|ia|ic|hob|^b-|^b |^bl|^bb|^bt|^pu|^pw|^fg|^dl|^qjr|^hw|^mlv|^ub|^upr|^uve|^kpc|^hoh|^brt/i;
        const rotaryPatterns = /^(mk|mx|ck|rk|rs|gt|tmx|tr|tbx|tu|tp|tm|tt|rkt|tw|mr)/i;
        const visePatterns = /^(ve-|vqx|vqa|vc-|vm-|mh\d|mv\d|v75|vax)/i;
        const gripperPatterns = /^(as|at|pws|pues|pls|sc-s|jm)/i;

        if (cylinderPatterns.test(slugLower)) {
            return 'cylinder';
        }
        if (chuckPatterns.test(slugLower)) {
            return 'chuck';
        }
        if (rotaryPatterns.test(slugLower)) {
            return 'nc-rotary-table';
        }
        if (visePatterns.test(slugLower)) {
            return 'vise';
        }
        if (gripperPatterns.test(slugLower)) {
            return 'work-gripper';
        }

        return 'chuck'; // Default
    }

    /**
     * DB에 Resource 생성
     * rebuild-all-resources-from-html.ts의 Resource 생성 로직 기반
     */
    private async createResources(
        productData: {
            productName: string;
            seriesName?: string;
            category: string;
            metadata: any;
        },
        files: FileInfo[],
    ): Promise<string[]> {
        this.logger.log(`Resource 생성 중: ${files.length}개 파일`);

        const resourceIds: string[] = [];

        // Get current max order for this category
        const maxOrderResource = await this.resourceModel
            .findOne({ categories: productData.category })
            .sort({ order: -1 })
            .lean()
            .exec();

        let currentOrder = maxOrderResource ? (maxOrderResource.order || 0) + 1 : 1;

        // Sort files by model number
        const sortedFiles = [...files].sort((a, b) => {
            const numA = this.extractModelNumber(a.model);
            const numB = this.extractModelNumber(b.model);
            if (numA !== numB) return numA - numB;
            if (a.model !== b.model) return a.model.localeCompare(b.model);

            // Then by file type (PDF first)
            const typeOrder = ['pdf', 'dxf', 'dwg'];
            return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        });

        for (const file of sortedFiles) {
            if (!file.fileId) {
                this.logger.warn(`파일 ID가 없습니다: ${file.url}`);
                continue;
            }

            // Check if resource already exists
            const existing = await this.resourceModel.findOne({
                'file.url': file.url,
            });

            if (existing) {
                this.logger.log(`이미 존재하는 리소스: ${file.fileId}`);
                resourceIds.push(existing._id.toString());
                continue;
            }

            const extension = file.type.toUpperCase();
            const fileName = `${file.fileId}.${file.type}`;

            const newResource = await this.resourceModel.create({
                title: `${file.model} ${extension}`,
                type: 'TECHNICAL',
                categories: [productData.category],
                metadata: {
                    productName: productData.productName,
                    model: file.model,
                    ...productData.metadata,
                },
                file: {
                    url: file.url,
                    fileName: fileName,
                },
                order: currentOrder++,
                isActive: true,
            });

            resourceIds.push(newResource._id.toString());
            this.logger.log(`생성: ${file.model} ${extension} (order: ${newResource.order})`);
        }

        this.logger.log(`총 ${resourceIds.length}개 리소스 생성/확인 완료`);
        return resourceIds;
    }

    /**
     * Product 엔티티 생성 또는 업데이트
     */
    private async createOrUpdateProduct(
        url: string,
        slug: string,
        productData: {
            productName: string;
            seriesName?: string;
            category: string;
            description?: string;
            mainImageUrl?: string;
            imageUrls?: string[];
            specificationHtml?: string;
            youtubeUrls?: string[];
            downloads?: Array<{ type: string; category: string; title: string; url: string }>;
            metadata: any;
        },
        files: FileInfo[],
    ): Promise<void> {
        this.logger.log(`Product 생성/업데이트 중: ${slug}`);

        // 파일 정보를 specificationFiles 형식으로 변환
        const specificationFiles = files.map((file) => ({
            type: file.type.toUpperCase(),
            category: '2D',
            title: file.model,
            url: file.url,
            model: file.model,
        }));

        // 기존 Product 찾기
        const existingProduct = await this.productModel.findOne({ slug }).exec();

        // 현재 카테고리의 최대 order 찾기
        const getMaxOrder = async (level: 1 | 2) => {
            const maxOrderProduct = await this.productModel
                .findOne(
                    level === 1
                        ? { 'category.mainCategory': productData.category }
                        : { 'category.subCategory': productData.category },
                )
                .sort(level === 1 ? { orderInLevel1: -1 } : { orderInLevel2: -1 })
                .lean()
                .exec();

            if (level === 1) {
                return maxOrderProduct ? (maxOrderProduct.orderInLevel1 || 0) + 1 : 1;
            } else {
                return maxOrderProduct ? (maxOrderProduct.orderInLevel2 || 0) + 1 : 1;
            }
        };

        if (existingProduct) {
            // 기존 Product 업데이트
            this.logger.log(`기존 Product 업데이트: ${slug}`);

            await this.productModel
                .findByIdAndUpdate(existingProduct._id, {
                    description: productData.description,
                    mainImageUrl: productData.mainImageUrl,
                    imageUrls: productData.imageUrls || [],
                    specificationHtml: productData.specificationHtml,
                    youtubeUrl: productData.youtubeUrls || [],
                    downloads: productData.downloads || [],
                    specificationFiles,
                    sourceUrl: url,
                    updatedAt: new Date(),
                })
                .exec();
        } else {
            // 새 Product 생성
            this.logger.log(`새 Product 생성: ${slug}`);

            const orderInLevel1 = await getMaxOrder(1);

            await this.productModel.create({
                slug,
                productName: productData.productName,
                productTitle: productData.seriesName || productData.productName,
                category: {
                    mainCategory: productData.category,
                    subCategory: '',
                    series: productData.seriesName || productData.productName,
                },
                description: productData.description,
                mainImageUrl: productData.mainImageUrl,
                imageUrls: productData.imageUrls || [],
                specificationHtml: productData.specificationHtml,
                youtubeUrl: productData.youtubeUrls || [],
                downloads: productData.downloads || [],
                sourceUrl: url,
                specificationFiles,
                tags: [productData.category, productData.seriesName || productData.productName].filter(Boolean),
                isActive: true,
                isFeatured: false,
                orderInLevel1,
                orderInLevel2: 0,
                viewCount: 0,
                metadata: {
                    lastCrawled: new Date(),
                    crawlSource: 'auto-import',
                },
            });

            this.logger.log(`Product 생성 완료: ${slug} (orderInLevel1: ${orderInLevel1})`);
        }
    }
}
