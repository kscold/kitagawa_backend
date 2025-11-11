import { ApiProperty } from '@nestjs/swagger';

/**
 * 회사 인사말
 */
export class CompanyGreetingDto {
    @ApiProperty({ description: '제목 (영어)', example: 'CEO Greeting' })
    title: string;

    @ApiProperty({ description: '내용 (영어)', example: 'Welcome to Korea Kitagawa...' })
    content: string;

    @ApiProperty({ description: '대표자명', example: '최민형', required: false })
    ceoName?: string;

    @ApiProperty({ description: '서명 이미지 URL', required: false })
    ceoSignatureUrl?: string;
}

/**
 * 회사 정보 응답 DTO
 */
export class CompanyInfoResponseDto {
    @ApiProperty({ description: '인사말', type: CompanyGreetingDto, required: false })
    greeting?: CompanyGreetingDto;

    @ApiProperty({ description: '비전 (영어)', example: 'To be the best...', required: false })
    vision?: string;

    @ApiProperty({ description: '미션 (영어)', example: 'Provide quality products...', required: false })
    mission?: string;
}
