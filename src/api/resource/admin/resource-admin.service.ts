import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Resource, ResourceDocument } from '../../../schema/resource.schema';

import { ResourceAdminFilterRequestDto } from './dto/request/resource-admin-filter-request.dto';
import { ResourceAdminCreateRequestDto } from './dto/request/resource-admin-create-request.dto';
import { ResourceAdminUpdateRequestDto } from './dto/request/resource-admin-update-request.dto';
import { ResourceAdminDetailResponseDto } from './dto/response/resource-admin-response.dto';

/**
 * Resource Admin Service
 * 자료 관리 기능
 */
@Injectable()
export class ResourceAdminService {
    constructor(
        @InjectModel(Resource.name)
        private readonly resourceModel: Model<ResourceDocument>,
    ) {}

    /**
     * 자료 목록 조회
     */
    async findAll(filterDto: ResourceAdminFilterRequestDto) {
        const { keyword, type, category, isActive, isFeatured, page = 1, limit = 20 } = filterDto;

        // 필터 조건 구성
        const filter: any = {};

        if (keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { titleKo: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { descriptionKo: { $regex: keyword, $options: 'i' } },
            ];
        }

        if (type) {
            filter.type = type;
        }

        if (category) {
            filter.categories = category;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive;
        }

        if (isFeatured !== undefined) {
            filter.isFeatured = isFeatured;
        }

        // 페이지네이션
        const skip = (page - 1) * limit;

        const [resources, total] = await Promise.all([
            this.resourceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.resourceModel.countDocuments(filter).exec(),
        ]);

        return {
            resources: resources.map(this.toResponseDto),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: skip + limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * 자료 상세 조회
     */
    async findById(id: string): Promise<ResourceAdminDetailResponseDto> {
        const resource = await this.resourceModel.findById(id).lean().exec();

        if (!resource) {
            throw new NotFoundException('자료를 찾을 수 없습니다');
        }

        return this.toResponseDto(resource);
    }

    /**
     * 자료 생성
     */
    async create(createDto: ResourceAdminCreateRequestDto): Promise<ResourceAdminDetailResponseDto> {
        const resource = new this.resourceModel(createDto);
        await resource.save();

        return this.toResponseDto(resource.toObject());
    }

    /**
     * 자료 수정
     */
    async update(id: string, updateDto: ResourceAdminUpdateRequestDto): Promise<ResourceAdminDetailResponseDto> {
        const resource = await this.resourceModel.findByIdAndUpdate(id, updateDto, { new: true }).lean().exec();

        if (!resource) {
            throw new NotFoundException('자료를 찾을 수 없습니다');
        }

        return this.toResponseDto(resource);
    }

    /**
     * 자료 삭제
     */
    async delete(id: string): Promise<void> {
        const result = await this.resourceModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException('자료를 찾을 수 없습니다');
        }
    }

    /**
     * 자료 활성화
     */
    async activate(id: string): Promise<ResourceAdminDetailResponseDto> {
        const resource = await this.resourceModel
            .findByIdAndUpdate(id, { isActive: true }, { new: true })
            .lean()
            .exec();

        if (!resource) {
            throw new NotFoundException('자료를 찾을 수 없습니다');
        }

        return this.toResponseDto(resource);
    }

    /**
     * 자료 비활성화
     */
    async deactivate(id: string): Promise<ResourceAdminDetailResponseDto> {
        const resource = await this.resourceModel
            .findByIdAndUpdate(id, { isActive: false }, { new: true })
            .lean()
            .exec();

        if (!resource) {
            throw new NotFoundException('자료를 찾을 수 없습니다');
        }

        return this.toResponseDto(resource);
    }

    /**
     * Entity to DTO 변환
     */
    private toResponseDto(resource: any): ResourceAdminDetailResponseDto {
        return {
            _id: resource._id.toString(),
            title: resource.title,
            description: resource.description,
            type: resource.type,
            categories: resource.categories || [],
            tags: resource.tags || [],
            file: {
                url: resource.file.url,
                fileName: resource.file.fileName,
                fileSize: resource.file.fileSize,
                mimeType: resource.file.mimeType,
            },
            thumbnailUrl: resource.thumbnailUrl,
            previewUrl: resource.previewUrl,
            viewCount: resource.viewCount || 0,
            downloadCount: resource.downloadCount || 0,
            isActive: resource.isActive,
            isFeatured: resource.isFeatured || false,
            order: resource.order || 0,
            publishedAt: resource.publishedAt,
            metadata: resource.metadata,
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
        };
    }
}
