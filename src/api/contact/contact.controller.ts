import {
    Controller,
    Get,
    Post,
    Body,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { ContactService } from './contact.service';

import { CreateContactRequestDto } from './dto/request/create-contact-request.dto';

/**
 * Contact Public API
 * 인증 없이 접근 가능한 서비스 문의 및 연락처 조회 API
 */
@ApiTags('연락처')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    /**
     * 문의 첨부파일 업로드 (공개 API)
     */
    @Post('upload-attachment')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: '문의 첨부파일 업로드 (공개)',
        description: `
Contact Us 페이지의 서비스 문의 폼에서 첨부파일을 업로드합니다.

- 파일 크기 제한: 5MB
- 지원 파일 형식: 이미지, PDF, 문서 파일
- 인증 불필요 (공개 API)

업로드된 파일은 GCS에 저장되며, 반환된 URL을 service-request API의 attachmentUrl로 전송하세요.
        `,
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '업로드할 첨부파일',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '업로드 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '파일 업로드 성공',
                data: {
                    url: 'https://storage.googleapis.com/kitagawa-cdn/contact/1234567890-document.pdf',
                },
            },
        },
    })
    @SwaggerResponse({ status: HttpStatus.BAD_REQUEST, description: '파일 없음 또는 크기 초과' })
    async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
        // 파일 검증
        if (!file) {
            throw new BadRequestException('파일이 필요합니다');
        }

        // 파일 크기 검증 (5MB 제한)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다');
        }

        // 업로드
        const url = await this.contactService.uploadAttachment(file);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '파일 업로드 성공',
            data: { url },
        };
    }

    /**
     * 서비스 문의 접수
     */
    @Post('service-request')
    @ApiOperation({
        summary: '서비스 문의 접수',
        description: `
Contact Us 페이지에서 서비스 문의를 접수합니다.

필수 입력 사항:
- 담당자명
- 업체명
- 이메일
- 전화번호 (하이픈 없이 10-11자리)
- 문의사항 (최대 200자)
- 개인정보 수집 동의

선택 입력 사항:
- 첨부파일 URL
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '문의 접수 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '서비스 문의가 성공적으로 접수되었습니다',
                data: {
                    id: '507f1f77bcf86cd799439011',
                    submittedAt: '2025-01-15T10:30:00.000Z',
                },
            },
        },
    })
    @SwaggerResponse({ status: HttpStatus.BAD_REQUEST, description: '입력 데이터 검증 실패' })
    async createContactRequest(@Body() createDto: CreateContactRequestDto) {
        const contactRequest = await this.contactService.createContactRequest(createDto);

        return {
            success: true,
            code: HttpStatus.CREATED,
            message: '서비스 문의가 성공적으로 접수되었습니다',
            data: {
                id: contactRequest._id,
                submittedAt: (contactRequest as any).createdAt,
            },
        };
    }

    /**
     * 회사 연락처 정보 조회
     */
    @Get('info')
    @ApiOperation({
        summary: '회사 연락처 정보 조회',
        description: `
회사의 연락처 정보를 조회합니다.

포함 정보:
- 회사명, 대표자
- 본사 주소
- 전화번호, 팩스, 이메일
- 지점/서비스센터 목록 (위치, 연락처, 지도 좌표)
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '연락처 정보 조회 성공',
                data: {
                    companyName: 'Korea Kitagawa Co., Ltd.',
                    companyNameKo: '(주) 한국 기타가와',
                    ceo: '최민형',
                    address: '서울 금천구 가산디지털1로 168 우림라이온스벨리 B동 803호',
                    phone: '02-2026-2222',
                    mobile: '010-3616-9973',
                    email: 'kiw@kitagawa.co.kr',
                    locations: [
                        {
                            name: 'Headquarters',
                            nameKo: '본사',
                            type: 'headquarters',
                            address: '서울 금천구 가산디지털1로 168 우림라이온스벨리 B동 803호',
                            phone: '02-2026-2222',
                            coordinates: { lat: 37.4812845, lng: 126.8821449 },
                        },
                    ],
                },
            },
        },
    })
    async getContactInfo() {
        const contactInfo = await this.contactService.getContactInfo();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '연락처 정보 조회 성공',
            data: contactInfo,
        };
    }
}
