import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product, ProductDocument } from '../../schemas/product.schema';

@Injectable()
export class ProductService {
    constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

    /**
     * 추천 제품 조회
     */
    async getFeaturedProducts(limit: number = 8): Promise<ProductDocument[]> {
        const result: ProductDocument[] = (await this.productModel
            .find({ isFeatured: true, isActive: true })
            .sort({ priority: -1, createdAt: -1 })
            .limit(limit)
            .exec()) as any;
        return result;
    }

    /**
     * 인기 제품 조회 (조회수 기준)
     */
    async getPopularProducts(limit: number = 8): Promise<ProductDocument[]> {
        const result: ProductDocument[] = (await this.productModel
            .find({ isActive: true })
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(limit)
            .exec()) as any;
        return result;
    }

    /**
     * 최신 제품 조회
     */
    async getRecentProducts(limit: number = 8): Promise<ProductDocument[]> {
        const result: ProductDocument[] = (await this.productModel
            .find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec()) as any;
        return result;
    }

    /**
     * 카테고리 목록 조회
     */
    async getCategories(): Promise<any[]> {
        const categories: any = (await this.productModel
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
            .exec()) as any;

        return categories.map((cat: any) => ({
            mainCategory: cat._id,
            totalCount: cat.totalCount,
            subCategories: cat.subCategories,
        }));
    }

    /**
     * 모든 제품 조회 (total count 포함)
     */
    async findAll(filters?: {
        category?: string;
        subCategory?: string;
        tag?: string;
        isActive?: boolean;
        limit?: number;
        skip?: number;
    }): Promise<{ products: ProductDocument[]; total: number }> {
        const query: Record<string, any> = {};

        if (filters?.category) {
            query['category.mainCategory'] = filters.category;
        }

        if (filters?.subCategory) {
            query['category.subCategory'] = filters.subCategory;
        }

        if (filters?.tag) {
            query.tags = filters.tag;
        }

        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        // Total count
        const total = await this.productModel.countDocuments(query).exec();

        let queryBuilder = this.productModel.find(query);

        if (filters?.skip) {
            queryBuilder = queryBuilder.skip(filters.skip);
        }

        if (filters?.limit) {
            queryBuilder = queryBuilder.limit(filters.limit);
        }

        const products: ProductDocument[] = (await queryBuilder.exec()) as any;
        return { products, total };
    }

    /**
     * 제품 코드로 조회 (조회수 증가)
     */
    async findByCode(productCode: string, incrementView: boolean = true): Promise<ProductDocument> {
        const product: ProductDocument | null = (await this.productModel.findOne({ productCode }).exec()) as any;

        if (!product) {
            throw new NotFoundException(`Product with code ${productCode} not found`);
        }

        // 조회수 증가
        if (incrementView) {
            await this.productModel.updateOne({ productCode }, { $inc: { viewCount: 1 } }).exec();
            product.viewCount = (product.viewCount || 0) + 1;
        }

        return product;
    }

    /**
     * 제품 ID로 조회 (조회수 증가)
     */
    async findById(id: string, incrementView: boolean = true): Promise<ProductDocument> {
        const product: ProductDocument | null = (await this.productModel.findById(id).exec()) as any;

        if (!product) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }

