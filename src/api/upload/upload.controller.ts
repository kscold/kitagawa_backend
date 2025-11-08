import {
    Controller,
    Post,
    Delete,
    UseInterceptors,
    UploadedFile,
    Query,
    Body,
    HttpStatus,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse as SwaggerResponse, ApiQuery } from '@nestjs/swagger';

import { UploadService } from './upload.service';
import { FileUploadResponseDto } from './dto/upload-response.dto';
import { AdminJwtAuthGuard } from '../../common/guard/admin-jwt-auth.guard';

/**
 * Upload API (Admin Only)
 * 파일 업로드 및 삭제
 */
@ApiTags('Upload (Admin)')
@Controller('upload-admin')
@UseGuards(AdminJwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    /**
     * 파일 업로드
     */
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: '파일 업로드',
        description: `
파일을 GCP Cloud Storage에 업로드합니다.

지원되는 폴더:
- banner: 배너 이미지
- product: 제품 이미지
- resource: 자료실 파일
- company: 회사 소개 이미지
- category: 카테고리 이미지

업로드된 파일은 공개 URL로 접근 가능하며, 1년간 브라우저 캐싱됩니다.
        `,
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file', 'folder'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '업로드할 파일',
                },
                folder: {
                    type: 'string',
                    description: '저장할 폴더명 (banner, product, resource, company, category)',
                    example: 'product',
                },
            },
        },
    })
    @ApiQuery({
        name: 'folder',
        description: '저장할 폴더명',
        example: 'product',
        required: true,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '업로드 성공',
        type: FileUploadResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '파일 업로드 성공',
                data: {
                    url: 'https://storage.googleapis.com/kitagawa-cdn/product/1234567890-sample.jpg',
                    path: 'product/1234567890-sample.jpg',
                    folder: 'product',
                    fileName: '1234567890-sample.jpg',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (파일 없음, 잘못된 폴더명)',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Query('folder') folder: string) {
        // 파일 검증
        if (!file) {
            throw new BadRequestException('파일이 필요합니다');
        }

        // 폴더 검증
        if (!folder) {
            throw new BadRequestException('폴더명이 필요합니다');
        }

        if (!this.uploadService.validateFolder(folder)) {
            throw new BadRequestException(
                '잘못된 폴더명입니다. 허용된 폴더: banner, product, resource, company, category',
            );
        }

        // 파일 크기 검증 (10MB 제한)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');
        }

        // 업로드
        const url = await this.uploadService.uploadFile(file, folder);

        // 결과 생성
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const path = `${folder}/${fileName}`;

        return {
            success: true,
            code: HttpStatus.CREATED,
            message: '파일 업로드 성공',
            data: {
                url,
                path,
                folder,
                fileName,
            },
        };
    }

    /**
     * 파일 삭제
     */
    @Delete()
    @ApiOperation({
        summary: '파일 삭제',
        description: `
GCP Cloud Storage에서 파일을 삭제합니다.
파일의 공개 URL을 전달하면 해당 파일이 삭제됩니다.
        `,
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['url'],
            properties: {
                url: {
                    type: 'string',
                    description: '삭제할 파일의 공개 URL',
                    example: 'https://storage.googleapis.com/kitagawa-cdn/product/1234567890-sample.jpg',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '삭제 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (URL 없음, 잘못된 URL)',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async deleteFile(@Body('url') url: string) {
        // URL 검증
        if (!url) {
            throw new BadRequestException('파일 URL이 필요합니다');
        }

        // 삭제
        await this.uploadService.deleteFile(url);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '파일 삭제 성공',
            data: null,
        };
    }
}
