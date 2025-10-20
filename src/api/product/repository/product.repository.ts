import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product, ProductDocument } from '../../../schemas/product.schema';
import { createSearchQuery } from '../../../common/utils/korean-search.util';

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
        let queryBuilder: any = this.productModel.find(query);

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
            .sort({ priority: -1, createdAt: -1 })
            .limit(limit);
        return (await query.exec()) as ProductDocument[];
    }

    /**
     * 인기 제품 조회 (조회수 기준)
     */
    async findPopular(limit: number): Promise<ProductDocument[]> {
        const query: any = this.productModel
            .find({ isActive: true })
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(limit);
        return (await query.exec()) as ProductDocument[];
    }

    /**
     * 최신 제품 조회
     */
    async findRecent(limit: number): Promise<ProductDocument[]> {
        const query: any = this.productModel.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit);
        return (await query.exec()) as ProductDocument[];
    }

    /**
     * 제품 코드로 조회
     */
    async findByCode(productCode: string): Promise<ProductDocument | null> {
        const query: any = this.productModel.findOne({ productCode });
        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 제품 ID로 조회
     */
    async findById(id: string): Promise<ProductDocument | null> {
        const query: any = this.productModel.findById(id);
        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 조회수 증가
     */
    async incrementViewCount(productCode: string): Promise<void> {
        await this.productModel.updateOne({ productCode }, { $inc: { viewCount: 1 } }).exec();
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
                        products: { $push: { productCode: '$productCode', productName: '$productName' } },
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

        const query: any = this.productModel.find(filter);
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
            query.$or = [
                { productName: new RegExp(params.keyword, 'i') },
                { productCode: new RegExp(params.keyword, 'i') },
            ];
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
        let queryBuilder: any = this.productModel.find(query);

        // 정렬
        switch (params.sort) {
            case 'popular':
                queryBuilder = queryBuilder.sort({ viewCount: -1 });
                break;
            case 'name':
                queryBuilder = queryBuilder.sort({ productName: 1 });
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
            { productNameKo: searchRegex },
            { productCode: searchRegex },
            { 'category.series': searchRegex },
            { 'category.mainCategory': searchRegex },
            { 'category.subCategory': searchRegex },
            { tags: searchRegex },
        ];

        // Total count
        const total = await this.productModel.countDocuments(baseQuery).exec();

        // Query builder with aggregation for scoring
        const aggregationPipeline: any[] = [
            { $match: baseQuery },
            {
                // 정확도 점수 계산
                $addFields: {
                    searchScore: {
                        $add: [
                            // 제품명 정확도 (가장 높은 우선순위)
                            {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: '$productName',
                                            regex: `^${params.keyword}$`,
                                            options: 'i',
                                        },
                                    },
                                    100,
                                    {
                                        $cond: [
                                            {
                                                $regexMatch: {
                                                    input: '$productName',
                                                    regex: `^${params.keyword}`,
                                                    options: 'i',
                                                },
                                            },
                                            90,
                                            {
                                                $cond: [
                                                    {
                                                        $regexMatch: {
                                                            input: '$productName',
                                                            regex: params.keyword,
                                                            options: 'i',
                                                        },
                                                    },
                                                    60,
                                                    0,
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            // 제품코드 정확도
                            {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: '$productCode',
                                            regex: `^${params.keyword}$`,
                                            options: 'i',
                                        },
                                    },
                                    80,
                                    {
                                        $cond: [
                                            {
                                                $regexMatch: {
                                                    input: '$productCode',
                                                    regex: `^${params.keyword}`,
                                                    options: 'i',
                                                },
                                            },
                                            70,
                                            {
                                                $cond: [
                                                    {
                                                        $regexMatch: {
                                                            input: '$productCode',
                                                            regex: params.keyword,
                                                            options: 'i',
                                                        },
                                                    },
                                                    50,
                                                    0,
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            // 시리즈 정확도
                            {
                                $cond: [
                                    { $regexMatch: { input: '$category.series', regex: params.keyword, options: 'i' } },
                                    40,
                                    0,
                                ],
                            },
                        ],
                    },
                },
            },
            // 점수순, 제품명순 정렬
            { $sort: { searchScore: -1, productName: 1 } },
        ];

        // 페이지네이션 추가
        if (params.skip !== undefined) {
            aggregationPipeline.push({ $skip: params.skip });
        }

        if (params.limit !== undefined) {
            aggregationPipeline.push({ $limit: params.limit });
        }

        const products = (await this.productModel.aggregate(aggregationPipeline).exec()) as ProductDocument[];

        return { products, total };
    }

    /**
     * 제품 생성
     */
    async create(productData: Partial<Product>): Promise<ProductDocument> {
        const newProduct = new this.productModel(productData);
        return (await newProduct.save()) as ProductDocument;
    }

    /**
     * 제품 수정
     */
    async update(productCode: string, productData: Partial<Product>): Promise<ProductDocument | null> {
        const query: any = this.productModel.findOneAndUpdate({ productCode }, { $set: productData }, { new: true });
        return (await query.exec()) as ProductDocument | null;
    }

    /**
     * 제품 삭제 (Hard Delete)
     */
    async delete(productCode: string): Promise<boolean> {
        const result = await this.productModel.deleteOne({ productCode }).exec();
        return result.deletedCount > 0;
    }

    /**
     * 제품 활성화/비활성화 토글
     */
    async toggleActive(productCode: string, isActive: boolean): Promise<ProductDocument | null> {
        const query: any = this.productModel.findOneAndUpdate({ productCode }, { $set: { isActive } }, { new: true });
        return (await query.exec()) as ProductDocument | null;
    }
}
