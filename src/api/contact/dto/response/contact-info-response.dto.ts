import { ApiProperty } from '@nestjs/swagger';

/**
 * 회사 연락처 정보 응답 DTO
 */
export class LocationInfo {
    @ApiProperty({ description: '장소명', example: '본사' })
    name: string;

    @ApiProperty({ description: '장소명 (한글)', example: '본사' })
    nameKo: string;

    @ApiProperty({
        description: '장소 타입',
        example: 'headquarters',
        enum: ['headquarters', 'service_center', 'factory'],
    })
    type: 'headquarters' | 'service_center' | 'factory';

    @ApiProperty({ description: '주소', example: '서울 금천구 가산디지털1로 168 우림라이온스벨리 B동 803호' })
    address: string;

    @ApiProperty({ description: '전화번호', example: '02-2026-2222', required: false })
    phone?: string;

    @ApiProperty({ description: '팩스', example: '02-2026-2223', required: false })
    fax?: string;

    @ApiProperty({
        description: '좌표 (지도 표시용)',
        example: { lat: 37.4812845, lng: 126.8821449 },
        required: false,
    })
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export class ContactInfoResponseDto {
    @ApiProperty({ description: '회사명', example: '(주) 한국 기타가와' })
    companyName: string;

    @ApiProperty({ description: '회사명 (한글)', example: '(주) 한국 기타가와' })
    companyNameKo: string;

    @ApiProperty({ description: '대표자', example: '최민형' })
    ceo: string;

    @ApiProperty({ description: '본사 주소', example: '서울 금천구 가산디지털1로 168 우림라이온스벨리 B동 803호' })
    address: string;

    @ApiProperty({ description: '대표 전화', example: '02-2026-2222' })
    phone: string;

    @ApiProperty({ description: '휴대전화', example: '010-3616-9973' })
    mobile: string;

    @ApiProperty({ description: '팩스', example: '02-2026-2223', required: false })
    fax?: string;

    @ApiProperty({ description: '이메일', example: 'kiw@kitagawa.co.kr' })
    email: string;

    @ApiProperty({ description: '웹사이트', example: 'https://www.kitagawa.co.kr', required: false })
    website?: string;

    @ApiProperty({
        description: '지점/서비스센터 목록',
        type: [LocationInfo],
    })
    locations: LocationInfo[];
}
