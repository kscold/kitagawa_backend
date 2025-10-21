import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 인사말 수정 DTO
 */
export class UpdateGreetingRequestDto {
    @ApiProperty({
        description: '제목 (영어)',
        example: 'CEO Greeting',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: '제목 (한글)',
        example: '대표 인사말',
    })
    @IsString()
    @IsNotEmpty()
    titleKo: string;

    @ApiProperty({
        description: '내용 (영어)',
        example: 'Welcome to Korea Kitagawa. We are committed to providing the best products and services.',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: '내용 (한글)',
        example: '(주) 한국 기타가와를 찾아주셔서 감사합니다.',
    })
    @IsString()
    @IsNotEmpty()
    contentKo: string;

    @ApiPropertyOptional({
        description: '대표자명',
        example: '최민형',
    })
    @IsString()
    @IsOptional()
    ceoName?: string;

    @ApiPropertyOptional({
        description: '서명 이미지 URL',
        example: 'https://example.com/signature.png',
    })
    @IsString()
    @IsOptional()
    ceoSignatureUrl?: string;
}
