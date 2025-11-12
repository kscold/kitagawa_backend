import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { createSearchQuery } from '../../../common/utils/korean-search.util';

import { Product, ProductDocument } from '../../../schemas/product.schema';

/**
 * Product Repository
 * 순수한 데이터베이스 쿼리만 담당
 */
@Injectable()
export class ProductRepository {
    constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {}

    /**
     * 제품 목록 조회 (필터, 페이지네이션 포함)
     */
    async findAllWithPagination(filters: {
        category?: string;
        subCategory?: string;
        series?: string;
        tag?: string;
        isActive?: boolean;
        limit?: number;
        skip?: number;
    }): Promise<{ products: ProductDocument[]; total: number }> {
        const query: Record<string, any> = {};

        if (filters.category) {
            query['category.mainCategory'] = filters.category;
        }

        if (filters.subCategory) {
            query['category.subCategory'] = filters.subCategory;
        }

        if (filters.series) {
            query['category.series'] = filters.series;
        }

        if (filters.tag) {
            query.tags = filters.tag;
        }

        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        // Total count
        const total = await this.productModel.countDocuments(query).exec();

        // Query builder
        let queryBuilder: any = this.productModel.find(query).select('-productName -imageUrls -metadata -order');

        if (filters.skip !== undefined) {
            queryBuilder = queryBuilder.skip(filters.skip);
        }

        if (filters.limit !== undefined) {
            queryBuilder = queryBuilder.limit(filters.limit);
        }

        const products = (await queryBuilder.exec()) as ProductDocument[];

        return { products, total };
    }

    /**
     * 추천 제품 조회
     */
    async findFeatured(limit: number): Promise<ProductDocument[]> {
        const query: any = this.productModel
            .find({ isFeatured: true, isActive: true })
            .select('-productName -imageUrls -metadata -order')
            .sort({ order: 1, createdAt: -1 })
            .limit(limit);
        return (await query.exec()) as ProductDocument[];
    }

    /**
     * 인기 제품 조회 (조회수 기준)
     */
    async findPopular(limit: number): Promise<ProductDocument[]> {
        const query: any = this.productModel
            .find({ isActive: true })
            .select('-productName -imageUrls -metadata -order')
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(limit);
        return (await query.exec()) as ProductDocument[];
    }

    /**
     * 최신 제품 조회
     */
    async findRecent(limit: number): Promise<ProductDocument[]> {
        const query: any = this.productModel
            .find({ isActive: true })
            .select('-productName -imageUrls -metadata -order')
            .sort({ createdAt: -1 })
            .limit(limit);
        return (await query.exec()) as ProductDocument[];
    }