        // 조회수 증가
        if (incrementView) {
            await this.productModel.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).exec();
            product.viewCount = (product.viewCount || 0) + 1;
        }

        return product;
    }

    /**
     * 제품 검색
     */
    async search(keyword: string): Promise<ProductDocument[]> {
        const result: ProductDocument[] = (await this.productModel
            .find({
                $or: [
                    { productName: { $regex: keyword, $options: 'i' } },
                    { productNameKo: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { tags: { $regex: keyword, $options: 'i' } },
                ],
                isActive: true,
            })
            .exec()) as any;
        return result;
    }

    /**
     * 고급 검색 (total count 포함)
     */
    async advancedSearch(options: {
        keyword?: string;
        category?: string;
        subCategory?: string;
        tags?: string[];
        sort?: string;
        limit?: number;
        skip?: number;
    }): Promise<{ products: ProductDocument[]; total: number }> {
        const query: Record<string, any> = { isActive: true };

        // 키워드 검색
        if (options.keyword) {
            query.$or = [
                { productName: { $regex: options.keyword, $options: 'i' } },
                { productNameKo: { $regex: options.keyword, $options: 'i' } },
                { description: { $regex: options.keyword, $options: 'i' } },
                { tags: { $regex: options.keyword, $options: 'i' } },
                { productCode: { $regex: options.keyword, $options: 'i' } },
            ];
        }

        // 카테고리 필터
        if (options.category) {
            query['category.mainCategory'] = options.category;
        }

        if (options.subCategory) {
            query['category.subCategory'] = options.subCategory;
        }

        // 태그 필터
        if (options.tags && options.tags.length > 0) {
            query.tags = { $in: options.tags };
        }

        // Total count
        const total = await this.productModel.countDocuments(query).exec();

        let queryBuilder = this.productModel.find(query);

        // 정렬
        switch (options.sort) {
            case 'recent':
                queryBuilder = queryBuilder.sort({ createdAt: -1 });
                break;
            case 'popular':
                queryBuilder = queryBuilder.sort({ viewCount: -1 });
                break;
            case 'name':
                queryBuilder = queryBuilder.sort({ productName: 1 });
                break;
            default:
                queryBuilder = queryBuilder.sort({ priority: -1, createdAt: -1 });
        }

        // 페이징
        if (options.skip) {
            queryBuilder = queryBuilder.skip(options.skip);
        }

        if (options.limit) {
            queryBuilder = queryBuilder.limit(options.limit);
        }

        const products: ProductDocument[] = (await queryBuilder.exec()) as any;
        return { products, total };
    }

    /**
     * 카테고리별 제품 조회
     */
    async findByCategory(mainCategory: string, subCategory?: string): Promise<ProductDocument[]> {
        const query: Record<string, any> = {
            'category.mainCategory': mainCategory,
            isActive: true,
        };

        if (subCategory) {
            query['category.subCategory'] = subCategory;
        }

        const result: ProductDocument[] = (await this.productModel.find(query).exec()) as any;
        return result;
    }

    /**
     * 매칭 제품 조회
     */
    async findMatchingProducts(productCode: string): Promise<any[]> {
        const product = await this.findByCode(productCode);
        return product.matchingProducts || [];
    }

    /**
     * 제품 다운로드 링크 조회
     */
    async getDownloads(productCode: string, model?: string): Promise<any[]> {
        const product = await this.findByCode(productCode);

        if (model) {
            return product.downloads.filter((d) => d.model === model);
        }

        return product.downloads;
    }

    /**
     * 제품 수 카운트
     */
    async count(filters?: any): Promise<number> {
        return this.productModel.countDocuments(filters || {}).exec();
    }

    /**
     * 제품 생성 (관리자용)
     */
    async create(productData: Partial<Product>): Promise<ProductDocument> {
        const product = new this.productModel(productData);
        const result: ProductDocument = (await product.save()) as any;
        return result;
    }

    /**
     * 제품 업데이트 (관리자용)
     */
    async update(productCode: string, productData: Partial<Product>): Promise<ProductDocument> {
        const product: ProductDocument | null = (await this.productModel
            .findOneAndUpdate({ productCode }, productData, { new: true })
            .exec()) as any;

        if (!product) {
            throw new NotFoundException(`Product with code ${productCode} not found`);
        }

        return product;
    }

    /**
     * 제품 삭제 (관리자용)
     */
    async delete(productCode: string): Promise<void> {
        const result = await this.productModel.deleteOne({ productCode }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException(`Product with code ${productCode} not found`);
        }
    }

    /**
     * 제품 비활성화
     */
    async deactivate(productCode: string): Promise<ProductDocument> {
        return this.update(productCode, { isActive: false });
    }

    /**
     * 제품 활성화
     */
    async activate(productCode: string): Promise<ProductDocument> {
        return this.update(productCode, { isActive: true });
    }
}
