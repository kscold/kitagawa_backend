import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CategoryModel, CategoryDocument, CategoryLevel } from '../../../schema/category.schema';

/**
 * Category Repository
 * 순수한 데이터베이스 쿼리만 담당
 */
@Injectable()
export class CategoryRepository {
    constructor(@InjectModel(CategoryModel.name) private readonly categoryModel: Model<CategoryDocument>) {}

    /**
     * 모든 카테고리 조회 (관리자용 - 비활성화 포함)
     */
    async findAll(filters?: { level?: CategoryLevel; isActive?: boolean }): Promise<CategoryDocument[]> {
        const query: Record<string, any> = {};

        if (filters?.level !== undefined) {
            query.level = filters.level;
        }

        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        const result: any = await this.categoryModel.find(query).sort({ level: 1, order: 1 }).exec();
        return result as CategoryDocument[];
    }

    /**
     * 페이지네이션을 포함한 카테고리 조회
     */
    async findAllWithPagination(
        filters: { level?: CategoryLevel; isActive?: boolean },
        page: number,
        limit: number,
    ): Promise<{ categories: CategoryDocument[]; total: number }> {
        const query: Record<string, any> = {};

        if (filters?.level !== undefined) {
            query.level = filters.level;
        }

        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        const skip = (page - 1) * limit;

        // 순차적으로 실행하여 타입 복잡도 문제 해결
        const total = await this.categoryModel.countDocuments(query).exec();
        const categoriesResult: any = await this.categoryModel
            .find(query)
            .sort({ level: 1, order: 1 })
            .skip(skip)
            .limit(limit)
            .exec();

        return {
            categories: categoriesResult as CategoryDocument[],
            total,
        };
    }

    /**
     * slug로 카테고리 조회
     */
    async findBySlug(slug: string): Promise<CategoryDocument | null> {
        const result: any = await this.categoryModel.findOne({ slug }).exec();
        return result as CategoryDocument | null;
    }

    /**
     * ID로 카테고리 조회
     */
    async findById(id: string): Promise<CategoryDocument | null> {
        const result: any = await this.categoryModel.findById(id).exec();
        return result as CategoryDocument | null;
    }

    /**
     * 카테고리 생성
     */
    async create(categoryData: Partial<CategoryModel>): Promise<CategoryDocument> {
        const newCategory = new this.categoryModel(categoryData);
        const result: any = await newCategory.save();
        return result as CategoryDocument;
    }

    /**
     * 카테고리 수정 (slug 기반)
     */
    async updateBySlug(slug: string, categoryData: Partial<CategoryModel>): Promise<CategoryDocument | null> {
        const result: any = await this.categoryModel
            .findOneAndUpdate({ slug }, { $set: categoryData }, { new: true })
            .exec();
        return result as CategoryDocument | null;
    }

    /**
     * 카테고리 삭제 (slug 기반)
     */
    async deleteBySlug(slug: string): Promise<boolean> {
        const result = await this.categoryModel.deleteOne({ slug }).exec();
        return result.deletedCount > 0;
    }

    /**
     * 카테고리 활성화/비활성화 (slug 기반)
     */
    async toggleActiveBySlug(slug: string, isActive: boolean): Promise<CategoryDocument | null> {
        const result: any = await this.categoryModel
            .findOneAndUpdate({ slug }, { $set: { isActive } }, { new: true })
            .exec();
        return result as CategoryDocument | null;
    }

    /**
     * 정렬 순서 업데이트 (slug 기반)
     */
    async updateOrderBySlug(slug: string, order: number): Promise<CategoryDocument | null> {
        const result: any = await this.categoryModel
            .findOneAndUpdate({ slug }, { $set: { order } }, { new: true })
            .exec();
        return result as CategoryDocument | null;
    }

    /**
     * 특정 부모의 하위 카테고리 조회
     */
    async findByParentName(parentName: string): Promise<CategoryDocument[]> {
        const result: any = await this.categoryModel.find({ parentName }).sort({ order: 1 }).exec();
        return result as CategoryDocument[];
    }

    /**
     * 제품 수 업데이트
     */
    async updateProductCount(id: string, productCount: number): Promise<CategoryDocument | null> {
        const result: any = await this.categoryModel
            .findByIdAndUpdate(id, { $set: { productCount } }, { new: true })
            .exec();
        return result as CategoryDocument | null;
    }

    /**
     * 대분류별 카테고리 조회
     */
    async findByMainCategory(mainCategory: string): Promise<CategoryDocument[]> {
        const result: any = await this.categoryModel.find({ mainCategory }).sort({ order: 1 }).exec();
        return result as CategoryDocument[];
    }

    /**
     * 여러 카테고리의 순서를 일괄 업데이트 (DND용)
     * @param items 카테고리 슬러그와 순서 배열
     */
    async updateOrdersBatch(items: { slug: string; order: number }[]): Promise<void> {
        // Bulk write 사용하여 한번에 업데이트
        const bulkOps = items.map((item) => ({
            updateOne: {
                filter: { slug: item.slug },
                update: { $set: { order: item.order } },
            },
        }));

        await this.categoryModel.bulkWrite(bulkOps);
    }
}
