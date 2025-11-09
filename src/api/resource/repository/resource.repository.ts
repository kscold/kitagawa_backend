import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Resource, ResourceDocument, ResourceType } from '../../../schemas/resource.schema';

/**
 * Resource Repository
 * 순수한 데이터베이스 쿼리만 담당
 */
@Injectable()
export class ResourceRepository {
    constructor(@InjectModel(Resource.name) private readonly resourceModel: Model<ResourceDocument>) {}

    /**
     * 자료 목록 조회 (필터, 페이지네이션 포함)
     */
    async findAllWithPagination(filters: {
        type?: ResourceType;
        category?: string;
        keyword?: string;
        fileType?: string;
        isActive?: boolean;
        limit?: number;
        skip?: number;
    }): Promise<{ resources: ResourceDocument[]; total: number }> {
        const query: Record<string, any> = {};
        const andConditions: any[] = [];

        if (filters.type) {
            query.type = filters.type;
        }

        if (filters.category) {
            query.categories = filters.category;
        }

        if (filters.keyword) {
            andConditions.push({
                $or: [
                    { title: { $regex: filters.keyword, $options: 'i' } },
                    { titleKo: { $regex: filters.keyword, $options: 'i' } },
                    { description: { $regex: filters.keyword, $options: 'i' } },
                    { descriptionKo: { $regex: filters.keyword, $options: 'i' } },
                    { tags: { $regex: filters.keyword, $options: 'i' } },
                    { 'metadata.productName': { $regex: filters.keyword, $options: 'i' } },
                    { 'metadata.model': { $regex: filters.keyword, $options: 'i' } },
                ],
            });
        }

        if (filters.fileType) {
            // 파일 타입으로 필터링 (확장자 또는 mimeType 기반)
            const fileExtension = `.${filters.fileType}`;
            andConditions.push({
                $or: [
                    { 'file.fileName': { $regex: `\\${fileExtension}$`, $options: 'i' } },
                    { 'file.mimeType': { $regex: filters.fileType, $options: 'i' } },
                ],
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        // Total count
        const total = await this.resourceModel.countDocuments(query).exec();

        // Query builder (order는 오름차순으로 정렬)
        let queryBuilder: any = this.resourceModel.find(query).sort({ isFeatured: -1, order: 1, publishedAt: -1 });

        if (filters.skip !== undefined) {
            queryBuilder = queryBuilder.skip(filters.skip);
        }

        if (filters.limit !== undefined) {
            queryBuilder = queryBuilder.limit(filters.limit);
        }

        const resources = (await queryBuilder.exec()) as ResourceDocument[];

        return { resources, total };
    }

    /**
     * ID로 자료 조회
     */
    async findById(id: string): Promise<ResourceDocument | null> {
        const query: any = this.resourceModel.findById(id);
        return (await query.exec()) as ResourceDocument | null;
    }

    /**
     * 조회수 증가
     */
    async incrementViewCount(id: string): Promise<void> {
        await this.resourceModel.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).exec();
    }

    /**
     * 다운로드 수 증가
     */
    async incrementDownloadCount(id: string): Promise<void> {
        await this.resourceModel.updateOne({ _id: id }, { $inc: { downloadCount: 1 } }).exec();
    }

    /**
     * 자료 타입 목록 조회 (통계)
     */
    async getResourceTypeStats(): Promise<{ type: ResourceType; count: number }[]> {
        return (await this.resourceModel
            .aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        type: '$_id',
                        count: 1,
                    },
                },
                { $sort: { count: -1 } },
            ])
            .exec()) as { type: ResourceType; count: number }[];
    }

    /**
     * 추천 자료 조회
     */
    async findFeatured(limit: number): Promise<ResourceDocument[]> {
        const query: any = this.resourceModel
            .find({ isFeatured: true, isActive: true })
            .sort({ order: -1, publishedAt: -1 })
            .limit(limit);
        return (await query.exec()) as ResourceDocument[];
    }

    /**
     * 인기 자료 조회 (다운로드 수 기준)
     */
    async findPopular(limit: number): Promise<ResourceDocument[]> {
        const query: any = this.resourceModel
            .find({ isActive: true })
            .sort({ downloadCount: -1, viewCount: -1 })
            .limit(limit);
        return (await query.exec()) as ResourceDocument[];
    }

    /**
     * 최신 자료 조회
     */
    async findRecent(limit: number): Promise<ResourceDocument[]> {
        const query: any = this.resourceModel
            .find({ isActive: true })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(limit);
        return (await query.exec()) as ResourceDocument[];
    }
}
