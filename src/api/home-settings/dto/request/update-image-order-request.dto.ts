import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

/**
 * 이미지 순서 변경 요청 DTO
 */
export class UpdateImageOrderRequestDto {
    @ApiProperty({
        description: '이미지 URL 배열 (순서대로)',
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(5)
    @IsString({ each: true })
    imageUrls: string[]; // 순서대로 정렬된 이미지 URL 배열
}