    /**
     * slug로 제품 조회 (slug로도 사용됨)
     */
    async findBySlug(slug: string): Promise<ProductDocument | null> {
        const query: any = this.productModel.findOne({ slug }).select('-imageUrls -metadata -order');
        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 제품 ID로 조회
     */
    async findById(id: string): Promise<ProductDocument | null> {
        const query: any = this.productModel.findById(id).select('-imageUrls -metadata -order');
        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 조회수 증가 (slug 기반)
     */
    async incrementViewCount(slug: string): Promise<void> {
        await this.productModel.updateOne({ slug }, { $inc: { viewCount: 1 } }).exec();
    }

    /**
     * 카테고리 목록 조회 (집계)
     */
    async findCategories(): Promise<any[]> {
        return (await this.productModel
            .aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: {
                            mainCategory: '$category.mainCategory',
                            subCategory: '$category.subCategory',
                        },
                        count: { $sum: 1 },
                        products: { $push: { slug: '$slug', productName: '$productName' } },
                    },
                },
                {
                    $group: {
                        _id: '$_id.mainCategory',
                        subCategories: {
                            $push: {
                                name: '$_id.subCategory',
                                count: '$count',
                                products: '$products',
                            },
                        },
                        totalCount: { $sum: '$count' },
                    },
                },
                { $sort: { _id: 1 } },
            ])
            .exec()) as any[];
    }

    /**
     * 카테고리별 제품 조회
     */
    async findByCategory(mainCategory: string, subCategory?: string): Promise<ProductDocument[]> {
        const filter: any = {
            'category.mainCategory': mainCategory,
            isActive: true,
        };

        if (subCategory) {
            filter['category.subCategory'] = subCategory;
        }

        const query: any = this.productModel.find(filter).select('-productName -imageUrls -metadata -order');
        return (await query.exec()) as ProductDocument[];
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
        const query: any = { isActive: true };

        // 키워드 검색
        if (params.keyword) {
            query.$or = [{ productName: new RegExp(params.keyword, 'i') }, { slug: new RegExp(params.keyword, 'i') }];
        }

        // 카테고리 필터
        if (params.category) {
            query['category.mainCategory'] = params.category;
        }

        if (params.subCategory) {
            query['category.subCategory'] = params.subCategory;
        }

        // 태그 필터
        if (params.tags && params.tags.length > 0) {
            query.tags = { $in: params.tags };
        }

        // Total count
        const total = await this.productModel.countDocuments(query).exec();

        // Query builder
        let queryBuilder: any = this.productModel.find(query).select('-productName -imageUrls -metadata -order');

        // 정렬
        switch (params.sort) {
            case 'popular':
                queryBuilder = queryBuilder.sort({ viewCount: -1 });
                break;
            case 'name':
                queryBuilder = queryBuilder.sort({ 'category.series': 1 });
                break;
            case 'recent':
            default:
                queryBuilder = queryBuilder.sort({ createdAt: -1 });
        }

        // 페이지네이션
        if (params.skip !== undefined) {
            queryBuilder = queryBuilder.skip(params.skip);
        }

        if (params.limit !== undefined) {
            queryBuilder = queryBuilder.limit(params.limit);
        }

        const products = (await queryBuilder.exec()) as ProductDocument[];

        return { products, total };
    }

    /**
     * 강력한 제품 검색
     * - 영어, 한글, 자음 검색 지원
     * - 제품명, 제품코드, 시리즈, 카테고리 전체 검색
     * - 정확도 기반 정렬
     */
    async searchProducts(params: {
        keyword: string;
        category?: string;
        subCategory?: string;
        limit?: number;
        skip?: number;
    }): Promise<{ products: ProductDocument[]; total: number }> {
        const baseQuery: any = { isActive: true };

        // 카테고리 필터 추가
        if (params.category) {
            baseQuery['category.mainCategory'] = params.category;
        }

        if (params.subCategory) {
            baseQuery['category.subCategory'] = params.subCategory;
        }

        // 검색 쿼리 생성 (자음 검색 지원)
        const searchRegex = createSearchQuery(params.keyword);

        // 여러 필드에서 검색
        baseQuery.$or = [
            { productName: searchRegex },
            { productTitle: searchRegex },
            { slug: searchRegex },
            { 'category.series': searchRegex },
            { 'category.mainCategory': searchRegex },
            { 'category.subCategory': searchRegex },
            { tags: searchRegex },
            { description: searchRegex },
            { content: searchRegex },
            { contentDetail: searchRegex },
        ];

        // Total count
        const total = await this.productModel.countDocuments(baseQuery).exec();

        // Query builder with aggregation for scoring
        const aggregationPipeline: any[] = [
            { $match: baseQuery },
            {
                // 정확도 점수 계산 (단순화)
                $addFields: {
                    searchScore: {
                        $add: [
                            // productTitle 완전 일치 (가장 높은 우선순위)
                            { $cond: [{ $eq: [{ $toLower: '$productTitle' }, params.keyword.toLowerCase()] }, 100, 0] },
                            // productTitle 시작 일치
                            {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: '$productTitle',
                                            regex: `^${params.keyword}`,
                                            options: 'i',
                                        },
                                    },
                                    90,
                                    0,
                                ],
                            },
                            // slug 완전 일치
                            { $cond: [{ $eq: [{ $toLower: '$slug' }, params.keyword.toLowerCase()] }, 80, 0] },
                            // slug 시작 일치
                            {
                                $cond: [
                                    { $regexMatch: { input: '$slug', regex: `^${params.keyword}`, options: 'i' } },
                                    70,
                                    0,
                                ],
                            },
                            // category.series 포함
                            {
                                $cond: [
                                    { $regexMatch: { input: '$category.series', regex: params.keyword, options: 'i' } },
                                    60,
                                    0,
                                ],
                            },
                            // tags 포함
                            {
                                $cond: [
                                    {
                                        $in: [
                                            { $toLower: params.keyword },
                                            { $map: { input: '$tags', as: 'tag', in: { $toLower: '$$tag' } } },
                                        ],
                                    },
                                    50,
                                    0,
                                ],
                            },
                            // content 포함
                            {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: { $ifNull: ['$content', ''] },
                                            regex: params.keyword,
                                            options: 'i',
                                        },
                                    },
                                    30,
                                    0,
                                ],
                            },
                            // description 포함
                            {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: { $ifNull: ['$description', ''] },
                                            regex: params.keyword,
                                            options: 'i',
                                        },
                                    },
                                    20,
                                    0,
                                ],
                            },
                        ],
                    },
                },
            },
            // 점수순, productTitle순 정렬
            { $sort: { searchScore: -1, productTitle: 1 } },
        ];

        // 페이지네이션 추가
        if (params.skip !== undefined) {
            aggregationPipeline.push({ $skip: params.skip });
        }

        if (params.limit !== undefined) {
            aggregationPipeline.push({ $limit: params.limit });
        }

        // imageUrls와 productName 제외
        aggregationPipeline.push({
            $project: {
                productName: 0,
                imageUrls: 0,
                metadata: 0,
                order: 0,
            },
        });

        const products = (await this.productModel.aggregate(aggregationPipeline).exec()) as ProductDocument[];

        return { products, total };
    }

    /**
     * 제품 생성
     */
    async create(productData: Partial<Product>): Promise<ProductDocument> {
        const newProduct = new this.productModel(productData);
        const result: any = await newProduct.save();
        return result as ProductDocument;
    }

    /**
     * 제품 수정 (레거시 - slug 기반)
     */
    async update(slug: string, productData: Partial<Product>): Promise<ProductDocument | null> {
        const result: any = await this.productModel
            .findOneAndUpdate({ slug }, { $set: productData }, { new: true })
            .select('-imageUrls -metadata -order')
            .exec();
        return result as ProductDocument | null;
    }

    /**
     * 제품 삭제 (slug 기반)
     */
    async delete(slug: string): Promise<boolean> {
        const result = await this.productModel.deleteOne({ slug }).exec();
        return result.deletedCount > 0;
    }

    /**
     * 제품 활성화/비활성화 토글 (slug 기반)
     */
    async toggleActive(slug: string, isActive: boolean): Promise<ProductDocument | null> {
        const query: any = this.productModel
            .findOneAndUpdate({ slug }, { $set: { isActive } }, { new: true })
            .select('-productName -imageUrls -metadata -order');
        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 카테고리 레벨별 제품 조회 (관리자용)
     * @param level 1 또는 2
     * @param categorySlug 카테고리 슬러그
     * @param options 페이지네이션 옵션
     */
    async findByCategoryWithLevel(
        level: 1 | 2,
        categorySlug: string,
        options?: { limit?: number; skip?: number },
    ): Promise<{ products: ProductDocument[]; total: number }> {
        // Level에 따라 다른 필터 적용
        // Level 1: mainCategory로 필터링
        // Level 2: subCategory로 필터링
        const query: any =
            level === 1 ? { 'category.mainCategory': categorySlug } : { 'category.subCategory': categorySlug };

        // Total count
        const total = await this.productModel.countDocuments(query).exec();

        // Query builder - Level에 따라 다른 순서 필드로 정렬
        const sortField = level === 1 ? 'orderInLevel1' : 'orderInLevel2';
        let queryBuilder: any = this.productModel.find(query).sort({ [sortField]: 1, createdAt: -1 });

        if (options?.skip !== undefined) {
            queryBuilder = queryBuilder.skip(options.skip);
        }

        if (options?.limit !== undefined) {
            queryBuilder = queryBuilder.limit(options.limit);
        }

        const products = (await queryBuilder.exec()) as ProductDocument[];

        return { products, total };
    }

    /**
     * 제품의 레벨별 순서 업데이트
     * @param slug 제품 슬러그
     * @param level 1 또는 2
     * @param order 새로운 순서
     */
    async updateOrderByLevel(slug: string, level: 1 | 2, order: number): Promise<ProductDocument | null> {
        const updateField = level === 1 ? 'orderInLevel1' : 'orderInLevel2';

        const query: any = this.productModel.findOneAndUpdate(
            { slug },
            { $set: { [updateField]: order } },
            { new: true },
        );

        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 여러 제품의 순서를 일괄 업데이트 (DND용)
     * @param level 1 또는 2
     * @param items 제품 슬러그와 순서 배열
     */
    async updateOrdersBatch(level: 1 | 2, items: { slug: string; order: number }[]): Promise<void> {
        const updateField = level === 1 ? 'orderInLevel1' : 'orderInLevel2';

        // Bulk write 사용하여 한번에 업데이트
        const bulkOps = items.map((item) => ({
            updateOne: {
                filter: { slug: item.slug },
                update: { $set: { [updateField]: item.order } },
            },
        }));

        await this.productModel.bulkWrite(bulkOps);
    }
}
