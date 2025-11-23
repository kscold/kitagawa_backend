import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateProductNameDto {
    @ApiProperty({
        description: '제품명',
        example: 'BR series',
    })
    @IsString()
    @IsNotEmpty()
    productName: string;
}
