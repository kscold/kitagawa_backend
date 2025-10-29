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

    // 재귀적으로 카테고리 트리 구성
    private buildCategoryTree(parentName: string, allCategories: any[]): any[] {
        const children = allCategories.filter((c) => c.parentName === parentName);

        return children.map((child) => ({
            ...child,
            children: this.buildCategoryTree(child.name, allCategories),
        }));
    }

    // Level 2 카테고리의 시리즈 정보 조회
    private async getSeriesForLevel2Category(mainCategory: string, subCategory: string): Promise<SeriesInfoDto[]> {
        const products = await this.productModel
            .find({
                'category.mainCategory': mainCategory,
                'category.subCategory': subCategory,
                'category.series': { $exists: true, $nin: [null, ''] },
                isActive: true,
            })
            .select('slug category.series mainImageUrl content contentDetail order')
            .sort({ order: 1, 'category.series': 1 })
            .lean();

        const seriesMap = new Map<string, { slug: string; count: number; imageUrl?: string; content?: string; contentDetail?: string }>();

        products.forEach((product) => {
            const seriesName = product.category.series;
            if (seriesName) {
                const existing = seriesMap.get(seriesName);
                if (existing) {
                    existing.count++;
                    if (!existing.imageUrl && product.mainImageUrl) {
                        existing.imageUrl = product.mainImageUrl;
                    }
                    if (!existing.content && product.content) {
                        existing.content = product.content;
                    }
                    if (!existing.contentDetail && product.contentDetail) {
                        existing.contentDetail = product.contentDetail;
                    }
                } else {
                    seriesMap.set(seriesName, {
                        slug: product.slug, // 실제 제품의 slug를 slug로 사용
                        count: 1,
                        imageUrl: product.mainImageUrl,
                        content: product.content,
                        contentDetail: product.contentDetail,
                    });
                }
            }
        });

        const seriesArray: SeriesInfoDto[] = Array.from(seriesMap.entries()).map(([name, data]) => ({
            name,
            slug: data.slug, // slug를 slug로 사용
            productCount: data.count,
            imageUrl: data.imageUrl,
            content: data.content,
            contentDetail: data.contentDetail,
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

    // Catalogue 카테고리의 제품 정보 조회 (series가 아닌 제품 자체)
    private async getProductsForCatalogueCategory(subCategory: string): Promise<SeriesInfoDto[]> {
        const products = await this.productModel
            .find({
                'category.mainCategory': 'CATALOGUE',
                'category.subCategory': subCategory,
                isActive: true,
            })
            .select('slug productName mainImageUrl category.series order')
            .sort({ order: 1, productName: 1 })
            .lean();

        return products.map((product) => ({
            name: product.category.series || product.productName || 'Unknown',
            slug: product.slug,
            productCount: 1,
            imageUrl: product.mainImageUrl,
        }));
    }

    // WORK GRIPPER 카테고리의 제품 정보 조회 (subCategory가 없는 경우)
    private async getProductsForWorkGripper(): Promise<SeriesInfoDto[]> {
        const products = await this.productModel
            .find({
                'category.mainCategory': 'WORK GRIPPER',
                'category.subCategory': 'Gripper', // WORK GRIPPER의 실제 subCategory 값
                isActive: true,
            })
            .select('slug category.series mainImageUrl content contentDetail order')
            .sort({ order: 1, 'category.series': 1 })
            .lean();

        return products.map((product) => ({
            name: product.category.series,
            slug: product.slug,
            productCount: 1,
            imageUrl: product.mainImageUrl,
            content: product.content,
            contentDetail: product.contentDetail,
        }));
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

        // WORK GRIPPER는 Level 2가 없으므로 특별 처리
        if (level1Category.name === 'WORK GRIPPER') {
            const products = await this.getProductsForWorkGripper();

            // WORK GRIPPER는 가상의 Level 2로 반환 (일관된 응답 형식)
            return [
                {
                    _id: level1Category._id,
                    name: level1Category.name,
                    level: 2,
                    order: 0,
                    isActive: true,
                    productCount: products.length,
                    parentLevelCategory: level1Category.name,
                    parentLevelSlug: level1Category.slug,
                    children: products,
                },
            ];
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

        // CATALOGUE인지 확인
        const isCatalogue = level1Category.name === 'CATALOGUE';

        // 각 Level 2 카테고리에 대해 시리즈/제품 정보 조회
        const level2WithSeries = await Promise.all(
            level2Categories.map(async (level2Cat) => {
                // Catalogue는 제품 자체를 children으로, 다른 카테고리는 series를 children으로
                const children = isCatalogue
                    ? await this.getProductsForCatalogueCategory(level2Cat.name)
                    : await this.getSeriesForLevel2Category(level1Category.name, level2Cat.name);

                // Level 2에서 불필요한 필드 제거하고 부모 정보 추가
                const { parentName, mainCategory, description, slug, __v, ...level2Rest } = level2Cat;

                return {
                    ...level2Rest,
                    parentLevelCategory: mainCategory, // 부모 카테고리명
                    parentLevelSlug: level1Category.slug, // 부모의 slug
                    children,
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
}
