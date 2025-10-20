import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryModel, CategoryDocument, CategoryLevel } from '../../../schemas/category.schema';

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
        const query: any = {};

        if (filters?.level !== undefined) {
            query.level = filters.level;
        }

        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        return (await this.categoryModel.find(query).sort({ level: 1, order: 1 }).exec()) as CategoryDocument[];
    }

    /**
     * slug로 카테고리 조회
     */
    async findBySlug(slug: string): Promise<CategoryDocument | null> {
        return (await this.categoryModel.findOne({ slug }).exec()) as CategoryDocument | null;
    }

    /**
     * ID로 카테고리 조회
     */
    async findById(id: string): Promise<CategoryDocument | null> {
        return (await this.categoryModel.findById(id).exec()) as CategoryDocument | null;
    }

    /**
     * 카테고리 생성
     */
    async create(categoryData: Partial<CategoryModel>): Promise<CategoryDocument> {
        const newCategory = new this.categoryModel(categoryData);
        return (await newCategory.save()) as CategoryDocument;
    }

    /**
     * 카테고리 수정
     */
    async update(id: string, categoryData: Partial<CategoryModel>): Promise<CategoryDocument | null> {
        return (await this.categoryModel
            .findByIdAndUpdate(id, { $set: categoryData }, { new: true })
            .exec()) as CategoryDocument | null;
    }

    /**
     * 카테고리 삭제 (Hard Delete)
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.categoryModel.deleteOne({ _id: id }).exec();
        return result.deletedCount > 0;
    }

    /**
     * 카테고리 활성화/비활성화
     */
    async toggleActive(id: string, isActive: boolean): Promise<CategoryDocument | null> {
        return (await this.categoryModel
            .findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
            .exec()) as CategoryDocument | null;
    }

    /**
     * 정렬 순서 업데이트
     */
    async updateOrder(id: string, order: number): Promise<CategoryDocument | null> {
        return (await this.categoryModel
            .findByIdAndUpdate(id, { $set: { order } }, { new: true })
            .exec()) as CategoryDocument | null;
    }

    /**
     * 특정 부모의 하위 카테고리 조회
     */
    async findByParentName(parentName: string): Promise<CategoryDocument[]> {
        return (await this.categoryModel.find({ parentName }).sort({ order: 1 }).exec()) as CategoryDocument[];
    }

    /**
     * 제품 수 업데이트
     */
    async updateProductCount(id: string, productCount: number): Promise<CategoryDocument | null> {
        return (await this.categoryModel
            .findByIdAndUpdate(id, { $set: { productCount } }, { new: true })
            .exec()) as CategoryDocument | null;
    }

    /**
     * 대분류별 카테고리 조회
     */
    async findByMainCategory(mainCategory: string): Promise<CategoryDocument[]> {
        return (await this.categoryModel.find({ mainCategory }).sort({ order: 1 }).exec()) as CategoryDocument[];
    }
}
