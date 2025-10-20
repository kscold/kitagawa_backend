import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryModel, CategoryDocument, CategoryLevel } from '../../schemas/category.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { Level1CategoryResponseDto } from './dto/response/level1-category-response.dto';
import { SeriesInfoDto } from './dto/response/series-info.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectModel(CategoryModel.name)
        private categoryModel: Model<CategoryDocument>,
        @InjectModel(Product.name)
        private productModel: Model<ProductDocument>,
    ) {}

    // 전체 카테고리 조회 (계층 구조)
    async getAllCategories() {
        const categories = await this.categoryModel.find({ isActive: true }).sort({ order: 1 }).lean();

        // Level 1 기준으로 그룹화
        const level1Categories = categories.filter((c) => c.level === CategoryLevel.LEVEL_1);

        const result = level1Categories.map((level1) => ({
            ...level1,
            children: this.buildCategoryTree(level1.name, categories),
        }));

        return result;
    }

    // 재귀적으로 카테고리 트리 구성
    private buildCategoryTree(parentName: string, allCategories: any[]): any[] {
        const children = allCategories.filter((c) => c.parentName === parentName);

        return children.map((child) => ({
            ...child,
            children: this.buildCategoryTree(child.name, allCategories),
        }));
    }

    // 시리즈명을 슬러그로 변환 (영어만 사용)
    private generateSeriesSlug(seriesName: string): string {
        return seriesName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Level 2 카테고리의 시리즈 정보 조회
    private async getSeriesForLevel2Category(
        mainCategory: string,
        subCategory: string,
    ): Promise<SeriesInfoDto[]> {
        const products = await this.productModel
            .find({
                'category.mainCategory': mainCategory,
                'category.subCategory': subCategory,
                'category.series': { $exists: true, $nin: [null, ''] },
                isActive: true,
            })
            .select('category.series mainImageUrl')
            .lean();

        const seriesMap = new Map<string, { count: number; imageUrl?: string }>();

        products.forEach((product) => {
            const seriesName = product.category.series;
            if (seriesName) {
                const existing = seriesMap.get(seriesName);
                if (existing) {
                    existing.count++;
                    if (!existing.imageUrl && product.mainImageUrl) {
                        existing.imageUrl = product.mainImageUrl;
                    }
                } else {
                    seriesMap.set(seriesName, {
                        count: 1,
                        imageUrl: product.mainImageUrl,
                    });
                }
            }
        });

        const seriesArray: SeriesInfoDto[] = Array.from(seriesMap.entries()).map(([name, data]) => ({
            name,
            slug: this.generateSeriesSlug(name),
            productCount: data.count,
            imageUrl: data.imageUrl,
        }));

        seriesArray.sort((a, b) => a.name.localeCompare(b.name));

        return seriesArray;
    }

    // Level 1 카테고리만 조회 (대분류)
    async getLevel1Categories(): Promise<Level1CategoryResponseDto[]> {
        const categories = await this.categoryModel
            .find({ level: CategoryLevel.LEVEL_1, isActive: true })
            .sort({ order: 1 })
            .lean();

        return Level1CategoryResponseDto.fromDocuments(categories);
    }

    // 특정 Level 1 카테고리의 하위 카테고리 조회 (슬러그 기반)
    async getCategoriesBySlug(slug: string) {
        // 먼저 슬러그로 Level 1 카테고리 찾기
        const level1Category = await this.categoryModel
            .findOne({
                slug: slug,
                level: CategoryLevel.LEVEL_1,
                isActive: true,
            })
            .lean();

        if (!level1Category) {
            return null;
        }

        // 해당 Level 1의 모든 하위 카테고리 조회
        const level2Categories = await this.categoryModel
            .find({
                mainCategory: level1Category.name,
                level: CategoryLevel.LEVEL_2,
                isActive: true,
            })
            .sort({ order: 1 })
            .lean();

        // 각 Level 2 카테고리에 대해 시리즈 정보 조회
        const level2WithSeries = await Promise.all(
            level2Categories.map(async (level2Cat) => {
                const series = await this.getSeriesForLevel2Category(level1Category.name, level2Cat.name);

                // Level 2에서 불필요한 필드 제거하고 부모 정보 추가
                const { parentName, mainCategory, description, descriptionKo, __v, ...level2Rest } = level2Cat;

                return {
                    ...level2Rest,
                    parentLevelCategory: mainCategory, // 부모 카테고리명
                    parentLevelSlug: level1Category.slug, // 부모의 slug
                    children: series,
                };
            }),
        );

        // Level 2 배열만 반환 (parent 정보는 각 Level 2의 parentLevelSlug에 포함)
        return level2WithSeries;
    }

    // 특정 Level 1 카테고리의 하위 카테고리 조회 (이름 기반 - 하위 호환성)
    async getCategoriesByLevel1(level1Name: string) {
        const allCategories = await this.categoryModel
            .find({
                $or: [{ name: level1Name }, { mainCategory: level1Name }],
                isActive: true,
            })
            .sort({ order: 1 })
            .lean();

        const level1 = allCategories.find((c) => c.level === CategoryLevel.LEVEL_1);
        if (!level1) {
            return null;
        }

        return {
            ...level1,
            children: this.buildCategoryTree(level1.name, allCategories),
        };
    }

    // 특정 카테고리 상세 조회 (슬러그 기반)
    async getCategoryBySlug(slug: string) {
        return await this.categoryModel.findOne({ slug, isActive: true }).lean();
    }

    // 카테고리 경로로 조회
    async getCategoryByPath(path: string[]) {
        return await this.categoryModel.findOne({ path, isActive: true }).lean();
    }

    // 카테고리명으로 검색
    async searchCategories(query: string) {
        return await this.categoryModel
            .find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { nameKo: { $regex: query, $options: 'i' } },
                ],
                isActive: true,
            })
            .sort({ level: 1, order: 1 })
            .limit(20)
            .lean();
    }

    // 카테고리 통계
    async getCategoryStats() {
        const stats = await this.categoryModel.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$level',
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return {
            total: await this.categoryModel.countDocuments({ isActive: true }),
            byLevel: stats.map((s) => ({
                level: s._id,
                count: s.count,
            })),
        };
    }
}
