import { Controller, Get, Param, Query, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam } from '@nestjs/swagger';

import { ResourceService } from './resource.service';

import { ResourceFilterDto } from './dto/request/resource-filter.dto';
import {
    ResourceListResponseDto,
    ResourceDetailResponseDto,
    ResourceDownloadResponseDto,
    ResourceTypeStatsResponseDto,
} from './dto/response/resource-response.dto';

/**
 * 자료실 Public API
 * 인증 없이 접근 가능한 조회 API만 제공
 */
@ApiTags('Resources')
@Controller('resources')
export class ResourceController {
    constructor(private readonly resourceService: ResourceService) {}

    /**
     * 자료실 통합 검색 (카테고리 무관)
     */
    @Get('search')
    @ApiOperation({
        summary: '자료실 통합 검색',
        description: `
## 개요
카테고리 구분 없이 **모든 자료**를 검색합니다.

## 검색 파라미터
### keyword (필수)
검색어를 입력합니다.
- 예: \`?keyword=GT200\` - "GT200" 검색
- 예: \`?keyword=척\` - "척" 포함 자료 검색
- 대소문자 구분 없음
- 한글/영문 모두 지원

**검색 대상 필드:**
- 제품명 (metadata.productName)
- 모델명 (metadata.model)
- 자료 제목 (title, titleKo)
- 설명 (description, descriptionKo)
- 태그 (tags)

### fileType (선택)
파일 형식 필터
- \`pdf\`: PDF 파일만
- \`dwg\`: DWG 파일만
- 미지정: 모든 파일

### category (선택)
특정 카테고리로 제한
- \`nc-rotary-table\`, \`vise\`, \`chuck\`, \`cylinder\`, \`work-gripper\`

### page, limit (선택)
페이지네이션 (기본: page=1, limit=50)

## 응답 구조
\`\`\`json
{
  "items": [
    {
      "productName": "GT series",
      "model": "GT200",
      "category": "chuck",           // 어느 카테고리 자료인지
      "pdfUrl": "http://...",
      "dwgUrl": "http://...",
      "imageUrl": "http://...",
      "order": 1
    }
  ],
  "pagination": { ... }
}
\`\`\`

## 사용 예제
1. 기본 검색: \`GET /api/resources/search?keyword=GT200\`
2. PDF만: \`GET /api/resources/search?keyword=GT&fileType=pdf\`
3. 카테고리 제한: \`GET /api/resources/search?keyword=GT&category=chuck\`
4. 복합: \`GET /api/resources/search?keyword=GT&fileType=pdf&category=chuck&page=1\`
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '검색 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '자료 검색 성공',
                data: {
                    items: [
                        {
                            productName: 'GT series',
                            model: 'GT200',
                            category: 'chuck',
                            pdfUrl: 'http://prod.kiw.co.jp/mtools/inc/data/PDF/GT200.pdf',
                            dwgUrl: 'http://prod.kiw.co.jp/mtools/inc/data/DWG/GT200.dwg',
                            imageUrl: 'https://www.kitagawa.com/en/mtools/item/GT_b.jpg',
                            order: 1,
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: 1,
                        itemsPerPage: 50,
                        hasNextPage: false,
                        hasPrevPage: false,
                    },
                },
            },
        },
    })
    async searchResources(@Query() filterDto: ResourceFilterDto) {
        // keyword가 없으면 에러
        if (!filterDto.keyword) {
            return {
                success: false,
                code: HttpStatus.BAD_REQUEST,
                message: '검색어(keyword)를 입력해주세요',
                data: null,
            };
        }

        const result = await this.resourceService.searchResourcesGrouped({
            keyword: filterDto.keyword,
            category: filterDto.category,
            fileType: filterDto.fileType,
            page: filterDto.page,
            limit: filterDto.limit,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 검색 성공',
            data: result,
        };
    }

    /**
     * Level1 카테고리 탭 목록 조회
     */
    @Get('level1')
    @ApiOperation({
        summary: 'Level1 카테고리 탭 목록 조회',
        description: `
자료실 페이지의 카테고리 탭 목록을 조회합니다.

반환되는 카테고리:
- nc-rotary-table: NC ROTARY TABLE
- vise: VISE
- chuck: CHUCK
- cylinder: CYLINDER
- work-gripper: WORK GRIPPER

각 카테고리별 자료 개수도 함께 반환됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '자료실 카테고리 목록 조회 성공',
                data: [
                    {
                        _id: '68f796b7606cfb8026dbff3c',
                        name: 'NC ROTARY TABLE',
                        slug: 'nc-rotary-table',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/MK200R_right.jpg',
                        content: 'Compact & high accuracy Combination with chuck is available.',
                        order: 0,
                        count: 111,
                    },
                    {
                        _id: '68f796b8606cfb8026dbff4e',
                        name: 'VISE',
                        slug: 'vise',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/VE125N_new.jpg',
                        content: 'Toggle joint mechanism Long jaw stroke',
                        order: 1,
                        count: 27,
                    },
                    {
                        _id: '68f796b8606cfb8026dbff5d',
                        name: 'CHUCK',
                        slug: 'chuck',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/BR08_right.jpg',
                        content: "Wide variety of world's standard power chuck",
                        order: 2,
                        count: 243,
                    },
                    {
                        _id: '68f796b9606cfb8026dbff72',
                        name: 'CYLINDER',
                        slug: 'cylinder',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/data/IMG/SR1677C.jpg',
                        content:
                            'High performance Rotary Cylinder is integral to for the operation of a power chuck and extracts the maximum capability of the chuck.',
                        order: 3,
                        count: 42,
                    },
                    {
                        _id: '68f796b9606cfb8026dbff7e',
                        name: 'WORK GRIPPER',
                        slug: 'work-gripper',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/itemCatImg07.jpg',
                        content: 'Stationary power chuck with built-in cylinder',
                        order: 4,
                        count: 16,
                    },
                ],
            },
        },
    })
    async getLevel1Categories() {
        const categoriesWithCount = await this.resourceService.getLevel1CategoriesWithResourceCount();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료실 카테고리 목록 조회 성공',
            data: categoriesWithCount,
        };
    }

    /**
     * Level2 카테고리별 자료 조회
     */
    @Get('level2/:slug')
    @ApiOperation({
        summary: 'Level2 카테고리별 자료 조회 (제품별 PDF/DWG 그룹화)',
        description: `
## 개요
Level2 카테고리(제품군)별 자료를 **제품 모델별로 그룹화**하여 조회합니다.

## 지원 카테고리
- \`nc-rotary-table\`: NC ROTARY TABLE
- \`vise\`: VISE
- \`chuck\`: CHUCK
- \`cylinder\`: CYLINDER
- \`work-gripper\`: WORK GRIPPER

## 검색 및 필터링
### keyword (선택)
제품명, 모델명, 제목, 설명을 통합 검색합니다.
- 예: \`?keyword=GT200\` - "GT200" 모델 검색
- 예: \`?keyword=rotary\` - "rotary" 포함 제품 검색
- 대소문자 구분 없음 (Case-insensitive)
- 한글/영문 모두 지원

검색 대상 필드:
- metadata.productName (제품명)
- metadata.model (모델명)
- title, titleKo (자료 제목)
- description, descriptionKo (설명)
- tags (태그)

### fileType (선택)
파일 형식으로 필터링합니다.
- \`pdf\`: PDF 파일만
- \`dwg\`: DWG 파일만
- 미지정: 모든 파일

## 페이지네이션
- \`page\`: 페이지 번호 (기본값: 1)
- \`limit\`: 페이지당 아이템 수 (기본값: 50)

## 응답 구조
각 제품 모델별로 PDF와 DWG를 그룹화하여 반환합니다:
\`\`\`json
{
  "items": [
    {
      "productName": "GT series",      // 제품명
      "model": "GT200",                 // 모델명
      "pdfUrl": "http://...",          // PDF 다운로드 URL
      "dwgUrl": "http://...",          // DWG 다운로드 URL
      "imageUrl": "http://...",        // 제품 이미지 URL
      "order": 1                        // 정렬 순서
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 56,
    "itemsPerPage": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
\`\`\`

## 사용 예제
1. 기본 조회: \`GET /api/resources/level2/chuck\`
2. 검색: \`GET /api/resources/level2/chuck?keyword=GT200\`
3. PDF만: \`GET /api/resources/level2/chuck?fileType=pdf\`
4. 페이지네이션: \`GET /api/resources/level2/chuck?page=2&limit=20\`
5. 복합: \`GET /api/resources/level2/chuck?keyword=GT&fileType=pdf&page=1\`

## 정렬 순서
1. order 값 기준 오름차순 (order=0은 마지막)
2. 같은 order면 productName 알파벳 순
        `,
    })
    @ApiParam({
        name: 'slug',
        description: 'Level2 카테고리 slug',
        example: 'nc-rotary-table',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceListResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '카테고리별 자료 조회 성공',
                data: {
                    items: [
                        {
                            productName: 'GT series',
                            model: 'GT200',
                            pdfUrl: 'http://prod.kiw.co.jp/mtools/inc/data/PDF/DHP-61E271433.pdf',
                            dwgUrl: 'http://prod.kiw.co.jp/mtools/inc/data/DWG/DHP-61E271433.dwg',
                        },
                        {
                            productName: 'GT series',
                            model: 'GT250',
                            pdfUrl: 'http://prod.kiw.co.jp/mtools/inc/data/PDF/DHP-61E271434.pdf',
                            dwgUrl: 'http://prod.kiw.co.jp/mtools/inc/data/DWG/DHP-61E271434.dwg',
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 3,
                        totalItems: 56,
                        itemsPerPage: 50,
                        hasNextPage: true,
                        hasPreviousPage: false,
                    },
                },
            },
        },
    })
    async findByLevel2Category(@Param('slug') slug: string, @Query() filterDto: ResourceFilterDto) {
        const result = await this.resourceService.findResourcesByLevel2CategoryGrouped(slug, {
            keyword: filterDto.keyword,
            fileType: filterDto.fileType,
            page: filterDto.page,
            limit: filterDto.limit,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리별 자료 조회 성공',
            data: result,
        };
    }

    /**
     * 다운로드 수 증가
     */
    @Post(':id/download')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '다운로드 수 증가',
        description: `
자료 다운로드 시 다운로드 수를 증가시킵니다.

사용 시나리오:
1. 사용자가 다운로드 버튼 클릭
2. 프론트엔드에서 이 API 호출
3. downloadCount가 1 증가
4. 실제 파일 다운로드 진행

통계 집계에 사용됩니다.
        `,
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '68ea5e4efb9a341dff2f609d',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '증가 성공',
        type: ResourceDownloadResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '다운로드 수 증가 성공',
            },
        },
    })
    async incrementDownloadCount(@Param('id') id: string) {
        await this.resourceService.incrementDownloadCount(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '다운로드 수 증가 성공',
            data: null,
        };
    }
}
