import { ApiProperty } from '@nestjs/swagger';

/**
 * 회사 연혁 항목
 */
export class HistoryItemDto {
    @ApiProperty({ description: '연도', example: '2020' })
    year: string;

    @ApiProperty({ description: '월', example: '03', required: false })
    month?: string;

    @ApiProperty({ description: '설명 (영어)', example: 'Established Korea Kitagawa' })
    description: string;

    @ApiProperty({ description: '설명 (한글)', example: '한국 기타가와 설립' })
    descriptionKo: string;
}

/**
 * 인증서 항목
 */
export class CertificationItemDto {
    @ApiProperty({ description: '인증명 (영어)', example: 'ISO 9001:2015' })
    name: string;

    @ApiProperty({ description: '인증명 (한글)', example: 'ISO 9001:2015 품질경영시스템 인증' })
    nameKo: string;

    @ApiProperty({ description: '발급 기관', example: 'Korea Quality Assurance', required: false })
    issuer?: string;

    @ApiProperty({ description: '발급 기관 (한글)', example: '한국품질보증', required: false })
    issuerKo?: string;

    @ApiProperty({ description: '발급일', example: '2020-05-15', required: false })
    issuedDate?: string;

    @ApiProperty({ description: '인증서 이미지 URL', example: 'https://example.com/cert.jpg', required: false })
    certificateUrl?: string;
}

/**
 * 회사 인사말
 */
export class CompanyGreetingDto {
    @ApiProperty({ description: '제목 (영어)', example: 'CEO Greeting' })
    title: string;

    @ApiProperty({ description: '제목 (한글)', example: '대표 인사말' })
    titleKo: string;

    @ApiProperty({ description: '내용 (영어)', example: 'Welcome to Korea Kitagawa...' })
    content: string;

    @ApiProperty({ description: '내용 (한글)', example: '한국 기타가와를 찾아주셔서 감사합니다...' })
    contentKo: string;

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

    @ApiProperty({ description: '회사 연혁', type: [HistoryItemDto] })
    history: HistoryItemDto[];

    @ApiProperty({ description: '비전 (영어)', example: 'To be the best...', required: false })
    vision?: string;

    @ApiProperty({ description: '비전 (한글)', example: '최고의 기업이 되겠습니다...', required: false })
    visionKo?: string;

    @ApiProperty({ description: '미션 (영어)', example: 'Provide quality products...', required: false })
    mission?: string;

    @ApiProperty({ description: '미션 (한글)', example: '고품질 제품을 제공합니다...', required: false })
    missionKo?: string;

    @ApiProperty({ description: '인증서 목록', type: [CertificationItemDto] })
    certifications: CertificationItemDto[];
}
