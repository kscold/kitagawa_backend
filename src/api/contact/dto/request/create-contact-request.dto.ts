import { IsString, IsEmail, IsNotEmpty, MaxLength, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 서비스 문의 접수 DTO
 * 피그마 "Contact Us" 페이지의 서비스 접수 폼
 */
export class CreateContactRequestDto {
    @ApiProperty({
        description: '담당자명',
        example: '홍길동',
    })
    @IsString()
    @IsNotEmpty({ message: '담당자명을 입력해주세요' })
    managerName: string;

    @ApiProperty({
        description: '업체명',
        example: '(주)테스트컴퍼니',
    })
    @IsString()
    @IsNotEmpty({ message: '업체명을 입력해주세요' })
    companyName: string;

    @ApiProperty({
        description: '이메일',
        example: 'manager@example.com',
    })
    @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요' })
    @IsNotEmpty({ message: '이메일을 입력해주세요' })
    email: string;

    @ApiProperty({
        description: '전화번호 (하이픈 없이)',
        example: '01012345678',
    })
    @IsString()
    @IsNotEmpty({ message: '전화번호를 입력해주세요' })
    @Matches(/^[0-9]{10,11}$/, { message: '올바른 전화번호 형식을 입력해주세요 (하이픈 없이 10-11자리)' })
    phone: string;

    @ApiProperty({
        description: '문의사항 (최대 200자)',
        example: '제품에 대한 상세한 견적을 요청드립니다.',
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty({ message: '문의사항을 입력해주세요' })
    @MaxLength(200, { message: '문의사항은 최대 200자까지 입력 가능합니다' })
    message: string;

    @ApiProperty({
        description: '첨부파일 URL (선택)',
        example: 'https://storage.example.com/files/document.pdf',
        required: false,
    })
    @IsString()
    @IsOptional()
    attachmentUrl?: string;

    @ApiProperty({
        description: '개인정보 수집 및 이용 동의',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty({ message: '개인정보 수집 및 이용에 동의해주세요' })
    privacyConsent: boolean;
}
