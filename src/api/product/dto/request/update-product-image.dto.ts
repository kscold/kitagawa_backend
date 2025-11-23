import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateProductImageDto {
    @ApiProperty({
        description: '제품 메인 이미지 URL (CDN URL)',
        example: 'https://cdn.example.com/images/product-123.jpg',
    })
    @IsString()
    @IsNotEmpty()
    @IsUrl()
    mainImageUrl: string;
}
